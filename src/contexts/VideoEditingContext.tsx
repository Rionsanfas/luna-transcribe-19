import { createContext, useContext, useState, ReactNode } from 'react';

export interface SubtitleSettings {
  positionOffset: number;
  maxWidth: number;
  lineHeight: number;
  animations: boolean;
  background: boolean;
  activeWordHighlight: boolean;
  textShadow: boolean;
  textAmountDisplay: 'auto' | 'word-by-word' | 'line-by-line' | 'sentence';
  backgroundTransparency: number;
}

export interface CustomizationSettings {
  fontFamily: string;
  fontVariant: string;
  fontSize: number;
  textColor: string;
  strokeWidth: number;
  textTransformation: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
}

export interface CropSettings {
  aspectRatio: string;
  horizontalOffset: number;
  verticalOffset: number;
}

export interface ExportSettings {
  compression: number;
  quality: number;
  resolution: string;
  frameRate: string;
}

export interface VideoEditingState {
  subtitleSettings: SubtitleSettings;
  customizationSettings: CustomizationSettings;
  cropSettings: CropSettings;
  exportSettings: ExportSettings;
  currentVideo: File | null;
  isProcessing: boolean;
}

interface VideoEditingContextType extends VideoEditingState {
  updateSubtitleSettings: (settings: Partial<SubtitleSettings>) => void;
  updateCustomizationSettings: (settings: Partial<CustomizationSettings>) => void;
  updateCropSettings: (settings: Partial<CropSettings>) => void;
  updateExportSettings: (settings: Partial<ExportSettings>) => void;
  setCurrentVideo: (video: File | null) => void;
  setIsProcessing: (processing: boolean) => void;
  generateSubtitles: () => Promise<void>;
  exportVideo: () => Promise<void>;
}

const VideoEditingContext = createContext<VideoEditingContextType | undefined>(undefined);

export const useVideoEditing = () => {
  const context = useContext(VideoEditingContext);
  if (!context) {
    throw new Error('useVideoEditing must be used within a VideoEditingProvider');
  }
  return context;
};

interface VideoEditingProviderProps {
  children: ReactNode;
}

export const VideoEditingProvider = ({ children }: VideoEditingProviderProps) => {
  const [state, setState] = useState<VideoEditingState>({
    subtitleSettings: {
      positionOffset: 50,
      maxWidth: 80,
      lineHeight: 120,
      animations: true,
      background: true,
      activeWordHighlight: false,
      textShadow: true,
      textAmountDisplay: 'auto',
      backgroundTransparency: 80,
    },
    customizationSettings: {
      fontFamily: 'fredoka',
      fontVariant: 'regular',
      fontSize: 24,
      textColor: '#ffffff',
      strokeWidth: 2,
      textTransformation: 'none',
    },
    cropSettings: {
      aspectRatio: '16:9',
      horizontalOffset: 0,
      verticalOffset: 0,
    },
    exportSettings: {
      compression: 75,
      quality: 85,
      resolution: '1080p',
      frameRate: '30',
    },
    currentVideo: null,
    isProcessing: false,
  });

  const updateSubtitleSettings = (settings: Partial<SubtitleSettings>) => {
    setState(prev => ({
      ...prev,
      subtitleSettings: { ...prev.subtitleSettings, ...settings }
    }));
  };

  const updateCustomizationSettings = (settings: Partial<CustomizationSettings>) => {
    setState(prev => ({
      ...prev,
      customizationSettings: { ...prev.customizationSettings, ...settings }
    }));
  };

  const updateCropSettings = (settings: Partial<CropSettings>) => {
    setState(prev => ({
      ...prev,
      cropSettings: { ...prev.cropSettings, ...settings }
    }));
  };

  const updateExportSettings = (settings: Partial<ExportSettings>) => {
    setState(prev => ({
      ...prev,
      exportSettings: { ...prev.exportSettings, ...settings }
    }));
  };

  const setCurrentVideo = (video: File | null) => {
    setState(prev => ({ ...prev, currentVideo: video }));
  };

  const setIsProcessing = (processing: boolean) => {
    setState(prev => ({ ...prev, isProcessing: processing }));
  };

  const generateSubtitles = async () => {
    if (!state.currentVideo) return;
    
    setIsProcessing(true);
    try {
      // TODO: Implement AI subtitle generation using Supabase Edge Function
      // This would call your Supabase edge function that uses OpenAI to generate subtitles
      console.log('Generating subtitles for:', state.currentVideo.name);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      console.log('Subtitles generated successfully');
    } catch (error) {
      console.error('Error generating subtitles:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const exportVideo = async () => {
    if (!state.currentVideo) return;
    
    setIsProcessing(true);
    try {
      // TODO: Implement video processing and export using FFmpeg or similar
      console.log('Exporting video with settings:', {
        crop: state.cropSettings,
        subtitles: state.subtitleSettings,
        customization: state.customizationSettings,
        export: state.exportSettings
      });
      
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      console.log('Video exported successfully');
    } catch (error) {
      console.error('Error exporting video:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const value: VideoEditingContextType = {
    ...state,
    updateSubtitleSettings,
    updateCustomizationSettings,
    updateCropSettings,
    updateExportSettings,
    setCurrentVideo,
    setIsProcessing,
    generateSubtitles,
    exportVideo,
  };

  return (
    <VideoEditingContext.Provider value={value}>
      {children}
    </VideoEditingContext.Provider>
  );
};