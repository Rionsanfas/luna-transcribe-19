import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { FFmpeg } from "https://esm.sh/@ffmpeg/ffmpeg@0.12.7";
import { fetchFile, toBlobURL } from "https://esm.sh/@ffmpeg/util@0.12.1";

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

    const { jobId, editedText } = await req.json();

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

    console.log('Reprocessing subtitles for job:', jobId);
    console.log('Edited text provided:', !!editedText);

    // Download original video for re-timing
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

    // Re-time subtitles using Whisper if edited text is provided
    let finalSubtitles;
    if (editedText) {
      console.log('Re-timing subtitles with Whisper based on edited text');
      finalSubtitles = await retimeSubtitlesWithWhisper(videoBuffer, editedText);
      
      // Update database with new timed subtitles
      await supabase
        .from('video_subtitles')
        .delete()
        .eq('video_job_id', jobId);

      const subtitleInserts = finalSubtitles.map((subtitle: any) => ({
        video_job_id: jobId,
        start_time: subtitle.start,
        end_time: subtitle.end,
        text: subtitle.text,
        confidence: subtitle.confidence || 0.9,
        manual_edit: true,
      }));

      await supabase
        .from('video_subtitles')
        .insert(subtitleInserts);
        
    } else {
      // Get existing subtitles from database
      const { data: existingSubtitles, error: subtitlesError } = await supabase
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
      
      finalSubtitles = existingSubtitles;
    }

    // Generate new SRT content
    const srtContent = generateSRTContent(finalSubtitles);
    
    // Create processed video with updated subtitles
    const processedVideoBuffer = await createVideoWithSubtitles(videoBuffer, finalSubtitles);
    
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

// Re-time subtitles using Whisper based on edited text
async function retimeSubtitlesWithWhisper(videoBuffer: Uint8Array, editedText: string): Promise<any[]> {
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiKey) {
    throw new Error('OpenAI API key not configured');
  }

  console.log('Using Whisper to re-time edited subtitles');

  // Use Whisper for forced alignment to get precise timing
  const formData = new FormData();
  const blob = new Blob([videoBuffer], { type: 'video/mp4' });
  formData.append('file', blob, 'video.mp4');
  formData.append('model', 'whisper-1');
  formData.append('response_format', 'verbose_json');
  formData.append('timestamp_granularities[]', 'word');
  formData.append('timestamp_granularities[]', 'segment');

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Whisper re-timing failed: ${error}`);
  }

  const whisperResult = await response.json();
  console.log('Whisper segments for re-timing:', whisperResult.segments?.length || 0);

  // Parse edited text into segments (user may have edited the text)
  const editedLines = editedText.split('\n').filter(line => line.trim().length > 0);
  
  // Use GPT to align edited text with Whisper segments
  const alignmentResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a subtitle timing expert. Given original Whisper segments and edited text lines, create properly timed subtitles. Return JSON array with start, end, text, confidence fields. Ensure timing matches the audio segments.'
        },
        {
          role: 'user',
          content: `Original Whisper segments: ${JSON.stringify(whisperResult.segments)}\n\nEdited text lines: ${JSON.stringify(editedLines)}\n\nCreate timed subtitles matching the edited text to the audio timing.`
        }
      ],
      max_tokens: 2000,
      temperature: 0.1
    }),
  });

  if (!alignmentResponse.ok) {
    console.warn('GPT alignment failed, using Whisper segments as fallback');
    return whisperResult.segments?.map((segment: any) => ({
      start: segment.start,
      end: segment.end,
      text: segment.text.trim(),
      confidence: segment.avg_logprob || 0.9
    })) || [];
  }

  const alignmentResult = await alignmentResponse.json();
  let alignedSubtitles;

  try {
    alignedSubtitles = JSON.parse(alignmentResult.choices[0].message.content);
  } catch (parseError) {
    console.warn('Failed to parse alignment result, using Whisper segments');
    alignedSubtitles = whisperResult.segments?.map((segment: any) => ({
      start: segment.start,
      end: segment.end,
      text: segment.text.trim(),
      confidence: segment.avg_logprob || 0.9
    })) || [];
  }

  console.log('Final aligned subtitles count:', alignedSubtitles.length);
  return alignedSubtitles;
}

async function createVideoWithSubtitles(videoBuffer: Uint8Array, subtitles: any[]): Promise<Uint8Array> {
  console.log(`Reprocessing video with ${subtitles.length} subtitle segments using FFmpeg WASM`);
  
  try {
    // Initialize FFmpeg WASM
    const ffmpeg = new FFmpeg();
    
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.4/dist/umd';
    ffmpeg.on('log', ({ message }) => {
      console.log('FFmpeg Log:', message);
    });
    
    // Load FFmpeg
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });
    
    // Write input video to FFmpeg virtual filesystem
    await ffmpeg.writeFile('input.mp4', await fetchFile(new Blob([videoBuffer])));
    
    // Generate SRT content and write to filesystem
    const srtContent = generateSRTContent(subtitles);
    await ffmpeg.writeFile('subtitles.srt', srtContent);
    
    // Use default subtitle styling for reprocessing
    const subtitleFilter = `subtitles=subtitles.srt:force_style='FontName=Arial,FontSize=24,PrimaryColour=&Hffffff,OutlineColour=&H000000,BackColour=&H80000000,Bold=1,Outline=2,MarginV=30'`;
    
    // Run FFmpeg to burn subtitles
    await ffmpeg.exec([
      '-i', 'input.mp4',
      '-vf', subtitleFilter,
      '-c:a', 'copy',
      '-preset', 'ultrafast',
      '-y',
      'output.mp4'
    ]);
    
    // Read the processed video
    const data = await ffmpeg.readFile('output.mp4');
    const processedVideo = new Uint8Array(data as ArrayBuffer);
    
    // Validate video output
    const isValid = await validateVideoOutput(ffmpeg, 'output.mp4');
    if (!isValid) {
      console.error('Generated video is invalid, falling back to original');
      return videoBuffer;
    }
    
    console.log(`Successfully reprocessed video: ${processedVideo.length} bytes`);
    return processedVideo;
    
  } catch (error) {
    console.error("Error in createVideoWithSubtitles:", error);
    return videoBuffer; // Return original if all fails
  }
}

// Validate video output using FFmpeg probe
async function validateVideoOutput(ffmpeg: FFmpeg, filename: string): Promise<boolean> {
  try {
    await ffmpeg.exec(['-i', filename, '-f', 'null', '-']);
    return true;
  } catch (error) {
    console.error('Video validation failed:', error);
    return false;
  }
}