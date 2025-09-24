import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/*
 * ========================================
 * AI SUBTITLE PROCESSING SYSTEM - REQUIREMENTS
 * ========================================
 * 
 * CORE FUNCTIONALITY:
 * This edge function processes videos to generate subtitles and returns them to the client.
 * The client-side will then burn the subtitles into the video using Canvas + MediaRecorder.
 * 
 * WORKFLOW:
 * 1. User uploads video → AI generates subtitles → Client burns subtitles into video
 * 2. Process: Transcription/Translation/Style-matching → Return subtitles data → Client rendering
 * 
 * AI PROCESSING REQUIREMENTS:
 * - Use OpenAI Whisper (whisper-1) for accurate transcription with word-level timestamps
 * - Use gpt-4o-mini for translation with low temperature (0.1) for consistency
 * - Use gpt-4o-mini for style analysis with strict JSON output format
 * - Always return subtitles array with: {start: number, end: number, text: string}
 * 
 * SUBTITLE BURNING PROCESS:
 * - Server generates SRT file and subtitle data
 * - Client receives subtitle data and burns them into video using renderVideoWithSubtitles()
 * - Final video with burned-in subtitles is uploaded back to storage
 * - User gets both SRT file and video with burned subtitles
 * 
 * CRITICAL: NO SERVER-SIDE VIDEO PROCESSING
 * FFmpeg/WASM doesn't work in Deno runtime, so all video processing happens client-side
 */

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
    // Round to 1 decimal place for fractional tokens (exact logic requested)
    const tokensNeeded = Math.round((fileSizeMB / 10) * 10) / 10;
    
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

      // Generate SRT content and upload to storage
      const srtFileName = `${videoJob.id}/subtitles.srt`;
      const srtContent = generateSRTContent(result.subtitles);

      // Upload SRT file to storage
      const { error: srtUploadError } = await supabase.storage
        .from('processed-videos')
        .upload(srtFileName, new TextEncoder().encode(srtContent), {
          contentType: 'text/plain',
          upsert: true
        });
      
      if (srtUploadError) {
        console.error('SRT upload error:', srtUploadError);
        // Continue without failing - SRT can be generated client-side as fallback
      }

      // Mark job as completed with subtitle data
      // NOTE: Client will handle video processing and upload the final result
      await supabase
        .from('video_jobs')
        .update({
          status: 'completed',
          subtitle_file_path: srtFileName,
          progress_percentage: 100,
        })
        .eq('id', videoJob.id);

      // Deduct tokens and record transaction
      await supabase
        .from('profiles')
        .update({ token_balance: profile.token_balance - tokensNeeded })
        .eq('user_id', user.id);

      await supabase
        .from('token_transactions')
        .insert({
          user_id: user.id,
          video_job_id: videoJob.id,
          amount: -tokensNeeded,
          transaction_type: 'usage',
          description: `${processingType} processing (${fileSizeMB}MB)`
        });

      // Create signed URL for SRT file
      const { data: srtSignedUrl } = await supabase.storage
        .from('processed-videos')
        .createSignedUrl(srtFileName, 60 * 60 * 24 * 7);

      // Return subtitles data for client-side video processing
      return new Response(JSON.stringify({
        success: true,
        jobId: videoJob.id,
        status: 'completed',
        result: {
          subtitles: result.subtitles, // Client will use this to burn subtitles into video
          styleAnalysis: (result as any).styleAnalysis || null, // Style data for client rendering
          srtUrl: srtSignedUrl?.signedUrl || null
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

  console.log('Starting Whisper transcription with word-level timestamps');

  // Extract audio from video and send to OpenAI Whisper
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
    throw new Error(`OpenAI transcription failed: ${error}`);
  }

  const result = await response.json();
  console.log('Whisper response segments count:', result.segments?.length || 0);
  
  // Convert segments to properly timed subtitles
  const subtitles = result.segments?.map((segment: any) => ({
    start: segment.start,
    end: segment.end,
    text: segment.text.trim(),
    confidence: segment.avg_logprob || 0.9,
    words: segment.words || []
  })) || [];

  // If no segments, create a fallback
  if (subtitles.length === 0 && result.text) {
    subtitles.push({
      start: 0,
      end: Math.min(result.duration || 5, 5),
      text: result.text.trim(),
      confidence: 0.9,
      words: []
    });
  }

  console.log('Generated subtitles count:', subtitles.length);
  
  return {
    subtitles: subtitles
  };
}

async function processTranslation(videoBuffer: Uint8Array, targetLanguage: string) {
  // First transcribe, then translate
  const transcription = await processTranscription(videoBuffer);
  
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiKey) {
    throw new Error('OpenAI API key not configured');
  }

  // Language code to full name mapping
  const languageMap: Record<string, string> = {
    'en': 'English',
    'es': 'Spanish',
    'fr': 'French', 
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'ja': 'Japanese',
    'ko': 'Korean',
    'zh': 'Chinese',
    'ar': 'Arabic',
    'hi': 'Hindi',
    'th': 'Thai',
    'vi': 'Vietnamese',
    'nl': 'Dutch',
    'sv': 'Swedish',
    'no': 'Norwegian',
    'da': 'Danish',
    'fi': 'Finnish',
    'pl': 'Polish',
    'cs': 'Czech',
    'tr': 'Turkish'
  };

  const targetLanguageName = languageMap[targetLanguage] || targetLanguage;

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
              content: 'You are a professional translator. Translate the text to the target language preserving timing and flow appropriate for subtitles. Return only the translated text, nothing else.'
            },
            {
              role: 'user',
              content: `Translate to ${targetLanguageName}:\n${subtitle.text}`
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

  // Analyze style from reference image - strict JSON response
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
          content: 'You are a subtitle style analyst. Analyze the subtitle style in the provided image and return VALID JSON ONLY with keys: fontFamily, fontVariant, fontSize, textColor, backgroundColor, backgroundOpacity, strokeWidth, strokeColor, textShadow, position (bottom|top|center), lineHeight, maxWidthPercent, animation (none|fade|pop|slide), activeWordHighlight, activeWordColor. For fontFamily return a Google Font or Bunny Font name when possible. No extra text.'
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Analyze the subtitle style in this image and return only JSON.' },
            { type: 'image_url', image_url: { url: `data:image/png;base64,${base64Image}` } }
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
  const rawContent: string = result.choices?.[0]?.message?.content || '';
  console.log('Style analysis raw content:', rawContent);

  let parsed: any | null = null;
  try {
    // Strip code fences if present
    const cleaned = rawContent.trim().replace(/^```(json)?/i, '').replace(/```$/,'').trim();
    parsed = JSON.parse(cleaned);
  } catch (e) {
    console.error('Failed to parse style analysis JSON. Raw output kept for logs. Error:', e);
  }

  return {
    subtitles: transcription.subtitles,
    styleAnalysis: parsed ? JSON.stringify(parsed) : null
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

/*
 * ========================================
 * CLIENT-SIDE VIDEO PROCESSING EXPLANATION
 * ========================================
 * 
 * This edge function does NOT process videos server-side because:
 * 1. FFmpeg WASM requires Web Workers which don't work in Deno runtime
 * 2. Server-side video processing is resource-intensive and unreliable
 * 3. Client-side processing provides better performance and reliability
 * 
 * INSTEAD, the workflow is:
 * 1. Server: Generate subtitles using AI (Whisper + GPT)
 * 2. Server: Return subtitle data + style analysis to client
 * 3. Client: Use renderVideoWithSubtitles() to burn subtitles into video
 * 4. Client: Upload the final processed video back to storage
 * 
 * The client-side renderVideoWithSubtitles() function uses:
 * - Canvas API to overlay subtitles on video frames
 * - MediaRecorder to capture the canvas output as video
 * - Proper text wrapping, positioning, and styling
 * - Support for custom fonts, colors, backgrounds, and animations
 * 
 * This approach ensures:
 * - Reliable video processing across all browsers
 * - Better performance than server-side processing
 * - Full control over subtitle styling and positioning
 * - No dependency on server-side video processing libraries
 */