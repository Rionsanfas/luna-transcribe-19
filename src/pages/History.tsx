import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Eye, Download, Trash2, ArrowLeft } from 'lucide-react';
import { TopNavigation } from '@/components/TopNavigation';

interface VideoHistory {
  id: string;
  original_filename: string;
  processing_type: string;
  target_language?: string;
  status: string;
  created_at: string;
  updated_at: string;
  tokens_used?: number;
  processedVideoUrl?: string;
  srtUrl?: string;
}

const History = () => {
  const [videos, setVideos] = useState<VideoHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<VideoHistory | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchVideoHistory();
  }, []);

  const fetchVideoHistory = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        navigate('/auth');
        return;
      }

      const { data: videoJobs, error } = await supabase
        .from('video_jobs')
        .select('*')
        .eq('user_id', user.user.id)
        .eq('status', 'completed')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Get public URLs for processed videos
      const videosWithUrls = await Promise.all(
        videoJobs.map(async (job) => {
          const processedFileName = `${job.id}/processed_${job.original_filename}`;
          const srtFileName = `${job.id}/subtitles.srt`;

          const { data: processedVideoUrl } = supabase.storage
            .from('processed-videos')
            .getPublicUrl(processedFileName);

          const { data: srtUrl } = supabase.storage
            .from('processed-videos')
            .getPublicUrl(srtFileName);

          return {
            ...job,
            processedVideoUrl: processedVideoUrl.publicUrl,
            srtUrl: srtUrl.publicUrl,
          };
        })
      );

      setVideos(videosWithUrls);
    } catch (error: any) {
      console.error('Error fetching video history:', error);
      toast({
        title: "Error loading history",
        description: error.message || "Failed to load video history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (videoId: string) => {
    try {
      // Delete from database
      const { error } = await supabase
        .from('video_jobs')
        .delete()
        .eq('id', videoId);

      if (error) throw error;

      // Remove from local state
      setVideos(videos.filter(v => v.id !== videoId));
      setSelectedVideo(null);

      toast({
        title: "Video deleted",
        description: "The video has been removed from your history.",
      });
    } catch (error: any) {
      console.error('Error deleting video:', error);
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete video",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async (video: VideoHistory, format: 'mp4' | 'srt') => {
    try {
      const fileName = format === 'srt' 
        ? `${video.id}/subtitles.srt`
        : `${video.id}/processed_${video.original_filename}`;

      const { data, error } = await supabase.storage
        .from('processed-videos')
        .download(fileName);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = format === 'srt' ? 'subtitles.srt' : `processed_${video.original_filename}`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Download started",
        description: `Your ${format.toUpperCase()} file is being downloaded.`,
      });
    } catch (error: any) {
      console.error('Error downloading file:', error);
      toast({
        title: "Download failed",
        description: error.message || "Failed to download file",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getProcessingTypeLabel = (type: string) => {
    switch (type) {
      case 'transcription': return 'Transcription';
      case 'translation': return 'Translation';
      case 'style-matching': return 'Style Matching';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <TopNavigation />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Video History</h1>
            <p className="text-muted-foreground">View and manage your processed videos</p>
          </div>
        </div>

        {videos.length === 0 ? (
          <Card className="p-8 text-center">
            <h3 className="text-lg font-semibold mb-2">No videos yet</h3>
            <p className="text-muted-foreground mb-4">
              Process your first video to see it here
            </p>
            <Button onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Video List */}
            <div className="space-y-4">
              {videos.map((video) => (
                <Card
                  key={video.id}
                  className={`p-4 cursor-pointer transition-colors ${
                    selectedVideo?.id === video.id ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedVideo(video)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold truncate">{video.original_filename}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {getProcessingTypeLabel(video.processing_type)}
                        </Badge>
                        {video.target_language && (
                          <Badge variant="outline" className="text-xs">
                            {video.target_language}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {formatDate(video.updated_at)}
                      </p>
                      {video.tokens_used && (
                        <p className="text-xs text-muted-foreground">
                          {video.tokens_used} tokens used
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedVideo(video);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(video.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Video Preview */}
            <div className="sticky top-8">
              {selectedVideo ? (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Video Preview</h3>
                  <div className="aspect-video bg-black rounded-lg mb-4">
                    <video
                      src={selectedVideo.processedVideoUrl}
                      controls
                      className="w-full h-full rounded-lg"
                      poster="/placeholder.svg"
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium">{selectedVideo.original_filename}</h4>
                      <p className="text-sm text-muted-foreground">
                        {getProcessingTypeLabel(selectedVideo.processing_type)}
                        {selectedVideo.target_language && ` to ${selectedVideo.target_language}`}
                      </p>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleDownload(selectedVideo, 'mp4')}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download MP4
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleDownload(selectedVideo, 'srt')}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download SRT
                      </Button>
                    </div>
                    
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => handleDelete(selectedVideo.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Video
                    </Button>
                  </div>
                </Card>
              ) : (
                <Card className="p-6 text-center">
                  <h3 className="text-lg font-semibold mb-2">Select a video</h3>
                  <p className="text-muted-foreground">
                    Click on a video from the list to preview it here
                  </p>
                </Card>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default History;