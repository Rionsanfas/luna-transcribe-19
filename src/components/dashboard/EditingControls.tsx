import { useState } from "react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { useVideoEditing } from "@/contexts/VideoEditingContext";
import { AVAILABLE_FONTS, getFontsByCategory } from "./fonts";
import {
  ChevronDown,
  ChevronRight,
  Palette,
  Type,
  Move,
  Settings,
  Crop,
  Download,
  Eye,
  Layers
} from "lucide-react";

export const EditingControls = () => {
  const {
    subtitleSettings,
    customizationSettings,
    cropSettings,
    exportSettings,
    updateSubtitleSettings,
    updateCustomizationSettings,
    updateCropSettings,
    updateExportSettings,
  } = useVideoEditing();

  const [openSections, setOpenSections] = useState({
    appearance: true,
    positioning: true,
    effects: true,
    cropping: false,
    export: false,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const fontCategories = ['sans-serif', 'serif', 'display', 'handwriting', 'monospace'];

  return (
    <div className="w-80 space-y-4 h-[800px] overflow-hidden">
      <ScrollArea className="h-full">
        <div className="space-y-4 p-1">
          {/* Appearance Settings */}
          <GlassCard>
            <Collapsible open={openSections.appearance} onOpenChange={() => toggleSection('appearance')}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-4 hover:bg-transparent">
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    <span className="font-medium">Appearance</span>
                  </div>
                  {openSections.appearance ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 pb-4 space-y-4">
                  {/* Font Family */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Font Family</Label>
                    <Select
                      value={customizationSettings.fontFamily}
                      onValueChange={(value) => updateCustomizationSettings({ fontFamily: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {fontCategories.map(category => (
                          <div key={category}>
                            <div className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase">
                              {category.replace('-', ' ')}
                            </div>
                            {getFontsByCategory(category).map(font => (
                              <SelectItem key={font.id} value={font.family}>
                                <div className="flex items-center gap-2">
                                  <span>{font.name}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {font.source}
                                  </Badge>
                                </div>
                              </SelectItem>
                            ))}
                          </div>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Font Variant */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Font Weight</Label>
                    <Select
                      value={customizationSettings.fontVariant}
                      onValueChange={(value) => updateCustomizationSettings({ fontVariant: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="300">Light (300)</SelectItem>
                        <SelectItem value="400">Regular (400)</SelectItem>
                        <SelectItem value="500">Medium (500)</SelectItem>
                        <SelectItem value="600">Semi Bold (600)</SelectItem>
                        <SelectItem value="700">Bold (700)</SelectItem>
                        <SelectItem value="800">Extra Bold (800)</SelectItem>
                        <SelectItem value="900">Black (900)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Font Size */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center justify-between">
                      Font Size
                      <span className="text-xs text-muted-foreground">{customizationSettings.fontSize}px</span>
                    </Label>
                    <Slider
                      value={[customizationSettings.fontSize]}
                      onValueChange={([value]) => updateCustomizationSettings({ fontSize: value })}
                      min={12}
                      max={72}
                      step={1}
                    />
                  </div>

                  {/* Text Color */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Text Color</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={customizationSettings.textColor}
                        onChange={(e) => updateCustomizationSettings({ textColor: e.target.value })}
                        className="w-12 h-8 p-1 border-0"
                      />
                      <Input
                        value={customizationSettings.textColor}
                        onChange={(e) => updateCustomizationSettings({ textColor: e.target.value })}
                        className="flex-1 text-sm"
                      />
                    </div>
                  </div>

                  {/* Text Transform */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Text Transform</Label>
                    <Select
                      value={customizationSettings.textTransformation}
                      onValueChange={(value: any) => updateCustomizationSettings({ textTransformation: value })}
                    >
                      <SelectTrigger>
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

                  {/* Stroke Width */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center justify-between">
                      Stroke Width
                      <span className="text-xs text-muted-foreground">{customizationSettings.strokeWidth}px</span>
                    </Label>
                    <Slider
                      value={[customizationSettings.strokeWidth]}
                      onValueChange={([value]) => updateCustomizationSettings({ strokeWidth: value })}
                      min={0}
                      max={10}
                      step={1}
                    />
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </GlassCard>

          {/* Position Settings */}
          <GlassCard>
            <Collapsible open={openSections.positioning} onOpenChange={() => toggleSection('positioning')}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-4 hover:bg-transparent">
                  <div className="flex items-center gap-2">
                    <Move className="w-4 h-4" />
                    <span className="font-medium">Positioning</span>
                  </div>
                  {openSections.positioning ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 pb-4 space-y-4">
                  {/* Position Offset */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center justify-between">
                      Bottom Offset
                      <span className="text-xs text-muted-foreground">{subtitleSettings.positionOffset}px</span>
                    </Label>
                    <Slider
                      value={[subtitleSettings.positionOffset]}
                      onValueChange={([value]) => updateSubtitleSettings({ positionOffset: value })}
                      min={0}
                      max={200}
                      step={5}
                    />
                  </div>

                  {/* Max Width */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center justify-between">
                      Max Width
                      <span className="text-xs text-muted-foreground">{subtitleSettings.maxWidth}%</span>
                    </Label>
                    <Slider
                      value={[subtitleSettings.maxWidth]}
                      onValueChange={([value]) => updateSubtitleSettings({ maxWidth: value })}
                      min={30}
                      max={100}
                      step={5}
                    />
                  </div>

                  {/* Line Height */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center justify-between">
                      Line Height
                      <span className="text-xs text-muted-foreground">{subtitleSettings.lineHeight}%</span>
                    </Label>
                    <Slider
                      value={[subtitleSettings.lineHeight]}
                      onValueChange={([value]) => updateSubtitleSettings({ lineHeight: value })}
                      min={80}
                      max={200}
                      step={5}
                    />
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </GlassCard>

          {/* Effects Settings */}
          <GlassCard>
            <Collapsible open={openSections.effects} onOpenChange={() => toggleSection('effects')}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-4 hover:bg-transparent">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    <span className="font-medium">Effects</span>
                  </div>
                  {openSections.effects ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 pb-4 space-y-4">
                  {/* Background */}
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Background</Label>
                    <Switch
                      checked={subtitleSettings.background}
                      onCheckedChange={(checked) => updateSubtitleSettings({ background: checked })}
                    />
                  </div>

                  {/* Background Transparency */}
                  {subtitleSettings.background && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center justify-between">
                        Background Opacity
                        <span className="text-xs text-muted-foreground">{subtitleSettings.backgroundTransparency}%</span>
                      </Label>
                      <Slider
                        value={[subtitleSettings.backgroundTransparency]}
                        onValueChange={([value]) => updateSubtitleSettings({ backgroundTransparency: value })}
                        min={0}
                        max={100}
                        step={5}
                      />
                    </div>
                  )}

                  {/* Text Shadow */}
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Text Shadow</Label>
                    <Switch
                      checked={subtitleSettings.textShadow}
                      onCheckedChange={(checked) => updateSubtitleSettings({ textShadow: checked })}
                    />
                  </div>

                  {/* Animations */}
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Animations</Label>
                    <Switch
                      checked={subtitleSettings.animations}
                      onCheckedChange={(checked) => updateSubtitleSettings({ animations: checked })}
                    />
                  </div>

                  {/* Active Word Highlight */}
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Word Highlight</Label>
                    <Switch
                      checked={subtitleSettings.activeWordHighlight}
                      onCheckedChange={(checked) => updateSubtitleSettings({ activeWordHighlight: checked })}
                    />
                  </div>

                  {/* Text Amount Display */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Display Mode</Label>
                    <Select
                      value={subtitleSettings.textAmountDisplay}
                      onValueChange={(value: any) => updateSubtitleSettings({ textAmountDisplay: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Auto</SelectItem>
                        <SelectItem value="word-by-word">Word by Word</SelectItem>
                        <SelectItem value="line-by-line">Line by Line</SelectItem>
                        <SelectItem value="sentence">Sentence</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </GlassCard>

          {/* Cropping Settings */}
          <GlassCard>
            <Collapsible open={openSections.cropping} onOpenChange={() => toggleSection('cropping')}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-4 hover:bg-transparent">
                  <div className="flex items-center gap-2">
                    <Crop className="w-4 h-4" />
                    <span className="font-medium">Cropping</span>
                  </div>
                  {openSections.cropping ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 pb-4 space-y-4">
                  {/* Aspect Ratio */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Aspect Ratio</Label>
                    <Select
                      value={cropSettings.aspectRatio}
                      onValueChange={(value) => updateCropSettings({ aspectRatio: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="16:9">16:9 (Widescreen)</SelectItem>
                        <SelectItem value="9:16">9:16 (Vertical)</SelectItem>
                        <SelectItem value="1:1">1:1 (Square)</SelectItem>
                        <SelectItem value="4:3">4:3 (Traditional)</SelectItem>
                        <SelectItem value="21:9">21:9 (Ultrawide)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Horizontal Offset */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center justify-between">
                      Horizontal Offset
                      <span className="text-xs text-muted-foreground">{cropSettings.horizontalOffset}%</span>
                    </Label>
                    <Slider
                      value={[cropSettings.horizontalOffset]}
                      onValueChange={([value]) => updateCropSettings({ horizontalOffset: value })}
                      min={-50}
                      max={50}
                      step={1}
                    />
                  </div>

                  {/* Vertical Offset */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center justify-between">
                      Vertical Offset
                      <span className="text-xs text-muted-foreground">{cropSettings.verticalOffset}%</span>
                    </Label>
                    <Slider
                      value={[cropSettings.verticalOffset]}
                      onValueChange={([value]) => updateCropSettings({ verticalOffset: value })}
                      min={-50}
                      max={50}
                      step={1}
                    />
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </GlassCard>

          {/* Export Settings */}
          <GlassCard>
            <Collapsible open={openSections.export} onOpenChange={() => toggleSection('export')}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-4 hover:bg-transparent">
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    <span className="font-medium">Export Settings</span>
                  </div>
                  {openSections.export ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 pb-4 space-y-4">
                  {/* Resolution */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Resolution</Label>
                    <Select
                      value={exportSettings.resolution}
                      onValueChange={(value) => updateExportSettings({ resolution: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="480p">480p (SD)</SelectItem>
                        <SelectItem value="720p">720p (HD)</SelectItem>
                        <SelectItem value="1080p">1080p (Full HD)</SelectItem>
                        <SelectItem value="1440p">1440p (2K)</SelectItem>
                        <SelectItem value="2160p">2160p (4K)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Frame Rate */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Frame Rate</Label>
                    <Select
                      value={exportSettings.frameRate}
                      onValueChange={(value) => updateExportSettings({ frameRate: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="24">24 FPS</SelectItem>
                        <SelectItem value="30">30 FPS</SelectItem>
                        <SelectItem value="60">60 FPS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Quality */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center justify-between">
                      Quality
                      <span className="text-xs text-muted-foreground">{exportSettings.quality}%</span>
                    </Label>
                    <Slider
                      value={[exportSettings.quality]}
                      onValueChange={([value]) => updateExportSettings({ quality: value })}
                      min={50}
                      max={100}
                      step={5}
                    />
                  </div>

                  {/* Compression */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center justify-between">
                      Compression
                      <span className="text-xs text-muted-foreground">{exportSettings.compression}%</span>
                    </Label>
                    <Slider
                      value={[exportSettings.compression]}
                      onValueChange={([value]) => updateExportSettings({ compression: value })}
                      min={10}
                      max={100}
                      step={5}
                    />
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </GlassCard>
        </div>
      </ScrollArea>
    </div>
  );
};