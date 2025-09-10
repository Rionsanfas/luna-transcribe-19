import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('=== GENERATE SUBTITLES START ===');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const openAiKey = Deno.env.get('OPENAI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!openAiKey || !supabaseUrl || !supabaseServiceKey) {
      console.error('Missing environment variables');
      return new Response(
        JSON.stringify({ 
          error: 'Service configuration error',
          details: 'Required API keys not configured'
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse request body
    const requestBody = await req.json();
    const { videoData, videoSize, videoJobId, customPrompt, primaryLanguage, autoDetect } = requestBody;
    
    console.log('Request details:', {
      hasVideoData: !!videoData,
      videoDataLength: videoData?.length,
      videoSize,
      videoJobId,
      autoDetect
    });

    // Validate required parameters
    if (!videoData || !videoSize || !videoJobId) {
      console.error('Missing required parameters');
      return new Response(
        JSON.stringify({ 
          error: 'Missing required parameters',
          details: 'videoData, videoSize, and videoJobId are required'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create Supabase clients
    const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user authentication
    const authorization = req.headers.get('Authorization');
    if (!authorization) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update job status to processing
    console.log('Updating job status to processing...');
    const { error: updateError } = await serviceSupabase
      .from('video_jobs')
      .update({ 
        status: 'processing',
        progress_percentage: 20
      })
      .eq('id', videoJobId);

    if (updateError) {
      console.error('Error updating job status:', updateError);
      return new Response(
        JSON.stringify({ error: 'Database update failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Convert base64 to binary
    console.log('Converting base64 to binary...');
    let binaryVideo: Uint8Array;
    
    try {
      // Remove data URL prefix if present
      let cleanBase64 = videoData;
      if (videoData.includes('base64,')) {
        cleanBase64 = videoData.split('base64,')[1];
      }
      
      // Simple base64 decode for smaller files
      if (videoSize < 50 * 1024 * 1024) { // 50MB limit for simple decode
        const binaryString = atob(cleanBase64);
        binaryVideo = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          binaryVideo[i] = binaryString.charCodeAt(i);
        }
      } else {
        throw new Error('File too large for processing');
      }
      
      console.log('Base64 conversion successful, binary size:', binaryVideo.length);
      
    } catch (decodeError) {
      console.error('Base64 decode failed:', decodeError.message);
      
      await serviceSupabase
        .from('video_jobs')
        .update({ 
          status: 'failed',
          error_message: 'Invalid video data format'
        })
        .eq('id', videoJobId);
      
      return new Response(
        JSON.stringify({ 
          error: 'Invalid video data',
          details: 'Failed to decode video data: ' + decodeError.message
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Update progress
    await serviceSupabase
      .from('video_jobs')
      .update({ progress_percentage: 50 })
      .eq('id', videoJobId);

    // Create form data for OpenAI Whisper
    const formData = new FormData();
    const videoBlob = new Blob([binaryVideo], { type: 'video/mp4' });
    formData.append('file', videoBlob, 'video.mp4');
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'verbose_json');
    formData.append('timestamp_granularities[]', 'word');
    
    if (customPrompt?.trim()) {
      formData.append('prompt', customPrompt.trim());
    }
    
    if (!autoDetect && primaryLanguage && primaryLanguage !== 'en') {
      formData.append('language', primaryLanguage);
    }

    // Call OpenAI Whisper API
    console.log('Calling OpenAI Whisper API...');
    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiKey}`,
      },
      body: formData,
    });

    console.log('OpenAI response status:', whisperResponse.status);
    
    if (!whisperResponse.ok) {
      const errorText = await whisperResponse.text();
      console.error('OpenAI API error:', whisperResponse.status, errorText);
      
      await serviceSupabase
        .from('video_jobs')
        .update({ 
          status: 'failed',
          error_message: `OpenAI API error: ${whisperResponse.status} - ${errorText}`
        })
        .eq('id', videoJobId);

      return new Response(
        JSON.stringify({ 
          error: 'Transcription failed', 
          details: `OpenAI API error (${whisperResponse.status}): ${errorText}`,
          statusCode: whisperResponse.status
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const transcriptionResult = await whisperResponse.json();
    console.log('Transcription successful, text length:', transcriptionResult.text?.length);

    // Update progress
    await serviceSupabase
      .from('video_jobs')
      .update({ progress_percentage: 80 })
      .eq('id', videoJobId);

    // Process and store subtitles
    const subtitles = [];
    if (transcriptionResult.words) {
      for (let i = 0; i < transcriptionResult.words.length; i += 4) {
        const wordGroup = transcriptionResult.words.slice(i, i + 4);
        const text = wordGroup.map(w => w.word).join(' ');
        const startTime = wordGroup[0].start;
        const endTime = wordGroup[wordGroup.length - 1].end;
        
        subtitles.push({
          video_job_id: videoJobId,
          text: text.trim(),
          start_time: startTime,
          end_time: endTime,
          duration: endTime - startTime,
          words: wordGroup,
          confidence: wordGroup.reduce((acc, w) => acc + (w.probability || 1), 0) / wordGroup.length,
          position_x: 50,
          position_y: 85,
          ratio_adaptive: true
        });
      }
    }

    // Insert subtitles into database
    if (subtitles.length > 0) {
      const { error: subtitleError } = await serviceSupabase
        .from('video_subtitles')
        .insert(subtitles);

      if (subtitleError) {
        console.error('Error inserting subtitles:', subtitleError);
      }
    }

    // Update video job as completed
    await serviceSupabase
      .from('video_jobs')
      .update({ 
        status: 'completed',
        progress_percentage: 100,
        updated_at: new Date().toISOString()
      })
      .eq('id', videoJobId);

    console.log('Processing completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        subtitles: subtitles.length,
        transcription: transcriptionResult.text,
        videoJobId: videoJobId
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('=== CRITICAL ERROR ===');
    console.error('Error:', error.name, error.message);
    console.error('Stack:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message,
        type: error.name
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});