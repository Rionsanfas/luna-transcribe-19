-- Create improved style analysis logs table with all optimizations
CREATE TABLE public.style_analysis_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_format text NOT NULL CHECK (image_format IN ('png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp')),
  custom_prompt text,
  detected_style jsonb NOT NULL,
  confidence real NOT NULL DEFAULT 0.0,
  raw_response jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.style_analysis_logs ENABLE ROW LEVEL SECURITY;

-- Create comprehensive policies for style analysis logs
CREATE POLICY "Users can view own style analysis logs"
  ON public.style_analysis_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own style analysis logs"
  ON public.style_analysis_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own style analysis logs"
  ON public.style_analysis_logs
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_style_analysis_logs_updated_at
  BEFORE UPDATE ON public.style_analysis_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create optimized indexes for better query performance
CREATE INDEX idx_style_analysis_logs_user_id ON public.style_analysis_logs(user_id);
CREATE INDEX idx_style_analysis_logs_created_at ON public.style_analysis_logs(created_at DESC);
CREATE INDEX idx_style_analysis_logs_image_format ON public.style_analysis_logs(image_format);