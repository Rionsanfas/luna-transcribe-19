import { useState, useEffect } from "react";
import { Upload, Play, Download, FileText, Languages, Palette, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { TopNavigation } from "@/components/TopNavigation";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { user, session, tokenBalance, refreshTokenBalance } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [activeAction, setActiveAction] = useState<"translation" | "transcription" | "style-matching">("transcription");
  const [uploadedVideo, setUploadedVideo] = useState<File | null>(null);
  const [uploadedStyleImage, setUploadedStyleImage] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [jobStatus, setJobStatus] = useState<string>('');
  const [editedSubtitles, setEditedSubtitles] = useState<string>('');
  const [isReprocessing, setIsReprocessing] = useState(false);
  const [showSubtitleEditor, setShowSubtitleEditor] = useState(false);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file types based on active action
    if (activeAction === "style-matching") {
      const validImageTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/bmp'];
      if (!validImageTypes.includes(file.type)) {
        alert('Please upload a valid image file (PNG, JPG, WEBP, GIF, BMP)');
        return;
      }
      setUploadedStyleImage(file);
    } else {
      const validVideoTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
      if (!validVideoTypes.includes(file.type)) {
        alert('Please upload a valid video file (MP4, MOV)');
        return;
      }
      setUploadedVideo(file);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // Remove data:video/mp4;base64, prefix
      };
      reader.onerror = error => reject(error);
    });
  };

  const calculateTokensNeeded = (file: File | null) => {
    if (!file) return 0;
    const fileSizeMB = file.size / (1024 * 1024);
    return Math.ceil(fileSizeMB / 10 * 10) / 10; // Round to 1 decimal place
  };

  const handleSendToAI = async () => {
    if (!session || !user) {
      toast({
        title: "Authentication required",
        description: "Please log in to process videos.",
        variant: "destructive",
      });
      return;
    }

    const tokensNeeded = calculateTokensNeeded(uploadedVideo);

    // Check token balance with calculated amount
    if (tokenBalance < tokensNeeded) {
      toast({
        title: "Insufficient tokens",
        description: `You need ${tokensNeeded} tokens but only have ${tokenBalance} available.`,
        variant: "destructive",
      });
      return;
    }

    // Validation for style matching - requires both video and image
    if (activeAction === "style-matching") {
      if (!uploadedVideo || !uploadedStyleImage) {
        toast({
          title: "Missing files",
          description: "Style matching requires both a video file and a style reference image.",
          variant: "destructive",
        });
        return;
      }
    } else {
      if (!uploadedVideo) {
        toast({
          title: "No video file",
          description: "Please upload a video file first.",
          variant: "destructive",
        });
        return;
      }
    }
    
    setIsProcessing(true);
    setJobStatus('Uploading video...');

    try {
      // Convert files to base64
      const videoBase64 = await fileToBase64(uploadedVideo);
      let styleImageBase64;
      
      if (uploadedStyleImage) {
        styleImageBase64 = await fileToBase64(uploadedStyleImage);
      }

      setJobStatus('Processing with AI...');

      // Call the edge function
      const { data, error } = await supabase.functions.invoke('process-video-job', {
        body: {
          processingType: activeAction,
          videoFile: videoBase64,
          styleImageFile: styleImageBase64,
          targetLanguage: activeAction === 'translation' ? 'Spanish' : undefined,
          originalFilename: uploadedVideo.name
        }
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        setResults({
          jobId: data.jobId,
          videoUrl: data.result?.processedVideoUrl || URL.createObjectURL(uploadedVideo),
          originalVideoUrl: URL.createObjectURL(uploadedVideo),
          subtitles: data.result?.subtitles || [],
          styleAnalysis: data.result?.styleAnalysis,
          srtUrl: data.result?.srtUrl
        });

        // Set initial edited subtitles with proper formatting
        if (data.result?.subtitles && Array.isArray(data.result.subtitles)) {
          const subtitleText = data.result.subtitles.map((s: any) => 
            `${formatTimeForEdit(s.start)} --> ${formatTimeForEdit(s.end)}\n${s.text}`
          ).join('\n\n');
          setEditedSubtitles(subtitleText);
          setShowSubtitleEditor(true);
        }

        // Refresh token balance
        await refreshTokenBalance();

        toast({
          title: "Processing complete!",
          description: `Your ${activeAction} has been completed successfully.`,
        });
      } else {
        throw new Error(data.error || 'Processing failed');
      }

    } catch (error: any) {
      console.error('Processing error:', error);
      toast({
        title: "Processing failed",
        description: error.message || "An error occurred while processing your video.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setJobStatus('');
    }
  };

  const handleApplyChanges = async () => {
    if (!editedSubtitles || !results?.jobId) return;

    setIsReprocessing(true);
    try {
      toast({
        title: "Re-timing subtitles...",
        description: "Using AI to sync your edited text with the audio. This may take a moment.",
      });

      // Extract just the text content for re-timing (remove timing info)
      const textOnlyContent = editedSubtitles
        .split('\n\n')
        .map(block => {
          const lines = block.trim().split('\n');
          // Skip timing line, keep only text
          return lines.length > 1 ? lines.slice(1).join(' ') : lines[0];
        })
        .filter(text => text.trim().length > 0)
        .join('\n');

      console.log('Sending text for re-timing:', textOnlyContent);

      // Call reprocessing edge function with edited text for re-timing
      const { data: reprocessData, error: reprocessError } = await supabase.functions.invoke('reprocess-subtitles', {
        body: { 
          jobId: results.jobId,
          editedText: textOnlyContent
        }
      });

      if (reprocessError) {
        throw reprocessError;
      }

      // Update results with the new processed video
      if (reprocessData?.processedVideoUrl) {
        setResults(prevResults => ({
          ...prevResults,
          processedVideoUrl: reprocessData.processedVideoUrl,
          videoUrl: reprocessData.processedVideoUrl,
        }));
      }

      toast({
        title: "✅ Your captions were applied and the video was saved to your History.",
        description: "Your edits have been synced with the audio and burned into the video.",
      });
    } catch (error: any) {
      console.error('Reprocessing error:', error);
      toast({
        title: "Re-timing failed",
        description: error.message || "Failed to re-time subtitles with audio.",
        variant: "destructive",
      });
    } finally {
      setIsReprocessing(false);
    }
  };

  const handleDownload = async (format: 'mp4' | 'mov' | 'srt') => {

    try {
      if (format === 'srt') {
        // Download SRT file from Supabase storage
        const { data: srtData, error: srtError } = await supabase.storage
          .from('processed-videos')
          .download(`${results.jobId}/subtitles.srt`);
          
        if (srtError) {
          // Fallback to generating SRT from results
          const srtContent = Array.isArray(results.subtitles) 
            ? results.subtitles.map((subtitle: any, index: number) => {
                const startTime = formatTimeForSRT(subtitle.start || index * 2);
                const endTime = formatTimeForSRT(subtitle.end || (index + 1) * 2);
                return `${index + 1}\n${startTime} --> ${endTime}\n${subtitle.text}\n\n`;
              }).join('')
            : '1\n00:00:00,000 --> 00:00:05,000\nNo subtitles available\n\n';

          const blob = new Blob([srtContent], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `subtitles.srt`;
          a.click();
          URL.revokeObjectURL(url);
        } else {
          // Download the actual SRT file
          const url = URL.createObjectURL(srtData);
          const a = document.createElement('a');
          a.href = url;
          a.download = `subtitles.srt`;
          a.click();
          URL.revokeObjectURL(url);
        }
      } else {
        // Download processed video from Supabase storage
        const { data: videoData, error: videoError } = await supabase.storage
          .from('processed-videos')
          .download(`${results.jobId}/processed_${uploadedVideo?.name || 'video.mp4'}`);
          
        if (videoError) {
          throw new Error('Processed video not found in storage');
        }
        
        const url = URL.createObjectURL(videoData);
        const a = document.createElement('a');
        a.href = url;
        a.download = `processed_video.${format}`;
        a.click();
        URL.revokeObjectURL(url);
      }

      toast({
        title: "Download started",
        description: `Your ${format.toUpperCase()} file is being downloaded.`,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download failed",
        description: "There was an error downloading the file.",
        variant: "destructive",
      });
    }
  };

  const formatTimeForSRT = (seconds: number) => {
    const date = new Date(seconds * 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
  };

  const formatTimeForEdit = (seconds: number) => {
    return `${seconds.toFixed(2)}s`;
  };

  if (!user) {
    return null; // Will redirect via useEffect
  }

  const ActionCard = ({ 
    id, 
    icon: Icon, 
    title, 
    description, 
    isActive, 
    onClick 
  }: {
    id: string;
    icon: any;
    title: string;
    description: string;
    isActive: boolean;
    onClick: () => void;
  }) => (
    <Card 
      className={`p-6 cursor-pointer transition-all border-2 hover:shadow-md ${
        isActive 
          ? "border-primary bg-primary/5" 
          : "border-border hover:border-primary/50"
      }`}
      onClick={onClick}
    >
      <div className="flex flex-col items-center text-center space-y-3">
        <Icon className={`h-8 w-8 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation />
      
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Header with token balance */}
        <section className="text-center space-y-4">
          <div className="flex justify-center items-center gap-4">
            <h1 className="text-3xl font-bold">Choose Your Action</h1>
            <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
              {tokenBalance} tokens available
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <ActionCard
              id="transcription"
              icon={FileText}
              title="Transcription"
              description="Convert speech to text subtitles"
              isActive={activeAction === "transcription"}
              onClick={() => setActiveAction("transcription")}
            />
            <ActionCard
              id="translation"
              icon={Languages}
              title="Translation"
              description="Translate subtitles to other languages"
              isActive={activeAction === "translation"}
              onClick={() => setActiveAction("translation")}
            />
            <ActionCard
              id="style-matching"
              icon={Palette}
              title="Style Matching"
              description="Match subtitle styles from reference"
              isActive={activeAction === "style-matching"}
              onClick={() => setActiveAction("style-matching")}
            />
          </div>
        </section>

        {/* Upload Section */}
        <section className="max-w-2xl mx-auto">
          <Card className="p-8">
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-center">
                {activeAction === "style-matching" 
                  ? "Upload Video & Style Reference" 
                  : `Upload Your Video for ${activeAction === "transcription" ? "Transcription" : "Translation"}`
                }
              </h2>
              
              {/* Video Upload (for all actions) */}
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center space-y-4">
                <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                <div>
                  <p className="text-lg font-medium">Drop your video here or click to browse</p>
                  <p className="text-sm text-muted-foreground">Supports MP4, MOV files up to 100MB</p>
                </div>
                <input
                  type="file"
                  accept=".mp4,.mov"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="video-upload"
                />
                <Button asChild>
                  <label htmlFor="video-upload" className="cursor-pointer">
                    Choose Video File
                  </label>
                </Button>
              </div>

              {uploadedVideo && (
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm font-medium">Video: {uploadedVideo.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Size: {(uploadedVideo.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              )}

              {/* Style Image Upload (only for style matching) */}
              {activeAction === "style-matching" && (
                <>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center space-y-4">
                    <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                    <div>
                      <p className="text-lg font-medium">Upload style reference image</p>
                      <p className="text-sm text-muted-foreground">Supports PNG, JPG, WEBP, GIF, BMP files</p>
                    </div>
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,.webp,.gif,.bmp"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="style-upload"
                    />
                    <Button asChild disabled={!uploadedVideo}>
                      <label htmlFor="style-upload" className={uploadedVideo ? "cursor-pointer" : "cursor-not-allowed"}>
                        Choose Style Image
                      </label>
                    </Button>
                    {!uploadedVideo && (
                      <p className="text-xs text-destructive">Please upload a video first</p>
                    )}
                  </div>

                  {uploadedStyleImage && (
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm font-medium">Style Image: {uploadedStyleImage.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Size: {(uploadedStyleImage.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  )}
                </>
              )}

              <Button 
                onClick={handleSendToAI}
                disabled={
                  isProcessing || 
                  !uploadedVideo || 
                  (activeAction === "style-matching" && !uploadedStyleImage) ||
                  tokenBalance < calculateTokensNeeded(uploadedVideo)
                }
                className="w-full"
                size="lg"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    {jobStatus || "Processing..."}
                  </div>
                ) : tokenBalance < calculateTokensNeeded(uploadedVideo) 
                  ? "Insufficient Tokens" 
                  : `Send to AI (${calculateTokensNeeded(uploadedVideo)} tokens)`}
              </Button>
            </div>
          </Card>
        </section>

        {/* Results Section */}
        {results && (
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-center">Results</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Video Preview */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Processed Video with Burned Subtitles</h3>
                <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
                  <video
                    src={results.processedVideoUrl || results.videoUrl}
                    controls
                    className="w-full h-full rounded-lg"
                    onLoadedData={(e) => {
                      const video = e.currentTarget;
                      console.log(`Video loaded: ${video.duration}s duration, ${video.videoWidth}x${video.videoHeight}`);
                    }}
                    onError={(e) => {
                      console.error('Video playback error:', e);
                    }}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
                {results.originalVideoUrl && results.processedVideoUrl !== results.originalVideoUrl && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Original Video (for comparison)</h4>
                    <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
                      <video
                        src={results.originalVideoUrl}
                        controls
                        className="w-full h-full rounded-lg"
                      >
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  </div>
                )}
              </Card>

              {/* Editor Panel */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Subtitle Editor</h3>
                <Tabs defaultValue="edit" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="edit">Edit</TabsTrigger>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="edit" className="space-y-4">
                    <Textarea
                      className="h-48 resize-none"
                      placeholder="Subtitles will appear here for editing..."
                      value={editedSubtitles}
                      onChange={(e) => setEditedSubtitles(e.target.value)}
                    />
                     <Button 
                       onClick={handleApplyChanges}
                       disabled={isReprocessing || !editedSubtitles.trim()}
                       className="w-full"
                     >
                      {isReprocessing ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          Updating Subtitles...
                        </div>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Apply Changes
                        </>
                      )}
                    </Button>
                    {results.styleAnalysis && (
                      <div className="p-4 bg-muted rounded-lg">
                        <h4 className="font-medium mb-2">Style Analysis:</h4>
                        <p className="text-sm text-muted-foreground">{results.styleAnalysis}</p>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="preview" className="space-y-4">
                    <div className="h-48 p-4 border rounded-lg bg-muted overflow-y-auto">
                      {Array.isArray(results.subtitles) ? (
                        results.subtitles.map((subtitle: any, index: number) => (
                          <div key={index} className="mb-3 p-2 bg-background rounded">
                            <div className="text-xs text-muted-foreground">
                              {subtitle.start}s - {subtitle.end}s
                            </div>
                            <div className="text-sm">{subtitle.text}</div>
                          </div>
                        ))
                      ) : (
                        <p className="whitespace-pre-wrap">{results.subtitles}</p>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </Card>
            </div>

            {/* Download Buttons */}
            <div className="flex justify-center space-x-4">
              <Button 
                variant="outline" 
                className="space-x-2"
                onClick={() => handleDownload('mp4')}
              >
                <Download className="h-4 w-4" />
                <span>Download MP4</span>
              </Button>
              <Button 
                variant="outline" 
                className="space-x-2"
                onClick={() => handleDownload('mov')}
              >
                <Download className="h-4 w-4" />
                <span>Download MOV</span>
              </Button>
              <Button 
                variant="outline" 
                className="space-x-2"
                onClick={() => handleDownload('srt')}
              >
                <Download className="h-4 w-4" />
                <span>Download SRT</span>
              </Button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default Dashboard;