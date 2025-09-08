-- Add UPDATE policy for style analysis logs
CREATE POLICY "Users can update own style analysis logs"
  ON public.style_analysis_logs
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Improve confidence column type for better performance
ALTER TABLE public.style_analysis_logs 
  ALTER COLUMN confidence TYPE real;

-- Change raw_response to jsonb for better querying capabilities
ALTER TABLE public.style_analysis_logs 
  ALTER COLUMN raw_response TYPE jsonb USING raw_response::jsonb;

-- Add CHECK constraint for image format validation
ALTER TABLE public.style_analysis_logs 
  ADD CONSTRAINT valid_image_format 
  CHECK (image_format IN ('png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'));