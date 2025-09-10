import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('=== TEST MINIMAL FUNCTION START ===');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('Headers:', Object.fromEntries(req.headers.entries()));
    
    // Test environment variables
    const envStatus = {
      hasOpenAiKey: !!Deno.env.get('OPENAI_API_KEY'),
      hasSupabaseUrl: !!Deno.env.get('SUPABASE_URL'),
      hasSupabaseAnonKey: !!Deno.env.get('SUPABASE_ANON_KEY'),
      hasSupabaseServiceKey: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
      openAiKeyLength: Deno.env.get('OPENAI_API_KEY')?.length || 0
    };
    console.log('Environment status:', envStatus);
    
    // Test request body parsing
    let requestBody;
    try {
      const bodyText = await req.text();
      console.log('Raw body length:', bodyText.length);
      console.log('Raw body preview:', bodyText.substring(0, 200));
      
      requestBody = JSON.parse(bodyText);
      console.log('Parsed body keys:', Object.keys(requestBody));
    } catch (parseError) {
      console.error('Body parse error:', parseError);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid JSON body',
          details: parseError.message
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Test Supabase client creation
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? ''
      );
      console.log('Supabase client created successfully');
      
      // Test authentication
      const authorization = req.headers.get('Authorization');
      if (authorization) {
        const token = authorization.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);
        console.log('Auth test:', {
          hasUser: !!user,
          userId: user?.id,
          error: userError?.message
        });
      } else {
        console.log('No authorization header provided');
      }
    } catch (supabaseError) {
      console.error('Supabase client error:', supabaseError);
    }
    
    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Test function working correctly',
        timestamp: new Date().toISOString(),
        environment: envStatus,
        requestKeys: requestBody ? Object.keys(requestBody) : []
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('=== CRITICAL ERROR ===');
    console.error('Error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Function failed',
        details: error.message,
        stack: error.stack
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});