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

    const { 
      videoData, 
      videoSize, 
      videoJobId, 
      customPrompt, 
      primaryLanguage,
      detectLanguages,
      autoDetect,
      uploadMode 
    } = await req.json();

    if (!videoData || !videoSize || !videoJobId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
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

    // Check user's token balance
    const { data: profile, error: profileError } = await serviceSupabase
      .from('profiles')
      .select('token_balance, subscription_plan')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user profile' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

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

    // Deduct tokens using exact fractional amount
    const { error: updateError } = await serviceSupabase
      .from('profiles')
      .update({ token_balance: (profile?.token_balance || 0) - tokensNeeded })
      .eq('user_id', user.id);

    if (updateError) {
      return new Response(
        JSON.stringify({ error: 'Failed to deduct tokens' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Record token transaction
    await serviceSupabase
      .from('token_transactions')
      .insert({
        user_id: user.id,
        video_job_id: videoJobId,
        transaction_type: 'usage',
        amount: -tokensNeeded,
        description: 'Subtitle generation'
      });

    // Update video job status
    await serviceSupabase
      .from('video_jobs')
      .update({ 
        status: 'processing',
        tokens_used: tokensNeeded,
        progress_percentage: 10
      })
      .eq('id', videoJobId);

    // Convert base64 to binary
    const binaryVideo = Uint8Array.from(atob(videoData), c => c.charCodeAt(0));

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
    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      },
      body: formData,
    });

    if (!whisperResponse.ok) {
      const errorText = await whisperResponse.text();
      console.error('OpenAI Whisper error:', errorText);
      
      // Refund tokens on failure
      await serviceSupabase
        .from('profiles')
        .update({ token_balance: (profile?.token_balance || 0) })
        .eq('user_id', user.id);

      return new Response(
        JSON.stringify({ error: 'Failed to transcribe video' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const transcriptionResult = await whisperResponse.json();

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
    console.error('Subtitle generation error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});