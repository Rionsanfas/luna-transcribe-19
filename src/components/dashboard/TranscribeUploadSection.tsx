import { useState } from "react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { getFileSizeLimit } from "@/components/Pricing";
import { TranscriptionSection } from "./TranscriptionSection";
import { Upload, FileVideo, CheckCircle, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

export const TranscribeUploadSection = () => {
  const { user, tokenBalance, refreshTokenBalance } = useAuth();
  const { toast } = useToast();
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<File | null>(null);
  const [transcriptionResult, setTranscriptionResult] = useState<string>("");
  const [pendingVideoJob, setPendingVideoJob] = useState<any>(null);
  const [processingStage, setProcessingStage] = useState<string>("");

  // Transcription settings
  const [primaryLanguage, setPrimaryLanguage] = useState("en");
  const [detectLanguages, setDetectLanguages] = useState<string[]>([]);
  const [autoDetect, setAutoDetect] = useState(true);

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
      handleVideoUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleVideoUpload(file);
    }
  };

  const handleVideoUpload = async (file: File) => {
    if (!file.type.startsWith('video/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a video file (MP4, MOV, AVI, etc.)",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to process videos.",
        variant: "destructive",
      });
      return;
    }

    const fileSizeMB = file.size / (1024 * 1024);

    // Check file size limits
    if (fileSizeMB > 100) {
      toast({
        title: "File too large",
        description: "Maximum file size is 100MB for processing.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('subscription_plan, subscription_status, token_balance')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      const userPlan = profile?.subscription_plan || 'free';
      const maxFileSizeMB = getFileSizeLimit(userPlan);
      
      if (fileSizeMB > maxFileSizeMB) {
        toast({
          title: "File too large",
          description: `Maximum file size for your plan is ${maxFileSizeMB}MB. Current file is ${Math.round(fileSizeMB)}MB.`,
          variant: "destructive",
        });
        return;
      }

      setCurrentVideo(file);

      // Create video job record
      const { data: videoJob, error: jobError } = await supabase
        .from('video_jobs')
        .insert({
          user_id: user.id,
          original_filename: file.name,
          file_size_mb: Math.round(fileSizeMB),
          processing_type: 'transcription',
          status: 'pending',
          target_language: autoDetect ? 'auto' : primaryLanguage
        })
        .select()
        .single();

      if (jobError) throw jobError;

      setPendingVideoJob(videoJob);
      
      toast({
        title: "Video uploaded successfully!",
        description: `${file.name} is ready for transcription.`,
      });

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload the file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleProcessWithAI = async () => {
    if (!currentVideo || !pendingVideoJob || !user) return;

    setIsProcessing(true);
    setUploadProgress(0);
    setProcessingStage("Initializing...");

    try {
      const fileSizeMB = currentVideo.size / (1024 * 1024);
      
      // Check token balance
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('token_balance')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      const tokensRequired = Math.ceil(fileSizeMB / 10);
      
      if ((profile?.token_balance || 0) < tokensRequired) {
        toast({
          title: "Insufficient tokens",
          description: `You need ${tokensRequired} tokens but only have ${profile?.token_balance || 0}. Please purchase more tokens.`,
          variant: "destructive",
        });
        return;
      }

      setProcessingStage("Preparing video...");
      setUploadProgress(10);

      console.log('Starting video processing:', {
        fileName: currentVideo.name,
        fileSizeMB: fileSizeMB,
        tokensRequired: tokensRequired
      });

      // Convert video to base64
      const arrayBuffer = await currentVideo.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Convert to base64 in chunks
      const chunkSize = 32768;
      let base64 = '';
      
      setProcessingStage("Converting video format...");
      
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.subarray(i, i + chunkSize);
        const chunkString = String.fromCharCode.apply(null, Array.from(chunk));
        const chunkBase64 = btoa(chunkString);
        base64 += chunkBase64;
        
        // Update progress
        const progress = 10 + (i / uint8Array.length) * 20;
        setUploadProgress(progress);
      }

      setProcessingStage("Sending to AI service...");
      setUploadProgress(30);

      // Get auth session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Authentication failed');

      // Prepare request payload
      const requestPayload = {
        videoData: base64,
        videoSize: currentVideo.size,
        videoJobId: pendingVideoJob.id,
        primaryLanguage: autoDetect ? null : primaryLanguage,
        autoDetect: autoDetect,
        customPrompt: ""
      };

      console.log('Sending to edge function:', {
        videoDataLength: base64.length,
        videoSize: currentVideo.size,
        videoJobId: pendingVideoJob.id
      });

      setProcessingStage("AI is transcribing your video...");
      setUploadProgress(50);

      // Call edge function
      const { data, error } = await supabase.functions.invoke('generate-subtitles', {
        body: requestPayload,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      
      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Processing failed on server');
      }

      setUploadProgress(90);
      setProcessingStage("Finalizing...");

      // Deduct tokens
      const { error: tokenError } = await supabase
        .from('token_transactions')
        .insert({
          user_id: user.id,
          video_job_id: pendingVideoJob.id,
          amount: -tokensRequired,
          transaction_type: 'usage',
          description: `Transcription of ${currentVideo.name}`
        });

      if (tokenError) {
        console.error('Token deduction error:', tokenError);
      }

      // Update user's token balance
      await supabase
        .from('profiles')
        .update({ 
          token_balance: (profile?.token_balance || 0) - tokensRequired 
        })
        .eq('user_id', user.id);

      setUploadProgress(100);
      setProcessingStage("Complete!");
      setTranscriptionResult(data?.transcription || "Transcription completed successfully!");
      setPendingVideoJob(null);
      
      // Refresh token balance in context
      await refreshTokenBalance();
      
      toast({
        title: "Transcription complete!",
        description: `Successfully transcribed ${currentVideo.name}. Used ${tokensRequired} tokens.`,
      });

    } catch (error: any) {
      console.error('Processing error:', error);
      setProcessingStage("Failed");
      toast({
        title: "Processing failed",
        description: error.message || "Failed to process the file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setTimeout(() => {
        setUploadProgress(0);
        setProcessingStage("");
      }, 2000);
    }
  };

  const resetUpload = () => {
    setCurrentVideo(null);
    setTranscriptionResult("");
    setUploadProgress(0);
    setPendingVideoJob(null);
    setProcessingStage("");
  };

  return (
    <div className="space-y-6">
      <GlassCard className="p-4 md:p-6">
        <h2 className="font-fredoka text-lg md:text-xl font-semibold mb-4 text-foreground">
          Transcribe Video
        </h2>
        
        {/* Transcription Settings */}
        <TranscriptionSection
          isActive={true}
          primaryLanguage={primaryLanguage}
          onPrimaryLanguageChange={setPrimaryLanguage}
          detectLanguages={detectLanguages}
          onDetectLanguagesChange={setDetectLanguages}
          autoDetect={autoDetect}
          onAutoDetectChange={setAutoDetect}
        />
      </GlassCard>

      {/* Upload Section */}
      <GlassCard className="p-4 md:p-6">
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
          <div className="p-6 md:p-12 text-center space-y-4">
            {!currentVideo ? (
              <>
                <div className="mx-auto w-12 h-12 md:w-16 md:h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Upload className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-fredoka text-lg md:text-xl font-semibold text-foreground">Upload your video</h3>
                  <p className="text-muted-foreground font-fredoka text-sm md:text-base mt-2">
                    Drag and drop your video file here, or click to browse
                  </p>
                </div>
                <div>
                  <Input
                    type="file"
                    accept="video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="transcribe-file-upload"
                  />
                  <Button asChild className="font-medium min-h-[48px] px-6 md:px-8 touch-manipulation font-fredoka">
                    <label htmlFor="transcribe-file-upload" className="cursor-pointer">
                      <Upload className="mr-2 h-4 w-4" />
                      Choose Video File
                    </label>
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground px-4 leading-relaxed font-fredoka">
                  Supported: MP4, MOV, AVI • Max: 100MB • Cost: 1 token per 10MB
                </p>
              </>
            ) : (
              <div className="space-y-4">
                <div className={`mx-auto w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center ${
                  transcriptionResult ? 'bg-green-100 dark:bg-green-900' : 'bg-blue-100 dark:bg-blue-900'
                }`}>
                  {transcriptionResult ? (
                    <CheckCircle className="h-6 w-6 md:h-8 md:w-8 text-green-600" />
                  ) : (
                    <FileVideo className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
                  )}
                </div>
                <div>
                  <h3 className="font-fredoka text-lg md:text-xl font-semibold break-words px-4 text-foreground">
                    {currentVideo.name}
                  </h3>
                  <p className="text-muted-foreground text-sm md:text-base font-fredoka">
                    {Math.round(currentVideo.size / (1024 * 1024))}MB • 
                    Cost: {Math.ceil((currentVideo.size / (1024 * 1024)) / 10)} tokens
                  </p>
                </div>
                
                {isProcessing && (
                  <div className="space-y-3 px-4">
                    <Progress value={uploadProgress} className="w-full" />
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                      <p className="text-sm text-muted-foreground font-fredoka">
                        {processingStage}
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2">
                  {!isProcessing && !transcriptionResult && (
                    <Button 
                      onClick={handleProcessWithAI}
                      className="min-h-[44px] touch-manipulation font-fredoka"
                    >
                      Process with AI
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={resetUpload}
                    disabled={isProcessing}
                    className="min-h-[44px] touch-manipulation font-fredoka"
                  >
                    {transcriptionResult ? "Process Another Video" : "Upload Different File"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Results */}
      {transcriptionResult && (
        <GlassCard className="p-4 md:p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <h3 className="font-fredoka text-lg font-semibold text-foreground">Transcription Complete</h3>
          </div>
          <div className="bg-muted/50 p-4 rounded-lg border">
            <pre className="whitespace-pre-wrap text-sm font-mono">{transcriptionResult}</pre>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            <p>✓ Subtitles have been generated and saved to your account</p>
            <p>✓ You can now view and edit them in the video workspace</p>
          </div>
        </GlassCard>
      )}
    </div>
  );
};