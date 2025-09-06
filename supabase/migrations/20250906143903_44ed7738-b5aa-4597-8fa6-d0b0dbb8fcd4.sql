-- Add GIN index for full-text search on subtitles
CREATE INDEX idx_video_subtitles_text_gin 
ON public.video_subtitles USING GIN (to_tsvector('english', text));

-- Add unique constraint to subtitle_styles for one-to-one relationship with video jobs
-- (Users can have one active style per video job, but can save multiple presets globally)
ALTER TABLE public.subtitle_styles 
ADD CONSTRAINT unique_style_per_video_job 
UNIQUE (video_job_id);

-- Add comment to clarify the design
COMMENT ON CONSTRAINT unique_style_per_video_job ON public.subtitle_styles 
IS 'Ensures one active style per video job. Users can save multiple global presets via subtitle_presets table.';