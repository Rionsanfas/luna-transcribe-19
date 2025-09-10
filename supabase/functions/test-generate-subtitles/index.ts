import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('=== TEST FUNCTION START ===');
  console.log('Method:', req.method);
  console.log('Headers:', Object.fromEntries(req.headers.entries()));
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Test environment variables
    const envTest = {
      hasOpenAiKey: !!Deno.env.get('OPENAI_API_KEY'),
      hasSupabaseUrl: !!Deno.env.get('SUPABASE_URL'),
      hasSupabaseAnonKey: !!Deno.env.get('SUPABASE_ANON_KEY'),
      hasSupabaseServiceKey: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
      openAiKeyLength: Deno.env.get('OPENAI_API_KEY')?.length || 0
    };
    
    console.log('Environment check:', envTest);
    
    // Parse request body
    const body = await req.text();
    console.log('Raw body length:', body.length);
    console.log('Raw body preview:', body.substring(0, 200));
    
    let parsedBody;
    try {
      parsedBody = JSON.parse(body);
      console.log('Parsed body keys:', Object.keys(parsedBody));
      console.log('Parsed body summary:', {
        hasVideoData: !!parsedBody.videoData,
        videoDataLength: parsedBody.videoData?.length,
        videoSize: parsedBody.videoSize,
        videoJobId: parsedBody.videoJobId
      });
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid JSON in request body',
          details: parseError.message,
          bodyPreview: body.substring(0, 200)
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Test base64 decoding if videoData present
    if (parsedBody.videoData) {
      try {
        console.log('Testing base64 decode...');
        const decoded = atob(parsedBody.videoData.substring(0, 100)); // Test small portion
        console.log('Base64 decode test successful, decoded length:', decoded.length);
      } catch (decodeError) {
        console.error('Base64 decode test failed:', decodeError);
        return new Response(
          JSON.stringify({ 
            error: 'Invalid base64 data',
            details: decodeError.message,
            videoDataPreview: parsedBody.videoData?.substring(0, 100)
          }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    }
    
    // Return success with diagnostic info
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Test function working correctly',
        environment: envTest,
        requestSummary: {
          hasVideoData: !!parsedBody.videoData,
          videoDataLength: parsedBody.videoData?.length,
          videoSize: parsedBody.videoSize,
          videoJobId: parsedBody.videoJobId,
          bodyKeys: Object.keys(parsedBody)
        },
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('=== TEST FUNCTION ERROR ===');
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: 'Test function failed',
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