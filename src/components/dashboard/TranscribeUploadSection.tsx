import { useState } from "react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { getFileSizeLimit } from "@/components/Pricing";
import { TranscriptionSection } from "./TranscriptionSection";
import { Upload, FileVideo } from "lucide-react";
import { Input } from "@/components/ui/input";

export const TranscribeUploadSection = () => {
  const { user, tokenBalance } = useAuth();
  const { toast } = useToast();
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<File | null>(null);
  const [transcriptionResult, setTranscriptionResult] = useState<string>("");
  const [pendingVideoJob, setPendingVideoJob] = useState<any>(null);

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
        description: "Please upload a video file for transcription.",
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
        description: `${file.name} is ready for transcription. Click "Process with AI" to start.`,
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

    try {
      const fileSizeMB = currentVideo.size / (1024 * 1024);
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('subscription_plan, subscription_status, token_balance')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      const isSubscriber = profile?.subscription_status === 'active';
      let tokensRequired = fileSizeMB / 10;
      
      if (isSubscriber) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const { data: recentJobs, error: jobsError } = await supabase
          .from('video_jobs')
          .select('file_size_mb')
          .eq('user_id', user.id)
          .gte('created_at', thirtyDaysAgo.toISOString())
          .eq('status', 'completed');
        
        if (!jobsError && recentJobs) {
          const totalProcessedMB = recentJobs.reduce((sum, job) => sum + (job.file_size_mb || 0), 0);
          const freeAllowanceMB = 3 * 10;
          
          if (totalProcessedMB + fileSizeMB <= freeAllowanceMB) {
            tokensRequired = 0;
          } else if (totalProcessedMB < freeAllowanceMB) {
            const exceededMB = (totalProcessedMB + fileSizeMB) - freeAllowanceMB;
            tokensRequired = exceededMB / 10;
          }
        }
      }

      if (tokenBalance < tokensRequired) {
        toast({
          title: "Insufficient tokens",
          description: `You need ${tokensRequired.toFixed(1)} tokens but only have ${tokenBalance}. Please purchase more tokens.`,
          variant: "destructive",
        });
        return;
      }

      console.log('=== FRONTEND PROCESSING START ===');
      console.log('File details:', {
        name: currentVideo.name,
        size: currentVideo.size,
        type: currentVideo.type,
        lastModified: currentVideo.lastModified,
        fileSizeMB: fileSizeMB
      });

      if (currentVideo.size > 100 * 1024 * 1024) {
        throw new Error('File too large for processing. Maximum size is 100MB.');
      }

      setUploadProgress(10);

      console.log('Starting file conversion to base64...');
      const arrayBuffer = await currentVideo.arrayBuffer();
      console.log('ArrayBuffer created, size:', arrayBuffer.byteLength);
      
      const uint8Array = new Uint8Array(arrayBuffer);
      console.log('Uint8Array created, length:', uint8Array.length);
      
      // Convert to base64 more reliably
      const chunkSize = 32768; // 32KB chunks
      let base64 = '';
      
      console.log('Converting to base64 in chunks of', chunkSize);
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.subarray(i, i + chunkSize);
        const chunkString = String.fromCharCode.apply(null, Array.from(chunk));
        const chunkBase64 = btoa(chunkString);
        base64 += chunkBase64;
        
        if (i % (chunkSize * 10) === 0) {
          console.log(`Progress: ${Math.round((i / uint8Array.length) * 100)}%`);
        }
      }
      
      console.log('Base64 conversion complete:', {
        originalSize: uint8Array.length,
        base64Length: base64.length,
        base64Preview: base64.substring(0, 100) + '...',
        base64Suffix: '...' + base64.substring(base64.length - 100)
      });

      setUploadProgress(30);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Authentication failed');

      console.log('=== SENDING REQUEST TO EDGE FUNCTION ===');
      const requestPayload = {
        videoData: base64,
        videoSize: currentVideo.size,
        videoJobId: pendingVideoJob.id,
        primaryLanguage: autoDetect ? null : primaryLanguage,
        detectLanguages: autoDetect ? [] : detectLanguages,
        autoDetect: autoDetect,
        uploadMode: 'transcribe'
      };
      
      console.log('Request payload summary:', {
        hasVideoData: !!requestPayload.videoData,
        videoDataLength: requestPayload.videoData?.length,
        videoSize: requestPayload.videoSize,
        videoJobId: requestPayload.videoJobId,
        primaryLanguage: requestPayload.primaryLanguage,
        detectLanguagesCount: requestPayload.detectLanguages?.length,
        autoDetect: requestPayload.autoDetect,
        uploadMode: requestPayload.uploadMode
      });

      const { data, error } = await supabase.functions.invoke('generate-subtitles', {
        body: requestPayload,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      
      console.log('Edge function response:', { data, error });
      
      if (error) {
        console.error('=== EDGE FUNCTION ERROR ===');
        console.error('Error object:', error);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        throw error;
      }

      setUploadProgress(100);
      setTranscriptionResult(data?.transcription || "Transcription completed successfully!");
      setPendingVideoJob(null);
      
      toast({
        title: "Transcription complete!",
        description: `Successfully transcribed ${currentVideo.name}. ${tokensRequired > 0 ? `Used ${tokensRequired.toFixed(1)} tokens.` : 'Processed using your subscriber allowance.'}`,
      });

    } catch (error: any) {
      console.error('Processing error:', error);
      toast({
        title: "Processing failed",
        description: error.message || "Failed to process the file. Please try again.",
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
                  Supported: MP4, MOV, AVI • Cost: 1 token per 10MB
                </p>
              </>
            ) : (
              <div className="space-y-4">
                <div className="mx-auto w-12 h-12 md:w-16 md:h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <FileVideo className="h-6 w-6 md:h-8 md:w-8 text-green-600" />
                </div>
                <div>
                  <h3 className="font-fredoka text-lg md:text-xl font-semibold break-words px-4 text-foreground">{currentVideo.name}</h3>
                  <p className="text-muted-foreground text-sm md:text-base font-fredoka">
                    {Math.round(currentVideo.size / (1024 * 1024))}MB • 
                    Cost: {((currentVideo.size / (1024 * 1024)) / 10).toFixed(1)} tokens
                  </p>
                </div>
                
                {isProcessing && (
                  <div className="flex flex-col items-center space-y-3 px-4">
                    <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <p className="text-sm text-muted-foreground font-fredoka">
                      Transcribing video with AI...
                    </p>
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
                    onClick={() => {
                      setCurrentVideo(null);
                      setTranscriptionResult("");
                      setUploadProgress(0);
                    }}
                    disabled={isProcessing}
                    className="min-h-[44px] touch-manipulation font-fredoka"
                  >
                    Upload Different File
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
          <h3 className="font-fredoka text-lg font-semibold mb-4 text-foreground">Transcription Result</h3>
          <div className="bg-muted/50 p-4 rounded-lg">
            <pre className="whitespace-pre-wrap text-sm">{transcriptionResult}</pre>
          </div>
        </GlassCard>
      )}
    </div>
  );
};