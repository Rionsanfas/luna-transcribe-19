import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error('Invalid token');

    const { jobId, editedText } = await req.json();

    const { data: videoJob, error: jobError } = await supabase
      .from('video_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single();
    if (jobError || !videoJob) throw new Error('Job not found');

    const { data: videoData, error: downloadError } = await supabase.storage
      .from('videos')
      .download(videoJob.input_file_path);
    if (downloadError) throw new Error('Failed to download video');
    const videoBuffer = new Uint8Array(await videoData.arrayBuffer());

    let subtitles;
    if (editedText) {
      subtitles = await retimeSubtitlesWithWhisper(videoBuffer, editedText);
      await supabase.from('video_subtitles').delete().eq('video_job_id', jobId);
      await supabase.from('video_subtitles').insert(
        subtitles.map(s => ({
          video_job_id: jobId,
          start_time: s.start,
          end_time: s.end,
          text: s.text,
          confidence: s.confidence || 0.9,
          manual_edit: true
        }))
      );
    } else {
      const { data: existingSubtitles } = await supabase
        .from('video_subtitles')
        .select('*')
        .eq('video_job_id', jobId)
        .order('start_time', { ascending: true });
      subtitles = existingSubtitles;
    }

    const vttContent = srtToVtt(generateSRTContent(subtitles));

    const vttFileName = `${jobId}/subtitles.vtt`;
    await supabase.storage
      .from('processed-videos')
      .update(vttFileName, new TextEncoder().encode(vttContent), { contentType: 'text/vtt', upsert: true });

    const processedFileName = `${jobId}/processed_${videoJob.original_filename}`;
    await supabase.storage
      .from('processed-videos')
      .update(processedFileName, videoBuffer, { contentType: 'video/mp4', upsert: true });

    const { data: videoUrlData } = supabase.storage.from('processed-videos').getPublicUrl(processedFileName);
    const { data: vttUrlData } = supabase.storage.from('processed-videos').getPublicUrl(vttFileName);

    return new Response(JSON.stringify({
      success: true,
      videoUrl: videoUrlData.publicUrl,
      subtitlesUrl: vttUrlData.publicUrl
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateSRTContent(subtitles: any[]): string {
  return subtitles.map((s, i) => {
    const start = formatSRTTime(s.start_time);
    const end = formatSRTTime(s.end_time);
    return `${i + 1}\n${start} --> ${end}\n${s.text}\n`;
  }).join('\n');
}

function formatSRTTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')},${ms.toString().padStart(3,'0')}`;
}

function srtToVtt(srt: string): string {
  return 'WEBVTT\n\n' + srt.replace(/\r+/g, '').replace(/(\d+:\d+:\d+),(\d+)/g, '$1.$2');
}

async function retimeSubtitlesWithWhisper(videoBuffer: Uint8Array, editedText: string): Promise<any[]> {
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiKey) throw new Error('OpenAI API key not configured');

  const formData = new FormData();
  formData.append('file', new Blob([videoBuffer], { type: 'video/mp4' }), 'video.mp4');
  formData.append('model', 'whisper-1');
  formData.append('response_format', 'verbose_json');
  formData.append('timestamp_granularities[]', 'word');
  formData.append('timestamp_granularities[]', 'segment');

  const resp = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${openaiKey}` },
    body: formData,
  });

  if (!resp.ok) throw new Error('Whisper transcription failed');
  const whisperResult = await resp.json();

  const editedLines = editedText.split('\n').filter(l => l.trim().length);

  const alignResp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a subtitle timing expert. Align edited text to Whisper segments. Return JSON array with start, end, text, confidence.' },
        { role: 'user', content: `Original segments: ${JSON.stringify(whisperResult.segments)}\nEdited lines: ${JSON.stringify(editedLines)}` }
      ],
      max_tokens: 2000,
      temperature: 0
    }),
  });

  if (!alignResp.ok) {
    console.warn('GPT alignment failed, fallback to Whisper segments');
    return whisperResult.segments?.map((s: any) => ({
      start: s.start,
      end: s.end,
      text: s.text.trim(),
      confidence: s.avg_logprob || 0.9
    })) || [];
  }

  try {
    const result = await alignResp.json();
    return JSON.parse(result.choices[0].message.content);
  } catch {
    console.warn('Failed to parse GPT alignment, fallback to Whisper segments');
    return whisperResult.segments?.map((s: any) => ({
      start: s.start,
      end: s.end,
      text: s.text.trim(),
      confidence: s.avg_logprob || 0.9
    })) || [];
  }
}