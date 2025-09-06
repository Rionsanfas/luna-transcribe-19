import { useState } from "react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Maximize,
  Settings,
  Captions,
  Zap
} from "lucide-react";

export const VideoWorkspace = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState([45]);
  const [volume, setVolume] = useState([80]);

  return (
    <div className="flex-1 space-y-4">
      {/* Video Player */}
      <GlassCard className="relative">
        <div className="aspect-video bg-muted rounded-lg relative overflow-hidden">
          {/* Video placeholder */}
          <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
            <div className="text-center">
              <Zap className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-muted-foreground">Upload a video to get started</p>
              <p className="text-sm text-muted-foreground">Your video preview will appear here</p>
            </div>
          </div>
          
          {/* Subtitle overlay (demo) */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
            <div className="bg-black/80 text-white px-4 py-2 rounded-lg">
              <p className="text-center">Sample subtitle text will appear here</p>
            </div>
          </div>

          {/* Video controls overlay */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-black/50 backdrop-blur-sm rounded-lg p-3">
              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="text-white hover:bg-white/20"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                
                <Button size="sm" variant="ghost" className="text-white hover:bg-white/20">
                  <SkipBack className="w-4 h-4" />
                </Button>
                
                <Button size="sm" variant="ghost" className="text-white hover:bg-white/20">
                  <SkipForward className="w-4 h-4" />
                </Button>

                <div className="flex-1 px-3">
                  <Slider
                    value={currentTime}
                    onValueChange={setCurrentTime}
                    max={180}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-white" />
                  <Slider
                    value={volume}
                    onValueChange={setVolume}
                    max={100}
                    step={1}
                    className="w-20"
                  />
                </div>

                <Button size="sm" variant="ghost" className="text-white hover:bg-white/20">
                  <Captions className="w-4 h-4" />
                </Button>
                
                <Button size="sm" variant="ghost" className="text-white hover:bg-white/20">
                  <Settings className="w-4 h-4" />
                </Button>
                
                <Button size="sm" variant="ghost" className="text-white hover:bg-white/20">
                  <Maximize className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Timeline Scrubber */}
      <GlassCard>
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-sm">Timeline</h4>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">00:45 / 03:00</Badge>
              <Button size="sm" variant="ghost" className="h-6 text-xs">
                Zoom In
              </Button>
            </div>
          </div>
          
          {/* Timeline track */}
          <div className="relative h-12 bg-muted rounded-lg overflow-hidden">
            {/* Audio waveform representation */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex items-end gap-1 h-8">
                {Array.from({ length: 60 }, (_, i) => (
                  <div
                    key={i}
                    className="bg-primary/30 rounded-sm"
                    style={{
                      width: '2px',
                      height: `${Math.random() * 100}%`,
                      minHeight: '4px'
                    }}
                  />
                ))}
              </div>
            </div>
            
            {/* Subtitle markers */}
            <div className="absolute top-1 left-0 right-0 flex gap-2 px-2">
              <Badge variant="outline" className="text-xs bg-primary/10">Subtitle 1</Badge>
              <Badge variant="outline" className="text-xs bg-primary/10">Subtitle 2</Badge>
              <Badge variant="outline" className="text-xs bg-primary/10">Subtitle 3</Badge>
            </div>
            
            {/* Playhead */}
            <div className="absolute top-0 bottom-0 w-0.5 bg-primary" style={{ left: '25%' }}>
              <div className="w-3 h-3 bg-primary rounded-full absolute -top-1 -left-1" />
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};