import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/ui/glass-card";
import {
  CheckCircle,
  AlertCircle,
  Info,
  X,
  Download,
  Clock,
  Zap
} from "lucide-react";

export const StatusBar = () => {
  // Mock notifications and status
  const notifications = [
    { id: 1, type: "success", message: "Project 'Tutorial Video' exported successfully", time: "2m ago" },
    { id: 2, type: "info", message: "AI transcription completed for 'Product Demo'", time: "5m ago" },
    { id: 3, type: "error", message: "Export failed: Insufficient storage space", time: "10m ago" },
  ];

  const isRendering = true;
  const renderProgress = 45;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success": return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "error": return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getNotificationBg = (type: string) => {
    switch (type) {
      case "success": return "bg-green-500/10 border-green-500/20";
      case "error": return "bg-red-500/10 border-red-500/20";
      default: return "bg-blue-500/10 border-blue-500/20";
    }
  };

  return (
    <div className="border-t border-border/50 p-4">
      <GlassCard className="p-4">
        <div className="flex items-center justify-between gap-4">
          {/* Render Progress */}
          <div className="flex items-center gap-4 flex-1">
            {isRendering ? (
              <>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary animate-pulse" />
                  <span className="text-sm font-medium">Rendering...</span>
                </div>
                <div className="flex-1 max-w-xs">
                  <Progress value={renderProgress} className="h-2" />
                </div>
                <span className="text-sm text-muted-foreground">{renderProgress}%</span>
                <Badge variant="secondary" className="text-xs">
                  <Clock className="w-3 h-3 mr-1" />
                  ~2m left
                </Badge>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-muted-foreground">Ready</span>
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="flex items-center gap-2">
            {notifications.slice(0, 2).map((notification) => (
              <div
                key={notification.id}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${getNotificationBg(notification.type)}`}
              >
                {getNotificationIcon(notification.type)}
                <span className="max-w-xs truncate">{notification.message}</span>
                <span className="text-xs text-muted-foreground ml-2">{notification.time}</span>
                <Button size="sm" variant="ghost" className="h-4 w-4 p-0 ml-1">
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
            
            {notifications.length > 2 && (
              <Badge variant="secondary" className="text-xs">
                +{notifications.length - 2} more
              </Badge>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline">
              View All
            </Button>
            <Button size="sm" variant="ghost">
              Clear
            </Button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};