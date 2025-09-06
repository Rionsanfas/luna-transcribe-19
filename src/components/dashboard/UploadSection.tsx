import { useState } from "react";
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
  Plus
} from "lucide-react";

export const UploadSection = () => {
  const [dragOver, setDragOver] = useState(false);

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
    // Handle file drop logic
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
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Upload Your Video</h3>
            <p className="text-muted-foreground mb-4">
              Drop your MP4, MOV, or other video files here, or click to browse
            </p>
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
              <Button className="flex items-center gap-2">
                <Video className="w-4 h-4" />
                Choose Video File
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <Image className="w-4 h-4" />
                Style Reference (Optional)
              </Button>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              <Badge variant="secondary" className="text-xs">MP4</Badge>
              <Badge variant="secondary" className="text-xs">MOV</Badge>
              <Badge variant="secondary" className="text-xs">AVI</Badge>
              <Badge variant="secondary" className="text-xs">MKV</Badge>
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