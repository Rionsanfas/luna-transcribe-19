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
    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Verify user authentication
    const authorization = req.headers.get('Authorization');
    if (!authorization) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const token = authorization.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse and log request payload
    const requestBody = await req.json();
    const { 
      videoData, 
      videoSize, 
      videoJobId, 
      customPrompt, 
      primaryLanguage,
      detectLanguages,
      autoDetect,
      uploadMode 
    } = requestBody;

    // Comprehensive request logging
    console.log('=== EDGE FUNCTION START ===');
    console.log('Request Headers:', Object.fromEntries(req.headers.entries()));
    console.log('Environment Variables Status:', {
      hasOpenAiKey: !!Deno.env.get('OPENAI_API_KEY'),
      hasSupabaseUrl: !!Deno.env.get('SUPABASE_URL'),
      hasSupabaseAnonKey: !!Deno.env.get('SUPABASE_ANON_KEY'),
      hasSupabaseServiceKey: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
      openAiKeyLength: Deno.env.get('OPENAI_API_KEY')?.length || 0
    });
    console.log('Request Payload Analysis:', {
      videoSize,
      videoJobId,
      uploadMode,
      primaryLanguage,
      autoDetect,
      customPromptLength: customPrompt?.length || 0,
      detectLanguagesCount: detectLanguages?.length || 0,
      videoDataType: typeof videoData,
      videoDataLength: videoData?.length || 0,
      videoDataPreview: videoData?.substring(0, 50) + '...',
      fullRequestBodyKeys: Object.keys(requestBody),
      requestBodySize: JSON.stringify(requestBody).length
    });

    // Check if OpenAI API key is configured
    const openAiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAiKey) {
      console.error('=== CRITICAL ERROR: OpenAI API key not configured ===');
      return new Response(
        JSON.stringify({ 
          error: 'Service configuration error',
          message: 'AI processing service is not properly configured. Please contact support.',
          details: 'OPENAI_API_KEY environment variable is missing'
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    console.log('OpenAI API Key configured, length:', openAiKey.length);

    // Validate required parameters with detailed logging
    console.log('Parameter validation:', {
      hasVideoData: !!videoData,
      videoDataType: typeof videoData,
      videoDataLength: videoData?.length,
      hasVideoSize: !!videoSize,
      videoSize: videoSize,
      hasVideoJobId: !!videoJobId,
      videoJobId: videoJobId
    });

    if (!videoData || !videoSize || !videoJobId) {
      const missingParams = [];
      if (!videoData) missingParams.push('videoData');
      if (!videoSize) missingParams.push('videoSize');
      if (!videoJobId) missingParams.push('videoJobId');
      
      console.error('Missing required parameters:', missingParams);
      return new Response(
        JSON.stringify({ 
          error: 'Missing required parameters', 
          missing: missingParams,
          received: { hasVideoData: !!videoData, hasVideoSize: !!videoSize, hasVideoJobId: !!videoJobId }
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Calculate tokens needed using exact fractional calculation (1 token = 10MB = $0.20)
    const fileSizeMB = videoSize / (1024 * 1024);
    const tokensNeeded = fileSizeMB / 10;

    // Create service client for database operations
    const serviceSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check user's token balance and subscription status
    const { data: profile, error: profileError } = await serviceSupabase
      .from('profiles')
      .select('token_balance, subscription_plan, subscription_status')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('Failed to fetch user profile:', profileError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user profile', details: profileError.message }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if user is an active subscriber (subscribers get unlimited usage)
    const isActiveSubscriber = profile?.subscription_status === 'active' && 
                              (profile?.subscription_plan === 'Premium' || profile?.subscription_plan === 'Professional');

    console.log('User profile:', {
      user_id: user.id,
      token_balance: profile?.token_balance,
      subscription_plan: profile?.subscription_plan,
      subscription_status: profile?.subscription_status,
      isActiveSubscriber,
      tokensNeeded
    });

    // Only check token balance for non-subscribers
    if (!isActiveSubscriber) {
      if ((profile?.token_balance || 0) < tokensNeeded) {
        return new Response(
          JSON.stringify({ 
            error: 'Insufficient tokens',
            tokensNeeded: tokensNeeded.toFixed(1),
            tokensAvailable: profile?.token_balance || 0
          }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Deduct tokens for non-subscribers only
      const { error: updateError } = await serviceSupabase
        .from('profiles')
        .update({ token_balance: (profile?.token_balance || 0) - tokensNeeded })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Failed to deduct tokens:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to deduct tokens', details: updateError.message }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    }

    // Record token transaction only for non-subscribers
    if (!isActiveSubscriber) {
      const { error: transactionError } = await serviceSupabase
        .from('token_transactions')
        .insert({
          user_id: user.id,
          video_job_id: videoJobId,
          transaction_type: 'usage',
          amount: -tokensNeeded,
          description: 'Subtitle generation'
        });
        
      if (transactionError) {
        console.error('Failed to record token transaction:', transactionError);
      }
    }

    // Update video job status
    await serviceSupabase
      .from('video_jobs')
      .update({ 
        status: 'processing',
        tokens_used: tokensNeeded,
        progress_percentage: 10
      })
      .eq('id', videoJobId);

    // Convert base64 to binary using safe decoding with extensive logging
    console.log('=== BASE64 DECODING START ===');
    console.log('VideoData analysis:', {
      type: typeof videoData,
      length: videoData?.length,
      startsWithDataUrl: videoData?.startsWith('data:'),
      firstChars: videoData?.substring(0, 100),
      lastChars: videoData?.substring(videoData.length - 100),
      containsComma: videoData?.includes(','),
      hasBase64Prefix: videoData?.includes('base64,')
    });

    let binaryVideo;
    let actualBase64Data = videoData;
    
    try {
      // Remove data URL prefix if present (e.g., "data:video/mp4;base64,")
      if (videoData.includes('base64,')) {
        actualBase64Data = videoData.split('base64,')[1];
        console.log('Removed data URL prefix, new length:', actualBase64Data.length);
      }
      
      // Validate base64 format
      const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
      if (!base64Regex.test(actualBase64Data)) {
        throw new Error('Invalid base64 format detected');
      }
      
      console.log('Base64 validation passed, attempting decode...');
      console.log('Actual base64 data length:', actualBase64Data.length);
      console.log('First 50 chars of base64:', actualBase64Data.substring(0, 50));
      
      // First, decode the entire base64 string (we can't chunk base64 decoding)
      const binaryString = atob(actualBase64Data);
      console.log('Base64 decode successful, binary string length:', binaryString.length);
      
      // Then convert to Uint8Array in chunks to prevent memory issues
      const chunkSize = 1024 * 1024; // 1MB chunks for memory efficiency
      binaryVideo = new Uint8Array(binaryString.length);
      
      for (let i = 0; i < binaryString.length; i += chunkSize) {
        const end = Math.min(i + chunkSize, binaryString.length);
        for (let j = i; j < end; j++) {
          binaryVideo[j] = binaryString.charCodeAt(j);
        }
      }
      
      console.log('Successfully converted to Uint8Array, final size:', binaryVideo.length);
    } catch (decodeError) {
      console.error('=== BASE64 DECODE ERROR ===');
      console.error('Error details:', {
        name: decodeError.name,
        message: decodeError.message,
        stack: decodeError.stack
      });
      console.error('VideoData debug info:', {
        originalLength: videoData?.length,
        processedLength: actualBase64Data?.length,
        firstChars: actualBase64Data?.substring(0, 100),
        hasValidBase64Chars: /^[A-Za-z0-9+/=]*$/.test(actualBase64Data || '')
      });
      
      // Update job status to failed
      await serviceSupabase
        .from('video_jobs')
        .update({ 
          status: 'failed',
          error_message: 'Invalid video data format',
          progress_percentage: 0
        })
        .eq('id', videoJobId);
      
      return new Response(
        JSON.stringify({ 
          error: 'Invalid video data',
          message: 'The uploaded video data is corrupted or invalid. Please try uploading again.',
          details: decodeError.message
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create form data for OpenAI Whisper
    const formData = new FormData();
    const videoBlob = new Blob([binaryVideo], { type: 'video/mp4' });
    formData.append('file', videoBlob, 'video.mp4');
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'verbose_json');
    formData.append('timestamp_granularities[]', 'word');
    
    // Add custom prompt if provided
    if (customPrompt && customPrompt.trim()) {
      formData.append('prompt', customPrompt.trim());
    }
    
    // Add language configuration based on user settings
    if (!autoDetect) {
      if (primaryLanguage && primaryLanguage !== 'en') {
        formData.append('language', primaryLanguage);
      }
      
      // Note: OpenAI Whisper doesn't support multiple language detection in single request
      // For multiple languages, we rely on auto-detection or process separately
      if (detectLanguages?.length > 0) {
        // Log additional languages for potential future processing
        console.log('Additional languages requested:', detectLanguages);
      }
    }
    // If autoDetect is true, let Whisper automatically detect the language

    // Call OpenAI Whisper API
    console.log('Calling OpenAI Whisper API...');
    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      },
      body: formData,
    });

    console.log('OpenAI API Response Status:', whisperResponse.status);
    console.log('OpenAI API Response Headers:', Object.fromEntries(whisperResponse.headers.entries()));
    
    if (!whisperResponse.ok) {
      const errorText = await whisperResponse.text();
      console.error('=== OPENAI API ERROR ===');
      console.error('Status Code:', whisperResponse.status);
      console.error('Status Text:', whisperResponse.statusText);
      console.error('Error Response:', errorText);
      console.error('Request FormData sent:', {
        hasFile: formData.has('file'),
        model: formData.get('model'),
        responseFormat: formData.get('response_format'),
        customPrompt: formData.get('prompt'),
        language: formData.get('language')
      });
      
      // Refund tokens on failure for non-subscribers
      if (!isActiveSubscriber) {
        const { error: refundError } = await serviceSupabase
          .from('profiles')
          .update({ token_balance: (profile?.token_balance || 0) })
          .eq('user_id', user.id);
        
        if (refundError) {
          console.error('Failed to refund tokens:', refundError);
        }
      }

      // Update job status to failed
      await serviceSupabase
        .from('video_jobs')
        .update({ 
          status: 'failed',
          error_message: `OpenAI API error: ${whisperResponse.status} - ${errorText}`,
          progress_percentage: 0
        })
        .eq('id', videoJobId);

      return new Response(
        JSON.stringify({ 
          error: 'Failed to transcribe video', 
          details: `OpenAI API error: ${whisperResponse.status} - ${errorText}`,
          message: 'The transcription service returned an error. Check the logs for details.',
          statusCode: whisperResponse.status,
          apiResponse: errorText
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const transcriptionResult = await whisperResponse.json();
    console.log('OpenAI API Success:', {
      hasText: !!transcriptionResult.text,
      textLength: transcriptionResult.text?.length,
      hasWords: !!transcriptionResult.words,
      wordsCount: transcriptionResult.words?.length,
      language: transcriptionResult.language,
      duration: transcriptionResult.duration
    });

    // Process and store subtitles
    const subtitles = [];
    if (transcriptionResult.words) {
      // Group words into subtitle segments with ratio-aware positioning
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
          // Add ratio-aware positioning (will be applied based on video aspect ratio in frontend)
          position_x: 50, // Center horizontally (percentage)
          position_y: 85, // Default bottom position (percentage)
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

    return new Response(
      JSON.stringify({ 
        success: true,
        subtitles: subtitles.length,
        tokensUsed: tokensNeeded.toFixed(1),
        transcription: transcriptionResult.text,
        videoJobId: videoJobId
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('=== EDGE FUNCTION CRITICAL ERROR ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error toString:', error.toString());
    
    // Try to get more context about the request
    let videoJobId;
    try {
      const body = await req.clone().json();
      videoJobId = body.videoJobId;
    } catch (bodyError) {
      console.error('Could not parse request body in error handler:', bodyError);
    }
    
    // Try to update job status to failed if we have the videoJobId
    if (videoJobId) {
      try {
        const serviceSupabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );
        
        await serviceSupabase
          .from('video_jobs')
          .update({ 
            status: 'failed',
            error_message: error.message || 'Unknown error occurred',
            progress_percentage: 0
          })
          .eq('id', videoJobId);
      } catch (updateError) {
        console.error('Failed to update job status in error handler:', updateError);
      }
    }
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message || 'An unexpected error occurred',
        details: {
          name: error.name,
          message: error.message,
          stack: error.stack
        },
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});