import { useState } from "react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useVideoEditing } from "@/contexts/VideoEditingContext";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Crop,
  Type,
  Palette,
  Download,
  Settings,
  Loader2
} from "lucide-react";

interface EditingPanelsProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const EditingPanels = ({ collapsed, onToggleCollapse }: EditingPanelsProps) => {
  const [cropOpen, setCropOpen] = useState(true);
  const [subtitlesOpen, setSubtitlesOpen] = useState(true);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  
  const {
    subtitleSettings,
    customizationSettings,
    cropSettings,
    exportSettings,
    currentVideo,
    isProcessing,
    updateSubtitleSettings,
    updateCustomizationSettings,
    updateCropSettings,
    updateExportSettings,
    exportVideo
  } = useVideoEditing();
  
  const { toast } = useToast();

  const handleExport = async () => {
    if (!currentVideo) {
      toast({
        title: "No video selected",
        description: "Please upload a video first",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await exportVideo();
      toast({
        title: "Export successful",
        description: "Your video has been processed and exported"
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "There was an error exporting your video",
        variant: "destructive"
      });
    }
  };

  if (collapsed) {
    return (
      <div className="w-12 p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="w-8 h-8"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-80 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Editing Panels</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="h-8 w-8"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Crop Video Panel */}
      <GlassCard>
        <Collapsible open={cropOpen} onOpenChange={setCropOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-4">
              <div className="flex items-center gap-2">
                <Crop className="w-4 h-4" />
                <span className="font-medium">Crop Video</span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${cropOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="px-4 pb-4 space-y-4">
            <div>
              <Label className="text-sm">Aspect Ratio</Label>
              <Select 
                value={cropSettings.aspectRatio} 
                onValueChange={(value) => updateCropSettings({ aspectRatio: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="16:9">16:9 (Widescreen)</SelectItem>
                  <SelectItem value="9:16">9:16 (Vertical)</SelectItem>
                  <SelectItem value="1:1">1:1 (Square)</SelectItem>
                  <SelectItem value="4:3">4:3 (Standard)</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Horizontal Offset</Label>
              <Slider 
                value={[cropSettings.horizontalOffset]} 
                onValueChange={([value]) => updateCropSettings({ horizontalOffset: value })}
                max={100} 
                min={-100} 
                step={1} 
                className="mt-2" 
              />
            </div>
            <div>
              <Label className="text-sm">Vertical Offset</Label>
              <Slider 
                value={[cropSettings.verticalOffset]} 
                onValueChange={([value]) => updateCropSettings({ verticalOffset: value })}
                max={100} 
                min={-100} 
                step={1} 
                className="mt-2" 
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </GlassCard>

      {/* Edit Subtitles Panel */}
      <GlassCard>
        <Collapsible open={subtitlesOpen} onOpenChange={setSubtitlesOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-4">
              <div className="flex items-center gap-2">
                <Type className="w-4 h-4" />
                <span className="font-medium">Edit Subtitles</span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${subtitlesOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="px-4 pb-4 space-y-4">
            <div>
              <Label className="text-sm">Position Offset</Label>
              <Slider 
                value={[subtitleSettings.positionOffset]} 
                onValueChange={([value]) => updateSubtitleSettings({ positionOffset: value })}
                max={100} 
                step={1} 
                className="mt-2" 
              />
            </div>
            <div>
              <Label className="text-sm">Max Width</Label>
              <Slider 
                value={[subtitleSettings.maxWidth]} 
                onValueChange={([value]) => updateSubtitleSettings({ maxWidth: value })}
                max={100} 
                step={1} 
                className="mt-2" 
              />
            </div>
            <div>
              <Label className="text-sm">Line Height</Label>
              <Slider 
                value={[subtitleSettings.lineHeight]} 
                onValueChange={([value]) => updateSubtitleSettings({ lineHeight: value })}
                min={100} 
                max={200} 
                step={10} 
                className="mt-2" 
              />
            </div>
            
            {/* Toggle Options */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Animations</Label>
                <Switch 
                  checked={subtitleSettings.animations} 
                  onCheckedChange={(checked) => updateSubtitleSettings({ animations: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">Background</Label>
                <Switch 
                  checked={subtitleSettings.background} 
                  onCheckedChange={(checked) => updateSubtitleSettings({ background: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">Active Word Highlight</Label>
                <Switch 
                  checked={subtitleSettings.activeWordHighlight} 
                  onCheckedChange={(checked) => updateSubtitleSettings({ activeWordHighlight: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">Text Shadow</Label>
                <Switch 
                  checked={subtitleSettings.textShadow} 
                  onCheckedChange={(checked) => updateSubtitleSettings({ textShadow: checked })}
                />
              </div>
            </div>

            <Separator />

            <div>
              <Label className="text-sm">Text Amount Display</Label>
              <Select 
                value={subtitleSettings.textAmountDisplay} 
                onValueChange={(value: any) => updateSubtitleSettings({ textAmountDisplay: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto (Smart)</SelectItem>
                  <SelectItem value="word-by-word">Word by Word</SelectItem>
                  <SelectItem value="line-by-line">Line by Line</SelectItem>
                  <SelectItem value="sentence">Full Sentence</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm">Background Transparency</Label>
              <Slider 
                value={[subtitleSettings.backgroundTransparency]} 
                onValueChange={([value]) => updateSubtitleSettings({ backgroundTransparency: value })}
                max={100} 
                step={5} 
                className="mt-2" 
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </GlassCard>

      {/* Customize Panel */}
      <GlassCard>
        <Collapsible open={customizeOpen} onOpenChange={setCustomizeOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-4">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4" />
                <span className="font-medium">Customize</span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${customizeOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="px-4 pb-4 space-y-4">
            <div>
              <Label className="text-sm">Font Family</Label>
              <Select 
                value={customizationSettings.fontFamily} 
                onValueChange={(value) => updateCustomizationSettings({ fontFamily: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fredoka">Fredoka</SelectItem>
                  <SelectItem value="arial">Arial</SelectItem>
                  <SelectItem value="helvetica">Helvetica</SelectItem>
                  <SelectItem value="roboto">Roboto</SelectItem>
                  <SelectItem value="opensans">Open Sans</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm">Font Variant</Label>
              <Select 
                value={customizationSettings.fontVariant} 
                onValueChange={(value) => updateCustomizationSettings({ fontVariant: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="regular">Regular</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="bold">Bold</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm">Font Size</Label>
              <Input 
                type="number" 
                value={customizationSettings.fontSize} 
                onChange={(e) => updateCustomizationSettings({ fontSize: parseInt(e.target.value) || 24 })}
                className="mt-1" 
              />
            </div>

            <div>
              <Label className="text-sm">Text Color</Label>
              <div className="flex gap-2 mt-2">
                <div 
                  className="w-8 h-8 rounded-full bg-white border-2 border-border cursor-pointer" 
                  onClick={() => updateCustomizationSettings({ textColor: '#ffffff' })}
                />
                <div 
                  className="w-8 h-8 rounded-full bg-black cursor-pointer" 
                  onClick={() => updateCustomizationSettings({ textColor: '#000000' })}
                />
                <div 
                  className="w-8 h-8 rounded-full bg-yellow-400 cursor-pointer" 
                  onClick={() => updateCustomizationSettings({ textColor: '#facc15' })}
                />
                <div 
                  className="w-8 h-8 rounded-full bg-red-500 cursor-pointer" 
                  onClick={() => updateCustomizationSettings({ textColor: '#ef4444' })}
                />
                <Button size="sm" variant="outline" className="h-8">Custom</Button>
              </div>
            </div>

            <div>
              <Label className="text-sm">Stroke Width</Label>
              <Slider 
                value={[customizationSettings.strokeWidth]} 
                onValueChange={([value]) => updateCustomizationSettings({ strokeWidth: value })}
                max={10} 
                step={1} 
                className="mt-2" 
              />
            </div>

            <div>
              <Label className="text-sm">Text Transformation</Label>
              <Select 
                value={customizationSettings.textTransformation} 
                onValueChange={(value: any) => updateCustomizationSettings({ textTransformation: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="uppercase">UPPERCASE</SelectItem>
                  <SelectItem value="lowercase">lowercase</SelectItem>
                  <SelectItem value="capitalize">Capitalize</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </GlassCard>

      {/* Export Panel */}
      <GlassCard>
        <Collapsible open={exportOpen} onOpenChange={setExportOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-4">
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                <span className="font-medium">Export</span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${exportOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="px-4 pb-4 space-y-4">
            <div>
              <Label className="text-sm">Compression</Label>
              <Slider 
                value={[exportSettings.compression]} 
                onValueChange={([value]) => updateExportSettings({ compression: value })}
                max={100} 
                step={5} 
                className="mt-2" 
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Fast</span>
                <span>High Quality</span>
              </div>
            </div>

            <div>
              <Label className="text-sm">Quality</Label>
              <Slider 
                value={[exportSettings.quality]} 
                onValueChange={([value]) => updateExportSettings({ quality: value })}
                max={100} 
                step={5} 
                className="mt-2" 
              />
            </div>

            <div>
              <Label className="text-sm">Resolution</Label>
              <Select 
                value={exportSettings.resolution} 
                onValueChange={(value) => updateExportSettings({ resolution: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4k">4K (3840x2160)</SelectItem>
                  <SelectItem value="1080p">1080p (1920x1080)</SelectItem>
                  <SelectItem value="720p">720p (1280x720)</SelectItem>
                  <SelectItem value="480p">480p (854x480)</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm">Frame Rate</Label>
              <Select 
                value={exportSettings.frameRate} 
                onValueChange={(value) => updateExportSettings({ frameRate: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24">24 fps</SelectItem>
                  <SelectItem value="30">30 fps</SelectItem>
                  <SelectItem value="60">60 fps</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <Button 
              className="w-full" 
              size="lg" 
              onClick={handleExport}
              disabled={!currentVideo || isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export Video
                </>
              )}
            </Button>
          </CollapsibleContent>
        </Collapsible>
      </GlassCard>
    </div>
  );
};