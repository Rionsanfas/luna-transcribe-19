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
      videoJobId, 
      sourceLanguage, 
      targetLanguages, 
      translationPrompt,
      preserveFormatting,
      maintainTiming 
    } = await req.json();

    if (!videoJobId || !sourceLanguage || !targetLanguages?.length) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create service client for database operations
    const serviceSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get existing subtitles for the video job
    const { data: subtitles, error: subtitlesError } = await serviceSupabase
      .from('video_subtitles')
      .select('*')
      .eq('video_job_id', videoJobId)
      .order('start_time', { ascending: true });

    if (subtitlesError || !subtitles?.length) {
      return new Response(
        JSON.stringify({ error: 'No subtitles found for this video' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Calculate tokens needed for translation (15 tokens per target language)
    const tokensPerLanguage = 15;
    const totalTokensNeeded = targetLanguages.length * tokensPerLanguage;

    // Check user's token balance
    const { data: profile, error: profileError } = await serviceSupabase
      .from('profiles')
      .select('token_balance')
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

    if ((profile?.token_balance || 0) < totalTokensNeeded) {
      return new Response(
        JSON.stringify({ 
          error: 'Insufficient tokens',
          tokensNeeded: totalTokensNeeded,
          tokensAvailable: profile?.token_balance || 0
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Deduct tokens
    const { error: updateError } = await serviceSupabase
      .from('profiles')
      .update({ token_balance: (profile?.token_balance || 0) - totalTokensNeeded })
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
        amount: -totalTokensNeeded,
        description: `Translation to ${targetLanguages.length} languages`
      });

    // Prepare subtitle text for translation
    const subtitleTexts = subtitles.map(sub => sub.text);
    const fullText = subtitleTexts.join('\n');

    const translatedSubtitles = [];

    // Translate to each target language
    for (const targetLang of targetLanguages) {
      try {
        // Prepare system prompt for translation
        let systemPrompt = `You are a professional subtitle translator. Translate the following subtitles from ${sourceLanguage} to ${targetLang}.

IMPORTANT RULES:
1. Maintain the exact same number of lines as the input
2. Each line corresponds to one subtitle segment
3. Keep the translation natural and contextually appropriate
4. ${preserveFormatting ? 'Preserve formatting, punctuation, and capitalization style' : 'Use natural formatting for the target language'}
5. ${maintainTiming ? 'Keep translations concise to maintain original timing' : 'Prioritize accuracy over brevity'}`;

        if (translationPrompt?.trim()) {
          systemPrompt += `\n6. Additional instructions: ${translationPrompt.trim()}`;
        }

        systemPrompt += `\n\nProvide only the translated subtitles, one per line, with no additional text or formatting.`;

        // Call OpenAI for translation
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: fullText }
            ],
            max_tokens: 4000,
            temperature: 0.3
          }),
        });

        if (!response.ok) {
          console.error(`Translation failed for ${targetLang}:`, await response.text());
          continue;
        }

        const result = await response.json();
        const translatedText = result.choices[0].message.content;
        const translatedLines = translatedText.split('\n').filter(line => line.trim());

        // Create translated subtitle entries
        if (translatedLines.length === subtitles.length) {
          for (let i = 0; i < subtitles.length; i++) {
            const originalSubtitle = subtitles[i];
            translatedSubtitles.push({
              video_job_id: videoJobId,
              text: translatedLines[i].trim(),
              start_time: originalSubtitle.start_time,
              end_time: originalSubtitle.end_time,
              duration: originalSubtitle.duration,
              words: originalSubtitle.words, // Keep original word timing
              confidence: 1.0, // Translation confidence
              verified: false,
              manual_edit: false,
              speaker_id: originalSubtitle.speaker_id,
              style_override: {
                ...originalSubtitle.style_override,
                language: targetLang,
                source_language: sourceLanguage
              }
            });
          }
        } else {
          console.error(`Line count mismatch for ${targetLang}: expected ${subtitles.length}, got ${translatedLines.length}`);
        }

      } catch (error) {
        console.error(`Translation error for ${targetLang}:`, error);
      }
    }

    // Insert translated subtitles
    if (translatedSubtitles.length > 0) {
      const { error: insertError } = await serviceSupabase
        .from('video_subtitles')
        .insert(translatedSubtitles);

      if (insertError) {
        console.error('Error inserting translated subtitles:', insertError);
      }
    }

    // Update video job
    await serviceSupabase
      .from('video_jobs')
      .update({ 
        status: 'completed_with_translation',
        updated_at: new Date().toISOString()
      })
      .eq('id', videoJobId);

    return new Response(
      JSON.stringify({ 
        success: true,
        translatedLanguages: targetLanguages,
        tokensUsed: totalTokensNeeded,
        subtitlesCreated: translatedSubtitles.length,
        videoJobId: videoJobId
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Translation error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});