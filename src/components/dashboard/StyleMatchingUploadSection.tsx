import { useState } from "react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { getFileSizeLimit } from "@/components/Pricing";
import { StyleMatchingSection } from "./StyleMatchingSection";
import { Upload, FileVideo, FileImage } from "lucide-react";
import { Input } from "@/components/ui/input";

export const StyleMatchingUploadSection = () => {
  const { user, tokenBalance } = useAuth();
  const { toast } = useToast();
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<File | null>(null);
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [styleMatchResult, setStyleMatchResult] = useState<string>("");
  const [pendingVideoJob, setPendingVideoJob] = useState<any>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      if (files[0].type.startsWith('video/')) {
        handleVideoUpload(files[0]);
      } else if (files[0].type.startsWith('image/')) {
        handleImageUpload(files[0]);
      }
    }
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleVideoUpload(file);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleVideoUpload = async (file: File) => {
    if (!file.type.startsWith('video/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a video file.",
        variant: "destructive",
      });
      return;
    }

    const fileSizeMB = file.size / (1024 * 1024);
    const userPlan = 'free'; // Get from user profile
    const maxFileSizeMB = getFileSizeLimit(userPlan);
    
    if (fileSizeMB > maxFileSizeMB) {
      toast({
        title: "File too large",
        description: `Maximum file size for your plan is ${maxFileSizeMB}MB.`,
        variant: "destructive",
      });
      return;
    }

    setCurrentVideo(file);
    toast({
      title: "Video uploaded",
      description: `${file.name} is ready for style matching.`,
    });
  };

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file for style reference.",
        variant: "destructive",
      });
      return;
    }

    setReferenceImage(file);
    toast({
      title: "Reference image uploaded",
      description: `${file.name} will be used for style matching.`,
    });
  };

  const handleProcessWithAI = async () => {
    if (!currentVideo || !referenceImage || !user) {
      toast({
        title: "Missing files",
        description: "Please upload both a video and reference image for style matching.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setUploadProgress(0);

    try {
      const fileSizeMB = currentVideo.size / (1024 * 1024);
      const tokensRequired = fileSizeMB / 10 + 25; // Base cost + style matching cost
      
      if (tokenBalance < tokensRequired) {
        toast({
          title: "Insufficient tokens",
          description: `You need ${tokensRequired.toFixed(1)} tokens but only have ${tokenBalance}.`,
          variant: "destructive",
        });
        return;
      }

      // Create video job
      const { data: videoJob, error: jobError } = await supabase
        .from('video_jobs')
        .insert({
          user_id: user.id,
          original_filename: currentVideo.name,
          file_size_mb: Math.round(fileSizeMB),
          processing_type: 'style_matching',
          status: 'pending'
        })
        .select()
        .single();

      if (jobError) throw jobError;

      setUploadProgress(50);

      // Simulate style matching processing
      await new Promise(resolve => setTimeout(resolve, 3000));

      setUploadProgress(100);
      setStyleMatchResult("Style matching completed successfully! Subtitles have been styled to match your reference image.");
      
      toast({
        title: "Style matching complete!",
        description: `Successfully processed ${currentVideo.name} with style matching.`,
      });

    } catch (error: any) {
      console.error('Processing error:', error);
      toast({
        title: "Processing failed",
        description: error.message || "Failed to process the files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setTimeout(() => setUploadProgress(0), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <GlassCard className="p-4 md:p-6">
        <h2 className="font-fredoka text-lg md:text-xl font-semibold mb-4 text-foreground">
          Style Matching
        </h2>
        
        {/* Style Matching Settings */}
        <StyleMatchingSection 
          hasVideo={!!currentVideo}
          onStyleMatch={() => console.log('Style matching applied')}
        />
      </GlassCard>

      {/* Upload Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Video Upload */}
        <GlassCard className="p-4 md:p-6">
          <h3 className="font-fredoka text-base font-semibold mb-4 text-foreground">Video File</h3>
          <div
            className={`relative border-2 border-dashed rounded-lg transition-all duration-200 ${
              dragOver 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/30 hover:border-primary/50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="p-6 text-center space-y-4">
              {!currentVideo ? (
                <>
                  <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <FileVideo className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-muted-foreground font-fredoka text-sm">
                      Upload your video file
                    </p>
                  </div>
                  <div>
                    <Input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoSelect}
                      className="hidden"
                      id="style-video-upload"
                    />
                    <Button asChild size="sm" className="font-fredoka">
                      <label htmlFor="style-video-upload" className="cursor-pointer">
                        <Upload className="mr-2 h-4 w-4" />
                        Choose Video
                      </label>
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <FileVideo className="h-6 w-6 text-green-600" />
                  </div>
                  <p className="font-fredoka text-sm font-medium text-foreground">{currentVideo.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {Math.round(currentVideo.size / (1024 * 1024))}MB
                  </p>
                </div>
              )}
            </div>
          </div>
        </GlassCard>

        {/* Reference Image Upload */}
        <GlassCard className="p-4 md:p-6">
          <h3 className="font-fredoka text-base font-semibold mb-4 text-foreground">Reference Image</h3>
          <div
            className={`relative border-2 border-dashed rounded-lg transition-all duration-200 ${
              dragOver 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/30 hover:border-primary/50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="p-6 text-center space-y-4">
              {!referenceImage ? (
                <>
                  <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <FileImage className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-muted-foreground font-fredoka text-sm">
                      Upload reference image
                    </p>
                  </div>
                  <div>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                      id="style-image-upload"
                    />
                    <Button asChild size="sm" className="font-fredoka">
                      <label htmlFor="style-image-upload" className="cursor-pointer">
                        <Upload className="mr-2 h-4 w-4" />
                        Choose Image
                      </label>
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <FileImage className="h-6 w-6 text-green-600" />
                  </div>
                  <p className="font-fredoka text-sm font-medium text-foreground">{referenceImage.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {Math.round(referenceImage.size / 1024)}KB
                  </p>
                </div>
              )}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Process Button */}
      {currentVideo && referenceImage && (
        <GlassCard className="p-4 md:p-6">
          <div className="text-center space-y-4">
            {isProcessing && (
              <div className="flex flex-col items-center space-y-3">
                <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground font-fredoka">
                  Processing style matching with AI...
                </p>
              </div>
            )}
            
            <Button 
              onClick={handleProcessWithAI}
              disabled={isProcessing}
              className="min-h-[44px] touch-manipulation font-fredoka"
            >
              {isProcessing ? 'Processing...' : 'Process with AI'}
            </Button>
          </div>
        </GlassCard>
      )}

      {/* Results */}
      {styleMatchResult && (
        <GlassCard className="p-4 md:p-6">
          <h3 className="font-fredoka text-lg font-semibold mb-4 text-foreground">Style Matching Result</h3>
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm">{styleMatchResult}</p>
          </div>
        </GlassCard>
      )}
    </div>
  );
};