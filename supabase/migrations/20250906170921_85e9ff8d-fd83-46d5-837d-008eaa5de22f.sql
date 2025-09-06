-- SubAI: Complete Database Schema for Advanced Subtitle Management
-- Supports Classy/Dynamic and Normal subtitle styles with full customization

-- Create enum types for subtitle system
DO $$ 
BEGIN
    -- Subtitle style types (Classy/Dynamic vs Normal)
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subtitle_style_type') THEN
        CREATE TYPE subtitle_style_type AS ENUM ('classy', 'normal');
    END IF;

    -- Animation types for subtitle entrances
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'animation_type') THEN
        CREATE TYPE animation_type AS ENUM ('none', 'fade', 'slide', 'pop', 'typewriter', 'bounce');
    END IF;

    -- Subtitle positioning
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subtitle_position') THEN
        CREATE TYPE subtitle_position AS ENUM ('top', 'middle', 'bottom', 'custom');
    END IF;

    -- Processing job status
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_status') THEN
        CREATE TYPE job_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');
    END IF;

    -- Video aspect ratios for ratio-aware placement
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'video_aspect_ratio') THEN
        CREATE TYPE video_aspect_ratio AS ENUM ('16:9', '9:16', '4:3', '1:1', 'custom');
    END IF;
END $$;

-- Subtitle Presets Table - Global templates users can save and reuse
CREATE TABLE IF NOT EXISTS public.subtitle_presets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    name TEXT NOT NULL CHECK (length(name) > 0),
    description TEXT,
    
    -- Style Configuration
    style_type subtitle_style_type NOT NULL DEFAULT 'normal',
    font_family TEXT NOT NULL DEFAULT 'Fredoka',
    font_size INTEGER NOT NULL DEFAULT 24 CHECK (font_size BETWEEN 10 AND 200),
    font_weight TEXT NOT NULL DEFAULT '400' CHECK (font_weight IN ('300', '400', '500', '600', '700', '800', '900')),
    
    -- Color Settings
    primary_color TEXT NOT NULL DEFAULT '#FFFFFF' CHECK (primary_color ~ '^#[0-9A-Fa-f]{6}$'),
    secondary_color TEXT DEFAULT '#FF6B6B' CHECK (secondary_color IS NULL OR secondary_color ~ '^#[0-9A-Fa-f]{6}$'),
    background_color TEXT DEFAULT 'rgba(0,0,0,0.7)' CHECK (background_color IS NULL OR length(background_color) > 0),
    
    -- Positioning & Layout
    position subtitle_position NOT NULL DEFAULT 'bottom',
    custom_x INTEGER DEFAULT 50 CHECK (custom_x BETWEEN 0 AND 100),
    custom_y INTEGER DEFAULT 90 CHECK (custom_y BETWEEN 0 AND 100),
    max_width INTEGER DEFAULT 90 CHECK (max_width BETWEEN 20 AND 100),
    line_spacing DECIMAL(3,2) DEFAULT 1.2 CHECK (line_spacing BETWEEN 0.5 AND 3.0),
    
    -- Background & Visual Effects
    has_background BOOLEAN NOT NULL DEFAULT true,
    background_opacity DECIMAL(3,2) DEFAULT 0.7 CHECK (background_opacity BETWEEN 0.0 AND 1.0),
    border_radius INTEGER DEFAULT 8 CHECK (border_radius BETWEEN 0 AND 50),
    text_shadow BOOLEAN NOT NULL DEFAULT true,
    
    -- Animation Settings
    animation_type animation_type NOT NULL DEFAULT 'fade',
    animation_duration INTEGER DEFAULT 300 CHECK (animation_duration BETWEEN 100 AND 2000),
    animation_delay INTEGER DEFAULT 0 CHECK (animation_delay BETWEEN 0 AND 1000),
    
    -- Advanced Features
    word_emphasis BOOLEAN NOT NULL DEFAULT false,
    active_word_highlight BOOLEAN NOT NULL DEFAULT false,
    highlight_color TEXT DEFAULT '#FFD700' CHECK (highlight_color IS NULL OR highlight_color ~ '^#[0-9A-Fa-f]{6}$'),
    
    -- Ratio-aware positioning settings
    ratio_adaptive BOOLEAN NOT NULL DEFAULT true,
    vertical_ratio_offset INTEGER DEFAULT 10 CHECK (vertical_ratio_offset BETWEEN -50 AND 50),
    horizontal_ratio_offset INTEGER DEFAULT 0 CHECK (horizontal_ratio_offset BETWEEN -50 AND 50),
    
    -- Metadata
    is_default BOOLEAN NOT NULL DEFAULT false,
    is_public BOOLEAN NOT NULL DEFAULT false,
    usage_count INTEGER NOT NULL DEFAULT 0,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Video Subtitles Table - Individual subtitle entries for videos
CREATE TABLE IF NOT EXISTS public.video_subtitles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    video_job_id UUID NOT NULL REFERENCES public.video_jobs(id) ON DELETE CASCADE,
    
    -- Timing Information
    start_time DECIMAL(10,3) NOT NULL CHECK (start_time >= 0),
    end_time DECIMAL(10,3) NOT NULL CHECK (end_time > start_time),
    duration DECIMAL(10,3) GENERATED ALWAYS AS (end_time - start_time) STORED,
    
    -- Content
    text TEXT NOT NULL CHECK (length(text) > 0),
    speaker_id TEXT,
    confidence DECIMAL(4,3) CHECK (confidence BETWEEN 0 AND 1),
    
    -- Word-level data for classy subtitles
    words JSONB,
    
    -- Style Overrides
    style_override JSONB,
    
    -- Quality & Processing
    manual_edit BOOLEAN NOT NULL DEFAULT false,
    verified BOOLEAN NOT NULL DEFAULT false,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Subtitle Styles Table - Active styling for specific video jobs
CREATE TABLE IF NOT EXISTS public.subtitle_styles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    video_job_id UUID NOT NULL UNIQUE REFERENCES public.video_jobs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    
    -- Reference to preset
    preset_id UUID REFERENCES public.subtitle_presets(id) ON DELETE SET NULL,
    preset_name TEXT,
    
    -- Style Configuration (mirrors subtitle_presets)
    style_type subtitle_style_type NOT NULL DEFAULT 'normal',
    font_family TEXT NOT NULL DEFAULT 'Fredoka',
    font_size INTEGER NOT NULL DEFAULT 24 CHECK (font_size BETWEEN 10 AND 200),
    font_weight TEXT NOT NULL DEFAULT '400',
    
    -- Color Settings
    primary_color TEXT NOT NULL DEFAULT '#FFFFFF',
    secondary_color TEXT DEFAULT '#FF6B6B',
    background_color TEXT DEFAULT 'rgba(0,0,0,0.7)',
    
    -- Positioning & Layout
    position subtitle_position NOT NULL DEFAULT 'bottom',
    custom_x INTEGER DEFAULT 50,
    custom_y INTEGER DEFAULT 90,
    max_width INTEGER DEFAULT 90,
    line_spacing DECIMAL(3,2) DEFAULT 1.2,
    
    -- Background & Visual Effects
    has_background BOOLEAN NOT NULL DEFAULT true,
    background_opacity DECIMAL(3,2) DEFAULT 0.7,
    border_radius INTEGER DEFAULT 8,
    text_shadow BOOLEAN NOT NULL DEFAULT true,
    
    -- Animation Settings
    animation_type animation_type NOT NULL DEFAULT 'fade',
    animation_duration INTEGER DEFAULT 300,
    animation_delay INTEGER DEFAULT 0,
    
    -- Advanced Features
    word_emphasis BOOLEAN NOT NULL DEFAULT false,
    active_word_highlight BOOLEAN NOT NULL DEFAULT false,
    highlight_color TEXT DEFAULT '#FFD700',
    
    -- Ratio-aware positioning
    ratio_adaptive BOOLEAN NOT NULL DEFAULT true,
    vertical_ratio_offset INTEGER DEFAULT 10,
    horizontal_ratio_offset INTEGER DEFAULT 0,
    
    -- Video aspect ratio
    video_aspect_ratio video_aspect_ratio DEFAULT '16:9',
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_subtitle_presets_user_id ON public.subtitle_presets(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_subtitle_presets_style_type ON public.subtitle_presets(style_type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_video_subtitles_job_id ON public.video_subtitles(video_job_id);
CREATE INDEX IF NOT EXISTS idx_video_subtitles_timing ON public.video_subtitles(video_job_id, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_video_subtitles_words_gin ON public.video_subtitles USING GIN (words) WHERE words IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE public.subtitle_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_subtitles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtitle_styles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users manage own presets" ON public.subtitle_presets FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users manage own styles" ON public.subtitle_styles FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users manage own subtitles" ON public.video_subtitles FOR ALL USING (
    video_job_id IN (SELECT id FROM public.video_jobs WHERE user_id = auth.uid())
);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_subtitle_presets_updated_at BEFORE UPDATE ON public.subtitle_presets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_video_subtitles_updated_at BEFORE UPDATE ON public.video_subtitles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subtitle_styles_updated_at BEFORE UPDATE ON public.subtitle_styles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();