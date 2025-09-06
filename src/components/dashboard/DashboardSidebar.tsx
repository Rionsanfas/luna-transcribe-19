import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Palette,
  Layers,
  BookOpen,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Type,
  Video,
  Zap
} from "lucide-react";

interface DashboardSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const DashboardSidebar = ({ collapsed, onToggleCollapse }: DashboardSidebarProps) => {
  const presets = [
    { name: "Modern Minimal", type: "Clean white text", icon: Type },
    { name: "Cinema Bold", type: "Movie-style subtitle", icon: Video },
    { name: "Neon Glow", type: "Vibrant highlighted text", icon: Sparkles },
    { name: "Corporate", type: "Professional look", icon: Layers },
  ];

  return (
    <div className={`${collapsed ? 'w-16' : 'w-72'} transition-all duration-300 p-4 border-r border-border/50`}>
      <GlassCard className="h-full flex flex-col">
        {/* Collapse Toggle */}
        <div className="flex items-center justify-between p-4 border-b border-border/20">
          {!collapsed && <span className="font-semibold text-sm">Quick Actions</span>}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="h-8 w-8"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>

        <ScrollArea className="flex-1 p-4">
          {/* Presets Gallery */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-primary" />
              {!collapsed && <span className="text-sm font-medium">Style Presets</span>}
            </div>
            
            {!collapsed ? (
              <div className="space-y-2">
                {presets.map((preset, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    className="w-full justify-start h-auto p-3 hover:bg-accent/50"
                  >
                    <div className="flex items-start gap-3">
                      <preset.icon className="w-4 h-4 mt-0.5 text-primary" />
                      <div className="text-left">
                        <p className="text-sm font-medium">{preset.name}</p>
                        <p className="text-xs text-muted-foreground">{preset.type}</p>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {presets.map((preset, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    className="w-8 h-8 p-0"
                  >
                    <preset.icon className="w-4 h-4" />
                  </Button>
                ))}
              </div>
            )}

            <Separator className="my-4" />

            {/* Quick Actions */}
            <div className="space-y-2">
              <Button
                variant="ghost"
                className={`${collapsed ? 'w-8 h-8 p-0' : 'w-full justify-start'}`}
              >
                <Zap className="w-4 h-4" />
                {!collapsed && <span className="ml-2">AI Auto-Style</span>}
              </Button>
              
              <Button
                variant="ghost"
                className={`${collapsed ? 'w-8 h-8 p-0' : 'w-full justify-start'}`}
              >
                <BookOpen className="w-4 h-4" />
                {!collapsed && <span className="ml-2">Documentation</span>}
              </Button>
              
              <Button
                variant="ghost"
                className={`${collapsed ? 'w-8 h-8 p-0' : 'w-full justify-start'}`}
              >
                <MessageCircle className="w-4 h-4" />
                {!collapsed && <span className="ml-2">Support</span>}
              </Button>
            </div>
          </div>
        </ScrollArea>
      </GlassCard>
    </div>
  );
};