import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the authorization header from the request
    const authorization = req.headers.get('Authorization')
    if (!authorization) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Verify user
    const token = authorization.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const { video_job_id, processing_type, target_language, file_size_mb } = await req.json()

    if (!video_job_id || !processing_type || !file_size_mb) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check user's token balance
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('token_balance')
      .eq('user_id', user.id)
      .single()

    if (profileError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user profile' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const tokensRequired = getTokensRequired(processing_type, file_size_mb)
    
    if ((profile?.token_balance || 0) < tokensRequired) {
      return new Response(
        JSON.stringify({ 
          error: 'Insufficient tokens',
          tokens_required: tokensRequired.toFixed(1),
          current_balance: profile?.token_balance || 0
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Deduct tokens from user balance
    const newBalance = (profile?.token_balance || 0) - tokensRequired

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ token_balance: newBalance })
      .eq('user_id', user.id)

    if (updateError) {
      return new Response(
        JSON.stringify({ error: 'Failed to update token balance' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Update video job status
    const { error: jobUpdateError } = await supabase
      .from('video_jobs')
      .update({ 
        status: 'processing',
        tokens_used: tokensRequired,
        target_language: target_language || null
      })
      .eq('id', video_job_id)
      .eq('user_id', user.id)

    if (jobUpdateError) {
      // Refund tokens if job update fails
      await supabase
        .from('profiles')
        .update({ token_balance: profile?.token_balance })
        .eq('user_id', user.id)

      return new Response(
        JSON.stringify({ error: 'Failed to update job status' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Record transaction
    await supabase
      .from('token_transactions')
      .insert({
        user_id: user.id,
        video_job_id: video_job_id,
        transaction_type: 'debit',
        amount: -tokensRequired,
        description: `Video processing - ${processing_type}`
      })

    // Simulate processing (in real implementation, this would trigger actual AI processing)
    setTimeout(async () => {
      try {
        // Simulate completion after 30 seconds
        await supabase
          .from('video_jobs')
          .update({ 
            status: 'completed',
            progress_percentage: 100
          })
          .eq('id', video_job_id)

        // Generate sample subtitles
        await supabase
          .from('video_subtitles')
          .insert([
            {
              video_job_id: video_job_id,
              start_time: 0,
              end_time: 3,
              text: "Welcome to SubAI",
              confidence: 0.95
            },
            {
              video_job_id: video_job_id,
              start_time: 3,
              end_time: 6,
              text: "AI-powered subtitle generation",
              confidence: 0.92
            }
          ])
      } catch (error) {
        console.error('Error completing job:', error)
      }
    }, 30000)

    return new Response(
      JSON.stringify({ 
        success: true, 
        tokens_used: tokensRequired.toFixed(1),
        new_balance: newBalance,
        job_status: 'processing'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Video processing error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

function getTokensRequired(processingType: string, fileSizeMB: number): number {
  // Base calculation: 1 token = 10MB = $0.20
  const baseTokens = fileSizeMB / 10;
  
  switch (processingType) {
    case 'transcription':
      return baseTokens;
    case 'translation':
      return baseTokens * 1.5; // 50% more for translation
    case 'enhancement':
      return baseTokens * 0.5; // 50% less for enhancement
    default:
      return baseTokens;
  }
}