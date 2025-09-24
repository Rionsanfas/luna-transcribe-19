/*
 * ========================================
 * CLIENT-SIDE SUBTITLE RENDERING SYSTEM
 * ========================================
 * 
 * This function burns subtitles into videos using Canvas + MediaRecorder.
 * It's used because server-side FFmpeg doesn't work in Deno runtime.
 * 
 * Features:
 * - Canvas-based subtitle overlay with proper text wrapping
 * - MediaRecorder for video capture at specified FPS
 * - Support for custom styling (fonts, colors, positioning)
 * - Real-time subtitle synchronization during playback
 * - WebM output format for broad browser compatibility
 * 
 * Usage: Called by Dashboard after AI generates subtitles
 * Returns: WebM video blob with burned-in subtitles
 */

// Lightweight client-side subtitle burn-in using Canvas + MediaRecorder
// Note: outputs WebM for broad browser support
export type SubtitleItem = { start: number; end: number; text: string };

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const testLine = line ? line + ' ' + word : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = testLine;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export async function renderVideoWithSubtitles(
  file: File,
  subtitles: SubtitleItem[],
  {
    fontFamily = 'Inter, system-ui, Arial',
    fontSize = 32,
    textColor = 'white',
    strokeColor = 'black',
    strokeWidth = 4,
    backgroundColor = 'rgba(0,0,0,0.35)',
    marginBottom = 48,
    paddingX = 24,
    lineHeight = 1.25,
    maxWidthRatio = 0.9,
    fps = 30,
  }: Partial<{
    fontFamily: string;
    fontSize: number;
    textColor: string;
    strokeColor: string;
    strokeWidth: number;
    backgroundColor: string;
    marginBottom: number;
    paddingX: number;
    lineHeight: number;
    maxWidthRatio: number;
    fps: number;
  }> = {}
): Promise<Blob> {
  console.log(`🎬 Starting client-side subtitle burning for ${subtitles.length} subtitle segments`);
  
  return new Promise(async (resolve, reject) => {
    try {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(file);
      video.muted = true;
      video.playsInline = true;
      video.preload = 'auto';

      await new Promise<void>((res, rej) => {
        video.onloadedmetadata = () => res();
        video.onerror = () => rej(new Error('Failed to load video metadata'));
      });

      const width = video.videoWidth || 1280;
      const height = video.videoHeight || 720;
      console.log(`📐 Video dimensions: ${width}x${height}`);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');

      const stream = (canvas as HTMLCanvasElement).captureStream(fps);
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      recorder.onstop = () => {
        const out = new Blob(chunks, { type: 'video/webm' });
        console.log(`✅ Subtitle burning complete! Output size: ${(out.size / 1024 / 1024).toFixed(2)}MB`);
        resolve(out);
      };

      const draw = () => {
        // Draw current video frame
        ctx.drawImage(video, 0, 0, width, height);

        const t = video.currentTime;
        const current = subtitles.find((s) => t >= (s.start || 0) && t <= (s.end || 0));
        
        if (current && current.text) {
          ctx.save();
          const maxWidth = width * maxWidthRatio - paddingX * 2;
          ctx.font = `${fontSize}px ${fontFamily}`;
          ctx.textBaseline = 'alphabetic';
          ctx.textAlign = 'center';

          const lines = wrapText(ctx, current.text.trim(), maxWidth);
          const lineHeightPx = fontSize * lineHeight;
          const totalHeight = lines.length * lineHeightPx;
          const yStart = height - marginBottom - totalHeight;

          // Background box for better readability
          const textWidths = lines.map((l) => ctx.measureText(l).width);
          const boxWidth = Math.min(width * maxWidthRatio, Math.max(...textWidths) + paddingX * 2);
          const boxX = width / 2 - boxWidth / 2;
          const boxY = yStart - fontSize;
          const boxH = totalHeight + fontSize * 1.5;
          ctx.fillStyle = backgroundColor;
          ctx.fillRect(boxX, boxY, boxWidth, boxH);

          // Render text with stroke for better visibility
          ctx.lineWidth = strokeWidth;
          ctx.strokeStyle = strokeColor;
          ctx.fillStyle = textColor;

          lines.forEach((line, i) => {
            const y = yStart + i * lineHeightPx;
            ctx.strokeText(line, width / 2, y);
            ctx.fillText(line, width / 2, y);
          });
          ctx.restore();
        }
      };

      recorder.start();
      video.play();

      const rAF = () => {
        draw();
        if (!video.paused && !video.ended) {
          requestAnimationFrame(rAF);
        }
      };
      requestAnimationFrame(rAF);

      video.onended = () => {
        recorder.stop();
        URL.revokeObjectURL(video.src);
      };
    } catch (e) {
      console.error('❌ Subtitle burning failed:', e);
      reject(e);
    }
  });
}
