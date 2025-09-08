import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { getFileSizeLimit } from "@/components/Pricing";
import { 
  Upload, 
  FileVideo, 
  Languages, 
  Zap, 
  Settings, 
  User,
  LogOut,
  Moon,
  Sun,
  Coins,
  Play,
  Pause,
  Download,
  Type,
  Mic
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, tokenBalance, signOut } = useAuth();
  const { toast } = useToast();
  const [isDark, setIsDark] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<File | null>(null);
  const [transcriptionResult, setTranscriptionResult] = useState<string>("");
  const [customPrompt, setCustomPrompt] = useState("Transcribe this audio accurately and create properly timed subtitles.");
  const [targetLanguage, setTargetLanguage] = useState("en");
  const [uploadMode, setUploadMode] = useState<'transcribe' | 'match'>('transcribe');

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account.",
      });
    } catch (error) {
      toast({
        title: "Error signing out",
        description: "There was a problem signing you out. Please try again.",
        variant: "destructive",
      });
    }
  };

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
    if (!file.type.startsWith('video/') && !file.type.startsWith('audio/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a video or audio file.",
        variant: "destructive",
      });
      return;
    }

    const fileSizeMB = Math.round(file.size / (1024 * 1024));
    const tokensRequired = Math.ceil(fileSizeMB / 10);

    // Check file size limits based on user's plan (default to free plan)
    const maxFileSizeMB = getFileSizeLimit("free"); // TODO: Get actual user plan from profile
    if (fileSizeMB > maxFileSizeMB) {
      toast({
        title: "File too large",
        description: `Maximum file size for your plan is ${maxFileSizeMB}MB. Current file is ${fileSizeMB}MB.`,
        variant: "destructive",
      });
      return;
    }

    if (tokenBalance < tokensRequired) {
      toast({
        title: "Insufficient tokens",
        description: `You need ${tokensRequired} tokens but only have ${tokenBalance}.`,
        variant: "destructive",
      });
      return;
    }

    setCurrentVideo(file);
    setIsProcessing(true);
    setUploadProgress(0);

    try {
      // Convert file to base64
      const arrayBuffer = await file.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      // Create progress simulation
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const { data, error } = await supabase.functions.invoke('generate-subtitles', {
        body: {
          video_data: base64,
          video_size_mb: fileSizeMB,
          custom_prompt: customPrompt,
          target_language: targetLanguage,
          upload_mode: uploadMode
        }
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (error) {
        throw error;
      }

      setTranscriptionResult(data.transcription || "Transcription completed successfully!");
      
      toast({
        title: "Processing complete!",
        description: `Successfully processed ${file.name}. Used ${tokensRequired} tokens.`,
      });

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to process the file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setTimeout(() => {
        setUploadProgress(0);
      }, 2000);
    }
  };

  const downloadSubtitles = () => {
    if (!transcriptionResult) return;
    
    const blob = new Blob([transcriptionResult], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subtitles.srt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <nav className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <GlassCard className="rounded-none border-0">
          <div className="flex items-center justify-between p-3 md:p-4">
            {/* Logo - Clickable to return home */}
            <button 
              onClick={() => navigate('/')}
              className="font-fredoka text-xl md:text-2xl font-bold text-primary hover:text-primary/80 transition-colors touch-manipulation min-h-[44px] flex items-center"
            >
              SubAI
            </button>

            {/* Right side */}
            <div className="flex items-center gap-2 md:gap-4">
              {/* Theme toggle */}
              <Button variant="ghost" size="sm" onClick={toggleTheme} className="min-h-[44px] min-w-[44px]">
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>

              {/* User menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 md:gap-3 px-2 md:px-3 min-h-[44px]">
                    <Avatar className="h-6 w-6 md:h-8 md:w-8">
                      <AvatarFallback className="text-xs">
                        {user?.email?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:flex flex-col items-start text-sm">
                      <span className="text-foreground font-fredoka text-xs md:text-sm">{user?.email}</span>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Coins className="h-3 w-3" />
                        <span>{tokenBalance} tokens</span>
                      </div>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-2 text-sm sm:hidden">
                    <p className="font-medium font-fredoka text-foreground">{user?.email}</p>
                    <div className="flex items-center gap-1 mt-1 text-xs text-primary">
                      <Coins className="h-3 w-3" />
                      <span>{tokenBalance} tokens</span>
                    </div>
                  </div>
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </GlassCard>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 md:space-y-8">
        {/* Header */}
              <div className="text-center space-y-3 md:space-y-4 pt-4">
          <h1 className="font-fredoka text-2xl md:text-4xl font-bold text-foreground">AI Voice Transcription</h1>
          <p className="font-fredoka text-lg md:text-xl text-foreground max-w-2xl mx-auto px-4">
            Transform your audio and video files into professional subtitles with AI-powered transcription
          </p>
        </div>

        {/* Upload Mode Selection */}
        <GlassCard className="p-4 md:p-6">
          <h2 className="font-fredoka text-lg md:text-xl font-semibold mb-4 text-foreground">Choose Upload Mode</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <Button
              variant={uploadMode === 'transcribe' ? 'default' : 'outline'}
              onClick={() => setUploadMode('transcribe')}
              className="p-4 md:p-6 h-auto flex-col space-y-2 min-h-[120px] md:min-h-[140px] touch-manipulation"
            >
              <Mic className="h-6 md:h-8 w-6 md:w-8" />
              <span className="font-medium text-sm md:text-base font-fredoka">Transcribe Audio</span>
              <span className="text-xs md:text-sm opacity-80 text-center leading-tight font-fredoka">Extract speech from video/audio and generate subtitles</span>
            </Button>
            <Button
              variant={uploadMode === 'match' ? 'default' : 'outline'}
              onClick={() => setUploadMode('match')}
              className="p-4 md:p-6 h-auto flex-col space-y-2 min-h-[120px] md:min-h-[140px] touch-manipulation"
            >
              <Type className="h-6 md:h-8 w-6 md:w-8" />
              <span className="font-medium text-sm md:text-base font-fredoka">Match Existing Subtitles</span>
              <span className="text-xs md:text-sm opacity-80 text-center leading-tight font-fredoka">Sync existing text with video timing</span>
            </Button>
          </div>
        </GlassCard>

        {/* AI Settings */}
        <GlassCard className="p-4 md:p-6">
          <h3 className="font-fredoka text-base md:text-lg font-semibold mb-4 text-foreground">AI Configuration</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <div className="space-y-2">
              <Label htmlFor="custom-prompt" className="text-sm font-medium font-fredoka text-foreground">Custom AI Prompt</Label>
              <Textarea
                id="custom-prompt"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Describe how you want the AI to process your audio..."
                className="min-h-24 md:min-h-20 text-sm resize-none font-fredoka"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="target-language" className="text-sm font-medium font-fredoka text-foreground">Target Language</Label>
              <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                <SelectTrigger className="min-h-[44px] font-fredoka">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                  <SelectItem value="it">Italian</SelectItem>
                  <SelectItem value="pt">Portuguese</SelectItem>
                  <SelectItem value="ru">Russian</SelectItem>
                  <SelectItem value="ja">Japanese</SelectItem>
                  <SelectItem value="ko">Korean</SelectItem>
                  <SelectItem value="zh">Chinese</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </GlassCard>

        {/* Upload Area */}
        <GlassCard 
          className={`p-6 md:p-8 border-2 border-dashed transition-all duration-200 ${
            dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="text-center space-y-4">
            {!currentVideo ? (
              <>
                <div className="mx-auto w-12 h-12 md:w-16 md:h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  {uploadMode === 'transcribe' ? (
                    <FileVideo className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                  ) : (
                    <Languages className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                  )}
                </div>
                <div>
                  <h3 className="font-fredoka text-lg md:text-xl font-semibold text-foreground">
                    {uploadMode === 'transcribe' ? 'Upload Video or Audio' : 'Upload Video for Subtitle Matching'}
                  </h3>
                  <p className="text-muted-foreground mt-2 text-sm md:text-base px-4 font-fredoka">
                    Drag and drop your files here, or tap to browse
                  </p>
                </div>
                <div>
                  <Input
                    type="file"
                    accept="video/*,audio/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  <Button asChild className="font-medium min-h-[48px] px-6 md:px-8 touch-manipulation font-fredoka">
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Upload className="mr-2 h-4 w-4" />
                      Choose File
                    </label>
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground px-4 leading-relaxed font-fredoka">
                  Supported: MP4, MOV, AVI, MP3, WAV, M4A<br className="md:hidden" />
                  <span className="md:ml-2">Cost: 1 token per 10MB</span>
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
                    Cost: {Math.ceil((currentVideo.size / (1024 * 1024)) / 10)} tokens
                  </p>
                </div>
                
                {isProcessing && (
                  <div className="space-y-2 px-4">
                    <Progress value={uploadProgress} className="w-full max-w-md mx-auto" />
                    <p className="text-sm text-muted-foreground font-fredoka">
                      {uploadProgress < 90 ? 'Uploading...' : 'Processing with AI...'}
                    </p>
                  </div>
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
            )}
          </div>
        </GlassCard>

        {/* Results */}
        {transcriptionResult && (
          <GlassCard className="p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
              <h3 className="font-fredoka text-base md:text-lg font-semibold text-foreground">Generated Subtitles</h3>
              <Button onClick={downloadSubtitles} size="sm" className="min-h-[44px] touch-manipulation font-fredoka">
                <Download className="mr-2 h-4 w-4" />
                Download SRT
              </Button>
            </div>
            <div className="bg-muted/50 border border-border rounded-lg p-3 md:p-4 max-h-60 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-xs md:text-sm text-foreground">{transcriptionResult}</pre>
            </div>
          </GlassCard>
        )}

        {/* Token Status */}
        <GlassCard className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-fredoka text-base md:text-lg font-semibold text-foreground">Token Balance</h3>
              <p className="text-muted-foreground text-sm font-fredoka">1 token = 10MB processing</p>
            </div>
            <div className="text-center sm:text-right">
              <div className="text-xl md:text-2xl font-bold text-primary font-fredoka">{tokenBalance}</div>
              <Button variant="outline" size="sm" className="mt-2 min-h-[44px] touch-manipulation font-fredoka">
                <Zap className="mr-2 h-4 w-4" />
                Buy More Tokens
              </Button>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default Dashboard;