import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { jobId } = await req.json();

    // Get job details and verify ownership
    const { data: videoJob, error: jobError } = await supabase
      .from('video_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single();

    if (jobError || !videoJob) {
      return new Response(JSON.stringify({ error: 'Job not found or access denied' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get updated subtitles
    const { data: subtitles, error: subtitlesError } = await supabase
      .from('video_subtitles')
      .select('*')
      .eq('video_job_id', jobId)
      .order('start_time', { ascending: true });

    if (subtitlesError) {
      return new Response(JSON.stringify({ error: 'Failed to fetch subtitles' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Download original video
    const { data: videoData, error: downloadError } = await supabase.storage
      .from('videos')
      .download(videoJob.input_file_path);

    if (downloadError) {
      return new Response(JSON.stringify({ error: 'Failed to download original video' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const videoBuffer = new Uint8Array(await videoData.arrayBuffer());

    // Generate new SRT content
    const srtContent = generateSRTContent(subtitles);
    
    // Create processed video with updated subtitles
    const processedVideoBuffer = await createVideoWithSubtitles(videoBuffer, subtitles);
    
    // Update files in storage
    const processedFileName = `${jobId}/processed_${videoJob.original_filename}`;
    const srtFileName = `${jobId}/subtitles.srt`;
    
    // Upload new SRT file
    await supabase.storage
      .from('processed-videos')
      .update(srtFileName, new TextEncoder().encode(srtContent), {
        contentType: 'text/plain',
        upsert: true
      });

    // Upload new processed video
    await supabase.storage
      .from('processed-videos')
      .update(processedFileName, processedVideoBuffer, {
        contentType: 'video/mp4',
        upsert: true
      });

    // Get URLs for response
    const { data: processedVideoUrl } = supabase.storage
      .from('processed-videos')
      .getPublicUrl(processedFileName);

    const { data: srtUrl } = supabase.storage
      .from('processed-videos')
      .getPublicUrl(srtFileName);

    return new Response(JSON.stringify({
      success: true,
      processedVideoUrl: processedVideoUrl.publicUrl,
      srtUrl: srtUrl.publicUrl
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Reprocessing error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateSRTContent(subtitles: any[]): string {
  return subtitles.map((subtitle, index) => {
    const startTime = formatSRTTime(subtitle.start_time);
    const endTime = formatSRTTime(subtitle.end_time);
    
    return `${index + 1}\n${startTime} --> ${endTime}\n${subtitle.text}\n`;
  }).join('\n');
}

function formatSRTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}

async function createVideoWithSubtitles(videoBuffer: Uint8Array, subtitles: any[]): Promise<Uint8Array> {
  console.log(`Reprocessing video with ${subtitles.length} subtitle segments`);
  
  try {
    // Use FFmpeg command via Deno subprocess
    const tempDir = await Deno.makeTempDir({ prefix: "subtitle_reprocess_" });
    const inputPath = `${tempDir}/input.mp4`;
    const srtPath = `${tempDir}/subtitles.srt`;
    const outputPath = `${tempDir}/output.mp4`;
    
    // Write video file
    await Deno.writeFile(inputPath, videoBuffer);
    
    // Write SRT file
    const srtContent = generateSRTContent(subtitles);
    await Deno.writeTextFile(srtPath, srtContent);
    
    console.log(`Files written to ${tempDir}`);
    
    // Use FFmpeg to burn subtitles
    const ffmpegArgs = [
      "-i", inputPath,
      "-vf", `subtitles=${srtPath}:force_style='FontName=Arial,FontSize=24,PrimaryColour=&Hffffff,OutlineColour=&H000000,BackColour=&H80000000,Bold=1,Outline=2,MarginV=30'`,
      "-c:a", "copy",
      "-preset", "ultrafast",
      "-y",
      outputPath
    ];
    
    try {
      const process = new Deno.Command("ffmpeg", {
        args: ffmpegArgs,
        stdout: "piped",
        stderr: "piped",
      });
      
      const { code, stderr } = await process.output();
      const stderrText = new TextDecoder().decode(stderr);
      
      if (code === 0) {
        const processedVideo = await Deno.readFile(outputPath);
        console.log(`Successfully processed video: ${processedVideo.length} bytes`);
        
        // Clean up
        await Deno.remove(tempDir, { recursive: true });
        return processedVideo;
      } else {
        console.error(`FFmpeg failed with code ${code}: ${stderrText}`);
        throw new Error(`FFmpeg processing failed: ${stderrText}`);
      }
      
    } catch (ffmpegError) {
      console.warn("FFmpeg not available or failed:", ffmpegError);
      
      // Clean up
      await Deno.remove(tempDir, { recursive: true });
      return videoBuffer; // Return original if FFmpeg fails
    }
    
  } catch (error) {
    console.error("Error in createVideoWithSubtitles:", error);
    return videoBuffer; // Return original if all fails
  }
}