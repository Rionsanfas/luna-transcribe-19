import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { FFmpeg } from "https://esm.sh/@ffmpeg/ffmpeg@0.12.7";
import { fetchFile, toBlobURL } from "https://esm.sh/@ffmpeg/util@0.12.1";

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

      // After transcribe/translate/style-match: generate SRT, burn-in server-side, upload outputs
      const srtFileName = `${videoJob.id}/subtitles.srt`;
      const videoFileOutName = `${videoJob.id}/burned.mp4`;

      // Generate SRT content
      const srtContent = generateSRTContent(result.subtitles);

      // Burn subtitles using FFmpeg WASM (ratio-aware)
      let processedVideo: Uint8Array;
      let burnLogs: string[] = [];
      try {
        const burn = await createVideoWithSubtitles(videoBuffer, result.subtitles, (result as any).styleAnalysis);
        processedVideo = burn.processedVideo;
        burnLogs = burn.logs;
      } catch (burnErr) {
        console.error('FFmpeg burn-in failed:', burnErr);
        await supabase
          .from('video_jobs')
          .update({ status: 'failed', error_message: `FFmpeg burn-in failed: ${String(burnErr)}` })
          .eq('id', videoJob.id);
        return new Response(JSON.stringify({ error: `FFmpeg burn-in failed`, details: String(burnErr) }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Upload SRT file
      const { error: srtUploadError } = await supabase.storage
        .from('processed-videos')
        .upload(srtFileName, new TextEncoder().encode(srtContent), {
          contentType: 'text/plain',
          upsert: true
        });
      if (srtUploadError) {
        console.error('SRT upload error:', srtUploadError);
      }

      // Upload burned video
      const { error: videoUploadError } = await supabase.storage
        .from('processed-videos')
        .upload(videoFileOutName, processedVideo, {
          contentType: 'video/mp4',
          upsert: true
        });

      if (videoUploadError) {
        console.error('Burned video upload error:', videoUploadError);
        await supabase
          .from('video_jobs')
          .update({ status: 'failed', error_message: `Upload failed: ${videoUploadError.message}` })
          .eq('id', videoJob.id);
        return new Response(JSON.stringify({ error: 'Failed to upload processed video', details: videoUploadError.message, ffmpegLogs: burnLogs.slice(-200) }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Mark job as completed and set file paths
      await supabase
        .from('video_jobs')
        .update({
          status: 'completed',
          subtitle_file_path: srtFileName,
          output_file_path: videoFileOutName,
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

      // Create signed URLs (valid 7 days)
      const { data: srtSignedUrl } = await supabase.storage
        .from('processed-videos')
        .createSignedUrl(srtFileName, 60 * 60 * 24 * 7);

      const { data: videoSignedUrl } = await supabase.storage
        .from('processed-videos')
        .createSignedUrl(videoFileOutName, 60 * 60 * 24 * 7);

      return new Response(JSON.stringify({
        success: true,
        jobId: videoJob.id,
        status: 'completed',
        result: {
          subtitles: result.subtitles,
          srtUrl: srtSignedUrl?.signedUrl || null,
          videoUrl: videoSignedUrl?.signedUrl || null
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

async function createVideoWithSubtitles(
  videoBuffer: Uint8Array,
  subtitles: any[],
  styleAnalysis?: string
): Promise<{ processedVideo: Uint8Array; logs: string[]; width: number; height: number }> {
  console.log(`Processing video with ${subtitles.length} subtitle segments using FFmpeg WASM`);

  const logs: string[] = [];
  try {
    // Initialize FFmpeg WASM
    const ffmpeg = new FFmpeg();
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.4/dist/umd';
    ffmpeg.on('log', ({ message }) => {
      logs.push(message);
      console.log('FFmpeg Log:', message);
    });

    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    // Write input video
    await ffmpeg.writeFile('input.mp4', await fetchFile(new Blob([videoBuffer])));

    // Probe to get width/height
    async function probeAndGetSize(): Promise<{ width: number; height: number }> {
      let probeOutput = '';
      ffmpeg.on('log', ({ message }) => { probeOutput += message + '\n'; });
      try {
        await ffmpeg.exec(['-hide_banner', '-i', 'input.mp4', '-f', 'null', '-']);
      } catch (_) { /* Expected to error due to -f null; we only need logs */ }
      const match = probeOutput.match(/(\d{2,5})x(\d{2,5})/);
      const width = match ? parseInt(match[1], 10) : 1080;
      const height = match ? parseInt(match[2], 10) : 1080;
      return { width, height };
    }

    const { width, height } = await probeAndGetSize();

    // Prepare subtitles files (SRT or ASS)
    const defaultStyle = getDefaultSubtitleStyle();
    const parsedStyle = styleAnalysis ? parseStyleAnalysis(styleAnalysis) : defaultStyle;

    // Ratio-aware sizing
    const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
    const fontSizePx = clamp(parsedStyle.fontSize || Math.round(height * 0.045), 16, Math.max(28, Math.round(height * 0.07)));
    const marginV = clamp(parsedStyle.marginV || Math.round(height * 0.05), 10, Math.round(height * 0.1));

    // Write SRT for upload and as fallback
    const srtContent = generateSRTContent(subtitles);
    await ffmpeg.writeFile('subtitles.srt', srtContent);

    // If we have style JSON, build an ASS file for richer styling
    let useAss = false;
    if (styleAnalysis) {
      useAss = true;
      const ass = buildAssFromStyle(parsedStyle, width, height, fontSizePx, marginV);
      await ffmpeg.writeFile('subtitles.ass', ass);
    }

    const subtitleFilter = useAss
      ? `subtitles=subtitles.ass`
      : `subtitles=subtitles.srt:force_style='FontName=${parsedStyle.fontFamily},FontSize=${fontSizePx},PrimaryColour=${parsedStyle.primaryColor},OutlineColour=${parsedStyle.outlineColor},BackColour=${parsedStyle.backgroundColor},Bold=${parsedStyle.bold ? 1 : 0},Outline=${parsedStyle.outline},MarginV=${marginV}'`;

    // Burn subtitles
    await ffmpeg.exec([
      '-i', 'input.mp4',
      '-vf', subtitleFilter,
      '-c:a', 'copy',
      '-preset', 'ultrafast',
      '-y', 'output.mp4'
    ]);

    // Validate output has duration > 0
    let durationSec = 0;
    let validateLogs = '';
    ffmpeg.on('log', ({ message }) => { validateLogs += message + '\n'; });
    try {
      await ffmpeg.exec(['-hide_banner', '-i', 'output.mp4', '-f', 'null', '-']);
    } catch (_) { /* ignore */ }
    const durMatch = validateLogs.match(/Duration: (\d{2}):(\d{2}):(\d{2})\.(\d{2})/);
    if (durMatch) {
      const h = parseInt(durMatch[1]);
      const m = parseInt(durMatch[2]);
      const s = parseInt(durMatch[3]);
      durationSec = h * 3600 + m * 60 + s;
    }

    if (durationSec <= 0) {
      console.error('Generated video failed validation. ffmpeg logs:', logs.join('\n'));
      throw new Error('FFmpeg validation failed: output video has zero or unknown duration.');
    }

    const data = await ffmpeg.readFile('output.mp4');
    const processedVideo = new Uint8Array(data as ArrayBuffer);

    return { processedVideo, logs, width, height };
  } catch (error) {
    logs.push(`Error in createVideoWithSubtitles: ${String(error?.message || error)}`);
    console.error('Error in createVideoWithSubtitles:', error);
    throw new Error(logs.join('\n'));
  }
}

// Build a minimal ASS file from parsed style
function buildAssFromStyle(style: any, width: number, height: number, fontSizePx: number, marginV: number) {
  const assColor = (hex: string) => cssHexToAssColor(hex);
  const backColor = (hex: string, opacity?: number) => cssHexToAssColorWithAlpha(hex, opacity);

  const primary = style.primaryColor || assColor('#FFFFFF');
  const outline = style.outlineColor || assColor('#000000');
  const back = style.backgroundColor || backColor('#000000', 0.6);
  const bold = style.bold ? -1 : 0;
  const outlineW = style.outline ?? 2;
  const alignment = style.position === 'top' ? 8 : style.position === 'center' ? 5 : 2; // 2 bottom-center

  return `
[Script Info]
ScriptType: v4.00+
PlayResX: ${width}
PlayResY: ${height}

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${style.fontFamily || 'Arial'},${fontSizePx},${primary},&H000000,${outline},${back},${bold},0,0,0,100,100,0,0,1,${outlineW},0,${alignment},20,20,${marginV},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${subtitles.map((s, idx) => `Dialogue: 0,${formatSRTTime(s.start || idx * 2).replace(',', '.')},${formatSRTTime(s.end || (idx + 1) * 2).replace(',', '.')},Default,,0,0,${marginV},,${(s.text || '').replace(/\n/g, '\\N')}`).join('\n')}
`;}

// Color helpers for ASS
function cssHexToAssColor(hex: string) {
  const m = /#?([0-9a-fA-F]{6})/.exec(hex || '')?.[1] || 'FFFFFF';
  const r = m.slice(0,2), g = m.slice(2,4), b = m.slice(4,6);
  return `&H${b}${g}${r}`; // BGR
}
function cssHexToAssColorWithAlpha(hex: string, opacity?: number) {
  const m = /#?([0-9a-fA-F]{6})/.exec(hex || '')?.[1] || '000000';
  const r = m.slice(0,2), g = m.slice(2,4), b = m.slice(4,6);
  const a = typeof opacity === 'number' ? Math.round((1 - Math.max(0, Math.min(1, opacity))) * 255) : 128; // default 0.5
  const aa = a.toString(16).padStart(2, '0').toUpperCase();
  return `&H${aa}${b}${g}${r}`; // A + BGR
}

// Validate video output using FFmpeg probe
async function validateVideoOutput(ffmpeg: FFmpeg, filename: string): Promise<boolean> {
  try {
    await ffmpeg.exec(['-i', filename, '-f', 'null', '-']);
    
    // If ffmpeg doesn't throw, the video is valid
    return true;
  } catch (error) {
    console.error('Video validation failed:', error);
    return false;
  }
}

function getDefaultSubtitleStyle() {
  return {
    fontFamily: 'Arial',
    fontSize: 24,
    primaryColor: cssHexToAssColor('#FFFFFF'), // White
    outlineColor: cssHexToAssColor('#000000'), // Black
    backgroundColor: cssHexToAssColorWithAlpha('#000000', 0.5), // Semi-transparent black
    bold: true,
    outline: 2,
    marginV: 30
  };
}

// Parse style analysis JSON to extract styling information
function parseStyleAnalysis(styleAnalysis: string) {
  const style = getDefaultSubtitleStyle();
  if (!styleAnalysis) return style;

  try {
    const raw = JSON.parse(styleAnalysis);

    const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, Number(n)));

    if (raw.fontFamily) style.fontFamily = String(raw.fontFamily);
    if (raw.fontSize) style.fontSize = clamp(raw.fontSize, 12, 96);
    if (raw.textColor) style.primaryColor = cssHexToAssColor(String(raw.textColor));
    if (raw.strokeColor) style.outlineColor = cssHexToAssColor(String(raw.strokeColor));
    if (raw.backgroundColor) style.backgroundColor = cssHexToAssColorWithAlpha(String(raw.backgroundColor), typeof raw.backgroundOpacity === 'number' ? raw.backgroundOpacity : 0.6);
    if (raw.strokeWidth) style.outline = clamp(raw.strokeWidth, 0, 8);
    if (raw.position) {
      const pos = String(raw.position).toLowerCase();
      style.marginV = pos === 'top' ? 10 : pos === 'center' ? 50 : 30;
    }
  } catch (error) {
    console.error('Error parsing style analysis JSON:', error);
  }

  return style;
}