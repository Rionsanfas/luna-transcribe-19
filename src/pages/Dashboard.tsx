import { useState } from "react";
import { Upload, Play, Download, FileText, Languages, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TopNavigation } from "@/components/TopNavigation";

const Dashboard = () => {
  const [activeAction, setActiveAction] = useState<"translation" | "transcription" | "style-matching">("transcription");
  const [uploadedVideo, setUploadedVideo] = useState<File | null>(null);
  const [uploadedStyleImage, setUploadedStyleImage] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<any>(null);

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

  const handleSendToAI = async () => {
    // Validation for style matching - requires both video and image
    if (activeAction === "style-matching") {
      if (!uploadedVideo || !uploadedStyleImage) {
        alert('Style matching requires both a video file and a style reference image');
        return;
      }
    } else {
      if (!uploadedVideo) return;
    }
    
    setIsProcessing(true);
    // Simulate AI processing
    setTimeout(() => {
      setResults({
        videoUrl: URL.createObjectURL(uploadedVideo!),
        subtitles: `Sample ${activeAction} result would appear here...`
      });
      setIsProcessing(false);
    }, 2000);
  };

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
        {/* Action Selection */}
        <section className="space-y-4">
          <h1 className="text-3xl font-bold text-center">Choose Your Action</h1>
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
                  (activeAction === "style-matching" && !uploadedStyleImage)
                }
                className="w-full"
                size="lg"
              >
                {isProcessing ? "Processing..." : "Send to AI"}
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
                <h3 className="text-lg font-semibold mb-4">Video Preview</h3>
                <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
                  <video
                    src={results.videoUrl}
                    controls
                    className="w-full h-full rounded-lg"
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
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
                    <textarea
                      className="w-full h-48 p-4 border rounded-lg resize-none bg-background"
                      placeholder="Subtitles will appear here for editing..."
                      defaultValue={results.subtitles}
                    />
                  </TabsContent>
                  
                  <TabsContent value="preview" className="space-y-4">
                    <div className="h-48 p-4 border rounded-lg bg-muted overflow-y-auto">
                      <p className="whitespace-pre-wrap">{results.subtitles}</p>
                    </div>
                  </TabsContent>
                </Tabs>
              </Card>
            </div>

            {/* Download Buttons */}
            <div className="flex justify-center space-x-4">
              <Button variant="outline" className="space-x-2">
                <Download className="h-4 w-4" />
                <span>Download MP4</span>
              </Button>
              <Button variant="outline" className="space-x-2">
                <Download className="h-4 w-4" />
                <span>Download MOV</span>
              </Button>
              <Button variant="outline" className="space-x-2">
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