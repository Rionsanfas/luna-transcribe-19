import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageData, customPrompt, imageFormat } = await req.json();

    if (!imageData) {
      throw new Error('No image data provided');
    }

    console.log('Analyzing subtitle style from image');
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    // Get user from auth token
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Authentication failed');
    }

    const systemPrompt = `You are an expert at analyzing subtitle and text styling in images. Analyze the provided image and extract all visual properties of any text/subtitles you find.

Return a JSON response with the following structure (provide realistic values based on what you observe):
{
  "fontFamily": "detected font name (e.g., 'Arial', 'Roboto', 'Inter')",
  "fontSize": number (estimated pixel size, typically 16-72),
  "fontWeight": "weight as string (e.g., '400', '600', '700')",
  "textColor": "hex color code (e.g., '#FFFFFF')",
  "backgroundColor": "hex color for text background (e.g., '#000000')",
  "backgroundOpacity": number (0-100, estimated opacity percentage),
  "hasBackground": boolean (true if text has background/box),
  "textShadow": boolean (true if text has drop shadow or outline),
  "position": "bottom" | "top" | "center" (where text appears in image),
  "positionOffset": number (pixels from edge, typically 20-100),
  "maxWidth": number (percentage of image width, typically 60-95),
  "lineHeight": number (percentage, typically 100-150),
  "textTransform": "none" | "uppercase" | "lowercase" | "capitalize",
  "borderRadius": number (0-20, for background corners),
  "strokeWidth": number (0-5, text outline thickness),
  "animations": boolean (false for static images),
  "confidence": number (0.0-1.0, your confidence in the analysis)
}

Focus on: font style, colors, positioning, background styling, shadows, and overall visual treatment.`;

    const userPrompt = customPrompt || "Analyze all subtitle styling elements in this image including fonts, colors, positioning, backgrounds, and effects.";

    // Analyze with OpenAI GPT-4 Vision
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: userPrompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${imageFormat};base64,${imageData}`,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    const analysisText = result.choices[0]?.message?.content;
    
    if (!analysisText) {
      throw new Error('No analysis result from OpenAI');
    }

    console.log('OpenAI Analysis Result:', analysisText);

    // Parse JSON response from GPT-4
    let styleData;
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = analysisText.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || 
                       analysisText.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        styleData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } else {
        throw new Error('No valid JSON found in response');
      }
    } catch (parseError) {
      console.error('JSON parsing failed:', parseError);
      console.error('Raw response:', analysisText);
      
      // Fallback: provide default styling with low confidence
      styleData = {
        fontFamily: 'Inter',
        fontSize: 24,
        fontWeight: '600',
        textColor: '#FFFFFF',
        backgroundColor: '#000000',
        backgroundOpacity: 80,
        hasBackground: true,
        textShadow: true,
        position: 'bottom',
        positionOffset: 50,
        maxWidth: 80,
        lineHeight: 120,
        textTransform: 'none',
        borderRadius: 8,
        strokeWidth: 2,
        animations: false,
        confidence: 0.3
      };
    }

    // Validate and sanitize the response
    const validatedStyle = {
      fontFamily: styleData.fontFamily || 'Inter',
      fontSize: Math.max(12, Math.min(72, styleData.fontSize || 24)),
      fontWeight: styleData.fontWeight || '600',
      textColor: styleData.textColor || '#FFFFFF',
      backgroundColor: styleData.backgroundColor || '#000000',
      backgroundOpacity: Math.max(0, Math.min(100, styleData.backgroundOpacity || 80)),
      hasBackground: Boolean(styleData.hasBackground),
      textShadow: Boolean(styleData.textShadow),
      position: ['bottom', 'top', 'center'].includes(styleData.position) ? styleData.position : 'bottom',
      positionOffset: Math.max(0, Math.min(200, styleData.positionOffset || 50)),
      maxWidth: Math.max(30, Math.min(100, styleData.maxWidth || 80)),
      lineHeight: Math.max(80, Math.min(200, styleData.lineHeight || 120)),
      textTransform: ['none', 'uppercase', 'lowercase', 'capitalize'].includes(styleData.textTransform) 
        ? styleData.textTransform : 'none',
      borderRadius: Math.max(0, Math.min(20, styleData.borderRadius || 8)),
      strokeWidth: Math.max(0, Math.min(10, styleData.strokeWidth || 2)),
      animations: Boolean(styleData.animations),
      confidence: Math.max(0, Math.min(1, styleData.confidence || 0.8))
    };

    console.log('Validated Style Analysis:', validatedStyle);

    // Log the analysis for future training/improvement
    await supabase.from('style_analysis_logs').insert({
      user_id: user.id,
      image_format: imageFormat,
      custom_prompt: customPrompt,
      detected_style: validatedStyle,
      confidence: validatedStyle.confidence,
      raw_response: analysisText
    }).catch(error => {
      console.warn('Failed to log analysis:', error);
    });

    return new Response(
      JSON.stringify(validatedStyle),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Style analysis error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to analyze subtitle style',
        details: error.stack 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});