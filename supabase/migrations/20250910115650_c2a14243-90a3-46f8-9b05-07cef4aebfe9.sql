-- Drop the existing check constraint
ALTER TABLE video_jobs DROP CONSTRAINT IF EXISTS video_jobs_processing_type_check;

-- Add new check constraint with style_matching included
ALTER TABLE video_jobs ADD CONSTRAINT video_jobs_processing_type_check 
CHECK (processing_type IN ('transcription', 'translation', 'style_matching'));