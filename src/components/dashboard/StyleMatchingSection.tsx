import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { useVideoEditing } from "@/contexts/VideoEditingContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Upload,
  Image as ImageIcon,
  Zap,
  X,
  Eye,
  Palette,
  Type,
  Move,
  Layers,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface MatchedStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  textColor: string;
  backgroundColor: string;
  backgroundOpacity: number;
  hasBackground: boolean;
  textShadow: boolean;
  position: 'bottom' | 'top' | 'center';
  positionOffset: number;
  maxWidth: number;
  lineHeight: number;
  textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  borderRadius: number;
  strokeWidth: number;
  animations: boolean;
  confidence: number;
}

interface StyleMatchingSectionProps {
  hasVideo: boolean;
  onStyleMatch: (matchedStyle: MatchedStyle) => void;
}

export const StyleMatchingSection = ({ hasVideo, onStyleMatch }: StyleMatchingSectionProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<MatchedStyle | null>(null);
  const [customPrompt, setCustomPrompt] = useState("Analyze the subtitle styling in this image and extract all visual properties including colors, fonts, positioning, and effects.");
  const [autoApply, setAutoApply] = useState(true);
  const [dragOver, setDragOver] = useState(false);

  const {
    updateSubtitleSettings,
    updateCustomizationSettings,
    subtitleSettings,
    customizationSettings,
  } = useVideoEditing();

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file containing subtitles.",
        variant: "destructive",
      });
      return;
    }

    setUploadedImage(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    toast({
      title: "Image uploaded",
      description: "Ready to analyze subtitle styling.",
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const analyzeSubtitleStyle = async () => {
    if (!uploadedImage) return;

    setIsAnalyzing(true);
    try {
      // Convert image to base64
      const arrayBuffer = await uploadedImage.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      // Get authentication token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Authentication failed');

      // Call style analysis function
      const { data, error } = await supabase.functions.invoke('analyze-subtitle-style', {
        body: {
          imageData: base64,
          customPrompt: customPrompt,
          imageFormat: uploadedImage.type
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      const matchedStyle: MatchedStyle = {
        fontFamily: data.fontFamily || 'Inter',
        fontSize: data.fontSize || 24,
        fontWeight: data.fontWeight || '600',
        textColor: data.textColor || '#FFFFFF',
        backgroundColor: data.backgroundColor || '#000000',
        backgroundOpacity: data.backgroundOpacity || 80,
        hasBackground: data.hasBackground ?? true,
        textShadow: data.textShadow ?? true,
        position: data.position || 'bottom',
        positionOffset: data.positionOffset || 50,
        maxWidth: data.maxWidth || 80,
        lineHeight: data.lineHeight || 120,
        textTransform: data.textTransform || 'none',
        borderRadius: data.borderRadius || 8,
        strokeWidth: data.strokeWidth || 2,
        animations: data.animations ?? false,
        confidence: data.confidence || 0.8
      };

      setAnalysisResult(matchedStyle);
      
      if (autoApply) {
        applyMatchedStyle(matchedStyle);
      }

      onStyleMatch(matchedStyle);
      
      toast({
        title: "Style analysis complete!",
        description: `Detected subtitle styling with ${Math.round(matchedStyle.confidence * 100)}% confidence.`,
      });

    } catch (error: any) {
      console.error('Style analysis error:', error);
      toast({
        title: "Analysis failed",
        description: error.message || "Failed to analyze subtitle style. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const applyMatchedStyle = (style: MatchedStyle) => {
    // Apply customization settings
    updateCustomizationSettings({
      fontFamily: style.fontFamily,
      fontSize: style.fontSize,
      fontVariant: style.fontWeight,
      textColor: style.textColor,
      strokeWidth: style.strokeWidth,
      textTransformation: style.textTransform,
    });

    // Apply subtitle settings
    updateSubtitleSettings({
      positionOffset: style.positionOffset,
      maxWidth: style.maxWidth,
      lineHeight: style.lineHeight,
      background: style.hasBackground,
      backgroundTransparency: style.backgroundOpacity,
      textShadow: style.textShadow,
      animations: style.animations,
    });

    toast({
      title: "Style applied!",
      description: "All detected styling has been applied to your video.",
    });
  };

  const clearImage = () => {
    setUploadedImage(null);
    setImagePreview("");
    setAnalysisResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (!hasVideo) {
    return (
      <GlassCard className="p-4 md:p-6">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto" />
          <div>
            <h3 className="font-fredoka text-lg font-semibold text-foreground">
              Video Required
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Please upload and process a video first before using style matching
            </p>
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-4 md:p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-fredoka text-lg md:text-xl font-semibold text-foreground">
              Match Subtitle Style
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Upload an image containing subtitles to analyze and match their styling
            </p>
          </div>
          <Badge variant="secondary" className="hidden sm:flex">
            <Zap className="w-3 h-3 mr-1" />
            AI Powered
          </Badge>
        </div>

        {/* Upload Area */}
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
            dragOver
              ? 'border-primary bg-primary/5'
              : uploadedImage
              ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
              : 'border-muted-foreground/25 hover:border-primary/50'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            className="hidden"
          />

          {uploadedImage ? (
            <div className="space-y-4">
              <div className="relative inline-block">
                <img
                  src={imagePreview}
                  alt="Uploaded subtitle reference"
                  className="max-w-full max-h-40 rounded-lg shadow-lg"
                />
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={clearImage}
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
              <div className="text-sm">
                <p className="font-medium text-foreground">{uploadedImage.name}</p>
                <p className="text-muted-foreground">
                  {(uploadedImage.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto" />
              <div>
                <p className="text-lg font-medium text-foreground">
                  Drop an image here or <span className="text-primary">browse files</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  PNG, JPG, WEBP up to 10MB
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Analysis Settings */}
        {uploadedImage && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Analysis Instructions (Optional)</Label>
              <Textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Describe what specific styling elements to focus on..."
                className="min-h-[80px]"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  id="auto-apply"
                  checked={autoApply}
                  onCheckedChange={setAutoApply}
                />
                <Label htmlFor="auto-apply" className="text-sm">
                  Auto-apply detected styles
                </Label>
              </div>

              <Button
                onClick={analyzeSubtitleStyle}
                disabled={isAnalyzing}
                className="min-h-[44px] font-fredoka"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Analyze Style
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Analysis Results */}
        {analysisResult && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-foreground">Detected Styling</h4>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={analysisResult.confidence > 0.7 ? "default" : "secondary"}
                  className="text-xs"
                >
                  {Math.round(analysisResult.confidence * 100)}% confidence
                </Badge>
                {!autoApply && (
                  <Button
                    size="sm"
                    onClick={() => applyMatchedStyle(analysisResult)}
                    className="text-xs"
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Apply Style
                  </Button>
                )}
              </div>
            </div>

            <ScrollArea className="h-48">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {/* Typography */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Type className="w-3 h-3 text-primary" />
                    <span className="font-medium text-xs uppercase tracking-wide text-muted-foreground">Typography</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Font:</span>
                      <span className="font-medium">{analysisResult.fontFamily}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Size:</span>
                      <span className="font-medium">{analysisResult.fontSize}px</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Weight:</span>
                      <span className="font-medium">{analysisResult.fontWeight}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Transform:</span>
                      <span className="font-medium">{analysisResult.textTransform}</span>
                    </div>
                  </div>
                </div>

                {/* Colors */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Palette className="w-3 h-3 text-primary" />
                    <span className="font-medium text-xs uppercase tracking-wide text-muted-foreground">Colors</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between items-center">
                      <span>Text:</span>
                      <div className="flex items-center gap-1">
                        <div 
                          className="w-3 h-3 rounded-sm border"
                          style={{ backgroundColor: analysisResult.textColor }}
                        />
                        <span className="font-medium">{analysisResult.textColor}</span>
                      </div>
                    </div>
                    {analysisResult.hasBackground && (
                      <div className="flex justify-between items-center">
                        <span>Background:</span>
                        <div className="flex items-center gap-1">
                          <div 
                            className="w-3 h-3 rounded-sm border"
                            style={{ 
                              backgroundColor: analysisResult.backgroundColor,
                              opacity: analysisResult.backgroundOpacity / 100 
                            }}
                          />
                          <span className="font-medium">{analysisResult.backgroundColor}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Position */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Move className="w-3 h-3 text-primary" />
                    <span className="font-medium text-xs uppercase tracking-wide text-muted-foreground">Position</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Placement:</span>
                      <span className="font-medium">{analysisResult.position}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Offset:</span>
                      <span className="font-medium">{analysisResult.positionOffset}px</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Max Width:</span>
                      <span className="font-medium">{analysisResult.maxWidth}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Line Height:</span>
                      <span className="font-medium">{analysisResult.lineHeight}%</span>
                    </div>
                  </div>
                </div>

                {/* Effects */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Layers className="w-3 h-3 text-primary" />
                    <span className="font-medium text-xs uppercase tracking-wide text-muted-foreground">Effects</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Background:</span>
                      <span className="font-medium">
                        {analysisResult.hasBackground ? "Yes" : "No"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Text Shadow:</span>
                      <span className="font-medium">
                        {analysisResult.textShadow ? "Yes" : "No"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Stroke:</span>
                      <span className="font-medium">{analysisResult.strokeWidth}px</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Animations:</span>
                      <span className="font-medium">
                        {analysisResult.animations ? "Yes" : "No"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>

            {analysisResult.confidence < 0.7 && (
              <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg text-sm">
                <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">
                    Low confidence detection
                  </p>
                  <p className="text-yellow-700 dark:text-yellow-300">
                    Consider using a clearer image or adjusting the analysis instructions for better results.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </GlassCard>
  );
};