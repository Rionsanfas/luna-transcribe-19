import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useVideoEditing } from "@/contexts/VideoEditingContext";
import { AVAILABLE_FONTS, getFontCSS, loadGoogleFont } from "./fonts";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Maximize,
  Settings,
  Captions,
  Zap,
  Download
} from "lucide-react";

interface VideoPreviewProps {
  videoFile?: File | null;
  subtitles?: Array<{
    id: string;
    startTime: number;
    endTime: number;
    text: string;
  }>;
  onTimeUpdate?: (time: number) => void;
  onDownloadVideo?: () => void;
  onDownloadSRT?: () => void;
}

export const VideoPreview = ({ 
  videoFile, 
  subtitles = [], 
  onTimeUpdate,
  onDownloadVideo,
  onDownloadSRT
}: VideoPreviewProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState([80]);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [videoUrl, setVideoUrl] = useState<string>("");

  const { 
    subtitleSettings, 
    customizationSettings,
    cropSettings 
  } = useVideoEditing();

  // Create video URL when file changes
  useEffect(() => {
    if (videoFile) {
      const url = URL.createObjectURL(videoFile);
      setVideoUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [videoFile]);

  // Load font when font family changes
  useEffect(() => {
    const font = AVAILABLE_FONTS.find(f => f.family === customizationSettings.fontFamily);
    if (font && font.source === 'google') {
      loadGoogleFont(font, [customizationSettings.fontVariant]);
    }
  }, [customizationSettings.fontFamily, customizationSettings.fontVariant]);

  // Update video time
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const time = video.currentTime;
      setCurrentTime(time);
      onTimeUpdate?.(time);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [onTimeUpdate]);

  // Get current subtitle
  const currentSubtitle = subtitles.find(
    sub => currentTime >= sub.startTime && currentTime <= sub.endTime
  );

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (time: number) => {
    const video = videoRef.current;
    if (!video) return;
    
    video.currentTime = time;
    setCurrentTime(time);
  };

  const handleVolumeChange = (newVolume: number[]) => {
    const video = videoRef.current;
    if (!video) return;
    
    video.volume = newVolume[0] / 100;
    setVolume(newVolume);
  };

  const skipTime = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    handleSeek(newTime);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Generate subtitle style
  const getSubtitleStyle = () => {
    const font = AVAILABLE_FONTS.find(f => f.family === customizationSettings.fontFamily);
    const fontFamily = font ? getFontCSS(font) : 'sans-serif';

    return {
      fontFamily,
      fontSize: `${customizationSettings.fontSize}px`,
      fontWeight: customizationSettings.fontVariant,
      color: customizationSettings.textColor,
      textTransform: customizationSettings.textTransformation as any,
      lineHeight: subtitleSettings.lineHeight / 100,
      maxWidth: `${subtitleSettings.maxWidth}%`,
      textShadow: subtitleSettings.textShadow ? `2px 2px 4px rgba(0,0,0,0.8)` : 'none',
      backgroundColor: subtitleSettings.background ? 
        `rgba(0,0,0,${subtitleSettings.backgroundTransparency / 100})` : 'transparent',
      padding: subtitleSettings.background ? '8px 16px' : '0',
      borderRadius: subtitleSettings.background ? '8px' : '0',
      position: 'absolute' as const,
      bottom: `${subtitleSettings.positionOffset}px`,
      left: '50%',
      transform: 'translateX(-50%)',
      textAlign: 'center' as const,
      zIndex: 10,
    };
  };

  return (
    <div className="space-y-4">
      {/* Video Player */}
      <GlassCard className="relative overflow-hidden">
        <div 
          className="aspect-video bg-muted rounded-lg relative overflow-hidden"
          style={{
            aspectRatio: cropSettings.aspectRatio.replace(':', '/'),
          }}
        >
          {videoFile && videoUrl ? (
            <>
              <video
                ref={videoRef}
                src={videoUrl}
                className="w-full h-full object-cover"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
              
              {/* Subtitle overlay */}
              {showSubtitles && currentSubtitle && (
                <div style={getSubtitleStyle()}>
                  {currentSubtitle.text}
                </div>
              )}
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
              <div className="text-center">
                <Zap className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-muted-foreground">Upload a video to get started</p>
                <p className="text-sm text-muted-foreground">Your video preview will appear here</p>
              </div>
            </div>
          )}

          {/* Video controls overlay */}
          {videoFile && (
            <div className="absolute bottom-4 left-4 right-4">
              <div className="bg-black/50 backdrop-blur-sm rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={togglePlayPause}
                    className="text-white hover:bg-white/20"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-white hover:bg-white/20"
                    onClick={() => skipTime(-10)}
                  >
                    <SkipBack className="w-4 h-4" />
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-white hover:bg-white/20"
                    onClick={() => skipTime(10)}
                  >
                    <SkipForward className="w-4 h-4" />
                  </Button>

                  <div className="flex-1 px-3">
                    <Slider
                      value={[currentTime]}
                      onValueChange={([time]) => handleSeek(time)}
                      max={duration || 100}
                      step={0.1}
                      className="w-full"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-white" />
                    <Slider
                      value={volume}
                      onValueChange={handleVolumeChange}
                      max={100}
                      step={1}
                      className="w-20"
                    />
                  </div>

                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-white hover:bg-white/20"
                    onClick={() => setShowSubtitles(!showSubtitles)}
                  >
                    <Captions className={`w-4 h-4 ${showSubtitles ? 'text-primary' : ''}`} />
                  </Button>
                  
                  <Button size="sm" variant="ghost" className="text-white hover:bg-white/20">
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Download buttons */}
        {videoFile && (
          <div className="absolute top-4 right-4 flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={onDownloadSRT}
              className="bg-black/50 hover:bg-black/70 text-white border-0"
            >
              <Download className="w-4 h-4 mr-1" />
              SRT
            </Button>
            <Button
              size="sm"
              onClick={onDownloadVideo}
              className="bg-primary/90 hover:bg-primary text-white"
            >
              <Download className="w-4 h-4 mr-1" />
              Video
            </Button>
          </div>
        )}
      </GlassCard>

      {/* Timeline & Info */}
      {videoFile && (
        <GlassCard>
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-sm">Timeline</h4>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {subtitles.length} subtitles
                </Badge>
              </div>
            </div>
            
            {/* Timeline track */}
            <div className="relative h-12 bg-muted rounded-lg overflow-hidden">
              {/* Progress bar */}
              <div 
                className="absolute top-0 left-0 h-full bg-primary/20 transition-all duration-150"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
              
              {/* Subtitle markers */}
              <div className="absolute top-1 left-0 right-0 flex gap-1 px-2 overflow-hidden">
                {subtitles.slice(0, 10).map((sub, i) => (
                  <Badge 
                    key={sub.id} 
                    variant="outline" 
                    className={`text-xs cursor-pointer transition-colors ${
                      currentTime >= sub.startTime && currentTime <= sub.endTime 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-primary/10'
                    }`}
                    onClick={() => handleSeek(sub.startTime)}
                  >
                    #{i + 1}
                  </Badge>
                ))}
                {subtitles.length > 10 && (
                  <Badge variant="outline" className="text-xs">
                    +{subtitles.length - 10}
                  </Badge>
                )}
              </div>
              
              {/* Playhead */}
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-primary transition-all duration-150" 
                style={{ left: `${(currentTime / duration) * 100}%` }}
              >
                <div className="w-3 h-3 bg-primary rounded-full absolute -top-1 -left-1" />
              </div>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
};