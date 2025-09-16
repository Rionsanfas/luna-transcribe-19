import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VideoJobRequest {
  processingType: 'transcription' | 'translation' | 'style-matching';
  videoFile: string; // base64 encoded video
  styleImageFile?: string; // base64 encoded image for style matching
  targetLanguage?: string; // for translation
  originalFilename: string;
}

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

    const body: VideoJobRequest = await req.json();
    const { processingType, videoFile, styleImageFile, targetLanguage, originalFilename } = body;

    // Convert base64 video to blob first to calculate file size
    const videoBuffer = Uint8Array.from(atob(videoFile), c => c.charCodeAt(0));
    const fileSizeMB = Math.round(videoBuffer.length / (1024 * 1024));

    // Check user token balance
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('token_balance')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate tokens needed based on file size (1 token = 10 MB)
    // Round to 1 decimal place for fractional tokens
    const tokensNeeded = Math.ceil((fileSizeMB / 10) * 10) / 10;
    
    // Check if user has enough tokens
    if (profile.token_balance < tokensNeeded) {
      return new Response(JSON.stringify({ 
        error: 'Insufficient token balance',
        tokensNeeded,
        tokensAvailable: profile.token_balance
      }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create video job record
    const { data: videoJob, error: jobError } = await supabase
      .from('video_jobs')
      .insert({
        user_id: user.id,
        processing_type: processingType,
        target_language: targetLanguage,
        original_filename: originalFilename,
        status: 'processing',
        file_size_mb: fileSizeMB,
        tokens_used: tokensNeeded, // Use calculated tokens based on file size
      })
      .select()
      .single();

    if (jobError || !videoJob) {
      return new Response(JSON.stringify({ error: 'Failed to create job' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Created video job:', videoJob.id);

    // Upload video to storage
    const videoFileName = `${videoJob.id}/${originalFilename}`;
    const { error: uploadError } = await supabase.storage
      .from('videos')
      .upload(videoFileName, videoBuffer, {
        contentType: 'video/mp4',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      await supabase
        .from('video_jobs')
        .update({ status: 'failed', error_message: 'Failed to upload video' })
        .eq('id', videoJob.id);
      
      return new Response(JSON.stringify({ error: 'Failed to upload video' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update job with input file path
    await supabase
      .from('video_jobs')
      .update({ input_file_path: videoFileName })
      .eq('id', videoJob.id);

    // Process based on type
    let result;
    try {
      if (processingType === 'transcription') {
        result = await processTranscription(videoBuffer);
      } else if (processingType === 'translation') {
        result = await processTranslation(videoBuffer, targetLanguage || 'es');
      } else if (processingType === 'style-matching') {
        if (!styleImageFile) {
          throw new Error('Style image required for style matching');
        }
        const imageBuffer = Uint8Array.from(atob(styleImageFile), c => c.charCodeAt(0));
        result = await processStyleMatching(videoBuffer, imageBuffer);
      }

      // Save subtitles to database
      if (result?.subtitles) {
        const subtitleInserts = result.subtitles.map((subtitle: any, index: number) => ({
          video_job_id: videoJob.id,
          start_time: subtitle.start || index * 2,
          end_time: subtitle.end || (index + 1) * 2,
          text: subtitle.text || subtitle.content || '',
          confidence: subtitle.confidence || 0.9,
        }));

        await supabase
          .from('video_subtitles')
          .insert(subtitleInserts);
      }

      // Create processed video with burned-in subtitles
      const processedFileName = `${videoJob.id}/processed_${originalFilename}`;
      const srtFileName = `${videoJob.id}/subtitles.srt`;
      
      // Generate SRT file content
      const srtContent = generateSRTContent(result.subtitles);
      
      // Save SRT file
      await supabase.storage
        .from('processed-videos')
        .upload(srtFileName, new TextEncoder().encode(srtContent), {
          contentType: 'text/plain',
          upsert: false
        });

      // For now, create a processed video (in real implementation, use FFmpeg to burn subtitles)
      // This would involve: ffmpeg -i input.mp4 -vf "subtitles=subtitles.srt" output.mp4
      const processedVideoBuffer = await createVideoWithSubtitles(videoBuffer, result.subtitles);
      
      await supabase.storage
        .from('processed-videos')
        .upload(processedFileName, processedVideoBuffer, {
          contentType: 'video/mp4',
          upsert: false
        });

      // Update job as completed
      await supabase
        .from('video_jobs')
        .update({
          status: 'completed',
          output_file_path: processedFileName,
          subtitle_file_path: `${videoJob.id}/subtitles.srt`,
          progress_percentage: 100,
        })
        .eq('id', videoJob.id);

      // Deduct tokens from user balance
      await supabase
        .from('profiles')
        .update({ token_balance: profile.token_balance - tokensNeeded })
        .eq('user_id', user.id);

      // Record token transaction
      await supabase
        .from('token_transactions')
        .insert({
          user_id: user.id,
          video_job_id: videoJob.id,
          amount: -tokensNeeded,
          transaction_type: 'usage',
          description: `${processingType} processing (${fileSizeMB}MB)`
        });

      // Get the processed video URL
      const { data: processedVideoUrl } = supabase.storage
        .from('processed-videos')
        .getPublicUrl(processedFileName);

      // Get the SRT file URL  
      const { data: srtUrl } = supabase.storage
        .from('processed-videos')
        .getPublicUrl(srtFileName);

      return new Response(JSON.stringify({
        success: true,
        jobId: videoJob.id,
        status: 'completed',
        result: {
          ...result,
          processedVideoUrl: processedVideoUrl.publicUrl,
          srtUrl: srtUrl.publicUrl
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (processError) {
      console.error('Processing error:', processError);
      
      // Update job as failed
      await supabase
        .from('video_jobs')
        .update({
          status: 'failed',
          error_message: processError.message
        })
        .eq('id', videoJob.id);

      return new Response(JSON.stringify({ error: processError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function processTranscription(videoBuffer: Uint8Array) {
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiKey) {
    throw new Error('OpenAI API key not configured');
  }

  // Extract audio from video and send to OpenAI Whisper
  const formData = new FormData();
  const blob = new Blob([videoBuffer], { type: 'video/mp4' });
  formData.append('file', blob, 'video.mp4');
  formData.append('model', 'whisper-1');
  formData.append('response_format', 'verbose_json');
  formData.append('timestamp_granularities[]', 'word');

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI transcription failed: ${error}`);
  }

  const result = await response.json();
  
  return {
    subtitles: result.segments || [{
      start: 0,
      end: 5,
      text: result.text || 'Transcription completed',
      confidence: 0.9
    }]
  };
}

async function processTranslation(videoBuffer: Uint8Array, targetLanguage: string) {
  // First transcribe, then translate
  const transcription = await processTranscription(videoBuffer);
  
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiKey) {
    throw new Error('OpenAI API key not configured');
  }

  // Translate each subtitle segment individually for better accuracy
  const translatedSubtitles = [];
  
  for (const subtitle of transcription.subtitles) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: `You are a professional translator. Translate the text to ${targetLanguage}. Return only the translated text, nothing else.`
          },
          {
            role: 'user',
            content: subtitle.text
          }
        ],
        max_tokens: 500,
        temperature: 0.1
      }),
    });

    if (!response.ok) {
      console.warn(`Translation failed for segment: ${subtitle.text}`);
      translatedSubtitles.push(subtitle); // Keep original if translation fails
      continue;
    }

    const result = await response.json();
    const translatedText = result.choices[0].message.content.trim();

    translatedSubtitles.push({
      ...subtitle,
      text: translatedText
    });
  }

  return {
    subtitles: translatedSubtitles
  };
}

async function processStyleMatching(videoBuffer: Uint8Array, imageBuffer: Uint8Array) {
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiKey) {
    throw new Error('OpenAI API key not configured');
  }

  // First get transcription
  const transcription = await processTranscription(videoBuffer);

  // Analyze style from reference image using GPT-4 Vision
  const base64Image = btoa(String.fromCharCode(...imageBuffer));
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
          content: 'You are a subtitle style analyzer. Analyze the subtitle style in the image and describe the font, color, position, and effects.'
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze the subtitle style in this image and provide styling information.'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 500
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI vision analysis failed: ${error}`);
  }

  const result = await response.json();
  const styleAnalysis = result.choices[0].message.content;

  return {
    subtitles: transcription.subtitles,
    styleAnalysis: styleAnalysis
  };
}

function generateSRTContent(subtitles: any[]): string {
  return subtitles.map((subtitle, index) => {
    const startTime = formatSRTTime(subtitle.start || index * 2);
    const endTime = formatSRTTime(subtitle.end || (index + 1) * 2);
    
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
  console.log(`Processing video with ${subtitles.length} subtitle segments`);
  
  try {
    // Use FFmpeg command via Deno subprocess
    const tempDir = await Deno.makeTempDir({ prefix: "video_processing_" });
    const inputPath = `${tempDir}/input.mp4`;
    const srtPath = `${tempDir}/subtitles.srt`;
    const outputPath = `${tempDir}/output.mp4`;
    
    // Write video file
    await Deno.writeFile(inputPath, videoBuffer);
    
    // Write SRT file
    const srtContent = generateSRTContent(subtitles);
    await Deno.writeTextFile(srtPath, srtContent);
    
    console.log(`Files written to ${tempDir}`);
    
    // Use FFmpeg to burn subtitles (if available in the environment)
    const ffmpegArgs = [
      "-i", inputPath,
      "-vf", `subtitles=${srtPath}:force_style='FontName=Arial,FontSize=24,PrimaryColour=&Hffffff,OutlineColour=&H000000,BackColour=&H80000000,Bold=1,Outline=2,MarginV=30'`,
      "-c:a", "copy",
      "-preset", "ultrafast", // Speed up processing
      "-y",
      outputPath
    ];
    
    try {
      // Try to run FFmpeg
      const process = new Deno.Command("ffmpeg", {
        args: ffmpegArgs,
        stdout: "piped",
        stderr: "piped",
      });
      
      const { code, stdout, stderr } = await process.output();
      const stderrText = new TextDecoder().decode(stderr);
      const stdoutText = new TextDecoder().decode(stdout);
      
      console.log("FFmpeg stdout:", stdoutText);
      console.log("FFmpeg stderr:", stderrText);
      
      if (code === 0) {
        // Success! Read the output file
        const processedVideo = await Deno.readFile(outputPath);
        console.log(`Successfully processed video: ${processedVideo.length} bytes`);
        
        // Clean up
        await Deno.remove(tempDir, { recursive: true });
        return processedVideo;
      } else {
        console.error(`FFmpeg failed with code ${code}`);
        throw new Error(`FFmpeg processing failed: ${stderrText}`);
      }
      
    } catch (ffmpegError) {
      console.warn("FFmpeg not available or failed:", ffmpegError);
      
      // Fallback: Create a simple metadata-enhanced version
      // Add subtitle track metadata (this won't burn subtitles but will embed them)
      const processedBuffer = await addSubtitleTrack(videoBuffer, srtContent);
      
      // Clean up
      await Deno.remove(tempDir, { recursive: true });
      return processedBuffer;
    }
    
  } catch (error) {
    console.error("Error in createVideoWithSubtitles:", error);
    return videoBuffer; // Return original if all fails
  }
}

// Fallback function to add subtitle metadata (soft subtitles)
async function addSubtitleTrack(videoBuffer: Uint8Array, srtContent: string): Promise<Uint8Array> {
  console.log("Adding soft subtitle track to video");
  
  try {
    const tempDir = await Deno.makeTempDir({ prefix: "subtitle_track_" });
    const inputPath = `${tempDir}/input.mp4`;
    const srtPath = `${tempDir}/subtitles.srt`;
    const outputPath = `${tempDir}/output.mp4`;
    
    await Deno.writeFile(inputPath, videoBuffer);
    await Deno.writeTextFile(srtPath, srtContent);
    
    // Try to add subtitle track without burning
    const process = new Deno.Command("ffmpeg", {
      args: [
        "-i", inputPath,
        "-i", srtPath,
        "-c", "copy",
        "-c:s", "mov_text", // Add subtitle track
        "-y",
        outputPath
      ],
      stdout: "piped",
      stderr: "piped",
    });
    
    const { code } = await process.output();
    
    if (code === 0) {
      const result = await Deno.readFile(outputPath);
      await Deno.remove(tempDir, { recursive: true });
      console.log("Successfully added subtitle track");
      return result;
    } else {
      await Deno.remove(tempDir, { recursive: true });
      console.log("Subtitle track addition failed, returning original");
      return videoBuffer;
    }
    
  } catch (error) {
    console.error("Subtitle track addition error:", error);
    return videoBuffer;
  }
}