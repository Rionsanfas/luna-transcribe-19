import { useState } from "react";
import { useVideoEditing } from "@/contexts/VideoEditingContext";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  Video,
  Image,
  Clock,
  Play,
  FileVideo,
  Plus,
  Loader2
} from "lucide-react";

export const UploadSection = () => {
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { currentVideo, setCurrentVideo, isProcessing, generateSubtitles } = useVideoEditing();
  const { toast } = useToast();
  const { user, tokenBalance } = useAuth();

  const recentProjects = [
    { name: "Product Demo Video", duration: "2:34", lastEdited: "2 hours ago", thumbnail: "/placeholder.svg" },
    { name: "Tutorial - Getting Started", duration: "5:12", lastEdited: "1 day ago", thumbnail: "/placeholder.svg" },
    { name: "Marketing Campaign", duration: "1:45", lastEdited: "3 days ago", thumbnail: "/placeholder.svg" },
  ];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const videoFile = files.find(file => file.type.startsWith('video/'));
    
    if (videoFile) {
      handleVideoUpload(videoFile);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      handleVideoUpload(file);
    }
  };

  const handleVideoUpload = async (file: File) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to upload videos",
        variant: "destructive"
      });
      return;
    }

    // Check file type - only allow MP4 and MOV
    if (!file.type.includes('mp4') && !file.type.includes('quicktime')) {
      toast({
        title: "Invalid file type",
        description: "Please upload MP4 or MOV files only",
        variant: "destructive"
      });
      return;
    }

    // Check file size and calculate tokens needed
    const fileSizeInMB = file.size / (1024 * 1024);
    const tokensNeeded = Math.ceil(fileSizeInMB / 10); // 1 token = 10MB

    if (tokenBalance < tokensNeeded) {
      toast({
        title: "Insufficient tokens",
        description: `You need ${tokensNeeded} tokens but only have ${tokenBalance}. Please purchase more tokens.`,
        variant: "destructive"
      });
      return;
    }

    try {
      setCurrentVideo(file);
      setUploadProgress(10);

      // Create video job record
      const { data: videoJob, error: jobError } = await supabase
        .from('video_jobs')
        .insert({
          user_id: user.id,
          original_filename: file.name,
          file_size_mb: Math.round(fileSizeInMB),
          processing_type: 'subtitle_generation',
          status: 'pending'
        })
        .select()
        .single();

      if (jobError) throw jobError;

      setUploadProgress(30);

      // Convert file to base64 for processing
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64Data = reader.result?.toString().split(',')[1];
          
          setUploadProgress(50);

          // Call subtitle generation function
          const { data: { session } } = await supabase.auth.getSession();
          const { data, error } = await supabase.functions.invoke('generate-subtitles', {
            body: {
              videoData: base64Data,
              videoSize: file.size,
              videoJobId: videoJob.id
            },
            headers: {
              Authorization: `Bearer ${session?.access_token}`,
            },
          });

          if (error) throw error;

          setUploadProgress(100);

          toast({
            title: "Video processed successfully",
            description: `Generated ${data.subtitles} subtitle segments using ${data.tokensUsed} tokens`
          });

          // Reset progress after a short delay
          setTimeout(() => setUploadProgress(0), 2000);

        } catch (error) {
          console.error('Video processing error:', error);
          toast({
            title: "Processing failed",
            description: "There was an error processing your video",
            variant: "destructive"
          });
          setUploadProgress(0);
        }
      };

      reader.readAsDataURL(file);

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your video",
        variant: "destructive"
      });
      setUploadProgress(0);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Upload Video Section */}
      <div className="lg:col-span-2">
        <GlassCard
          className={`transition-all duration-300 ${
            dragOver ? 'border-primary bg-primary/5' : ''
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              {isProcessing ? (
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              ) : (
                <Upload className="w-8 h-8 text-primary" />
              )}
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {currentVideo ? currentVideo.name : "Upload Your Video"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {uploadProgress > 0 
                ? `Processing video... ${uploadProgress}%`
                : isProcessing 
                  ? "Processing video and generating subtitles..." 
                  : currentVideo 
                    ? "Video uploaded successfully. AI subtitles are being generated."
                    : "Drop your MP4 or MOV video files here, or click to browse"
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isProcessing}
                />
                <Button 
                  className="flex items-center gap-2" 
                  disabled={isProcessing || uploadProgress > 0}
                  type="button"
                >
                  <Video className="w-4 h-4" />
                  {currentVideo ? "Change Video" : "Choose Video File"}
                </Button>
              </label>
              <Button variant="outline" className="flex items-center gap-2">
                <Image className="w-4 h-4" />
                Style Reference (Optional)
              </Button>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              <Badge variant="secondary" className="text-xs">MP4</Badge>
              <Badge variant="secondary" className="text-xs">MOV</Badge>
              {tokenBalance && (
                <Badge variant="outline" className="text-xs">
                  {tokenBalance} tokens available
                </Badge>
              )}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Recent Projects */}
      <div>
        <GlassCard>
          <div className="p-4 border-b border-border/20">
            <h4 className="font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Recent Projects
            </h4>
          </div>
          <div className="p-4 space-y-3">
            {recentProjects.map((project, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <FileVideo className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{project.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{project.duration}</span>
                    <span>•</span>
                    <span>{project.lastEdited}</span>
                  </div>
                </div>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <Play className="w-3 h-3" />
                </Button>
              </div>
            ))}
            <Button variant="ghost" className="w-full justify-start h-10 mt-2">
              <Plus className="w-4 h-4 mr-2" />
              Create New Project
            </Button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};