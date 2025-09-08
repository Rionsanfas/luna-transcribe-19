import { useState } from "react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Play, 
  Edit3, 
  Trash2, 
  Plus, 
  Save, 
  Clock, 
  Type,
  ChevronUp,
  ChevronDown
} from "lucide-react";

interface Subtitle {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  isEditing?: boolean;
}

interface SubtitleEditorProps {
  subtitles: Subtitle[];
  onSubtitleUpdate: (subtitles: Subtitle[]) => void;
  onSeekToTime: (time: number) => void;
  currentTime: number;
}

export const SubtitleEditor = ({ 
  subtitles, 
  onSubtitleUpdate, 
  onSeekToTime, 
  currentTime 
}: SubtitleEditorProps) => {
  const [selectedSubtitle, setSelectedSubtitle] = useState<string | null>(null);
  const [editingSubtitle, setEditingSubtitle] = useState<string | null>(null);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };

  const parseTime = (timeStr: string): number => {
    const [mins, rest] = timeStr.split(':');
    const [secs, ms = '0'] = rest.split('.');
    return parseInt(mins) * 60 + parseInt(secs) + parseInt(ms) / 1000;
  };

  const handleStartEdit = (subtitleId: string) => {
    setEditingSubtitle(subtitleId);
  };

  const handleSaveEdit = (subtitleId: string, newText: string, startTime: string, endTime: string) => {
    const updatedSubtitles = subtitles.map(sub => {
      if (sub.id === subtitleId) {
        return {
          ...sub,
          text: newText,
          startTime: parseTime(startTime),
          endTime: parseTime(endTime)
        };
      }
      return sub;
    });
    onSubtitleUpdate(updatedSubtitles);
    setEditingSubtitle(null);
  };

  const handleDeleteSubtitle = (subtitleId: string) => {
    const updatedSubtitles = subtitles.filter(sub => sub.id !== subtitleId);
    onSubtitleUpdate(updatedSubtitles);
  };

  const handleAddSubtitle = () => {
    const newSubtitle: Subtitle = {
      id: `sub_${Date.now()}`,
      startTime: currentTime,
      endTime: currentTime + 2,
      text: "New subtitle text"
    };
    onSubtitleUpdate([...subtitles, newSubtitle]);
  };

  const moveSubtitle = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === subtitles.length - 1)) {
      return;
    }
    
    const newSubtitles = [...subtitles];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newSubtitles[index], newSubtitles[targetIndex]] = [newSubtitles[targetIndex], newSubtitles[index]];
    onSubtitleUpdate(newSubtitles);
  };

  return (
    <GlassCard className="h-[600px] flex flex-col">
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Subtitle Editor</h3>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {subtitles.length} subtitles
            </Badge>
            <Button size="sm" onClick={handleAddSubtitle}>
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {subtitles.map((subtitle, index) => (
            <div
              key={subtitle.id}
              className={`border rounded-lg p-3 transition-colors ${
                selectedSubtitle === subtitle.id ? 'bg-primary/10 border-primary/30' : 'bg-card border-border/30'
              } ${currentTime >= subtitle.startTime && currentTime <= subtitle.endTime ? 'ring-2 ring-primary/50' : ''}`}
              onClick={() => setSelectedSubtitle(subtitle.id)}
            >
              {editingSubtitle === subtitle.id ? (
                <SubtitleEditForm 
                  subtitle={subtitle}
                  onSave={(text, start, end) => handleSaveEdit(subtitle.id, text, start, end)}
                  onCancel={() => setEditingSubtitle(null)}
                />
              ) : (
                <SubtitleDisplay 
                  subtitle={subtitle}
                  index={index}
                  totalCount={subtitles.length}
                  onEdit={() => handleStartEdit(subtitle.id)}
                  onDelete={() => handleDeleteSubtitle(subtitle.id)}
                  onSeek={() => onSeekToTime(subtitle.startTime)}
                  onMove={(direction) => moveSubtitle(index, direction)}
                />
              )}
            </div>
          ))}
          
          {subtitles.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Type className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium">No subtitles yet</p>
              <p className="text-sm">Upload a video to generate subtitles automatically</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </GlassCard>
  );
};

interface SubtitleDisplayProps {
  subtitle: Subtitle;
  index: number;
  totalCount: number;
  onEdit: () => void;
  onDelete: () => void;
  onSeek: () => void;
  onMove: (direction: 'up' | 'down') => void;
}

const SubtitleDisplay = ({ 
  subtitle, 
  index, 
  totalCount, 
  onEdit, 
  onDelete, 
  onSeek, 
  onMove 
}: SubtitleDisplayProps) => {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Clock className="w-3 h-3" />
          <span>{formatTime(subtitle.startTime)} → {formatTime(subtitle.endTime)}</span>
          <Badge variant="outline" className="text-xs">#{index + 1}</Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={onSeek}
            className="h-6 w-6 p-0"
            title="Seek to this subtitle"
          >
            <Play className="w-3 h-3" />
          </Button>
          <div className="flex flex-col">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onMove('up')}
              disabled={index === 0}
              className="h-3 w-6 p-0"
            >
              <ChevronUp className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onMove('down')}
              disabled={index === totalCount - 1}
              className="h-3 w-6 p-0"
            >
              <ChevronDown className="w-3 h-3" />
            </Button>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={onEdit}
            className="h-6 w-6 p-0"
          >
            <Edit3 className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onDelete}
            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
      <p className="text-sm leading-relaxed">{subtitle.text}</p>
    </div>
  );
};

interface SubtitleEditFormProps {
  subtitle: Subtitle;
  onSave: (text: string, startTime: string, endTime: string) => void;
  onCancel: () => void;
}

const SubtitleEditForm = ({ subtitle, onSave, onCancel }: SubtitleEditFormProps) => {
  const [text, setText] = useState(subtitle.text);
  const [startTime, setStartTime] = useState(() => {
    const mins = Math.floor(subtitle.startTime / 60);
    const secs = Math.floor(subtitle.startTime % 60);
    const ms = Math.floor((subtitle.startTime % 1) * 1000);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  });
  const [endTime, setEndTime] = useState(() => {
    const mins = Math.floor(subtitle.endTime / 60);
    const secs = Math.floor(subtitle.endTime % 60);
    const ms = Math.floor((subtitle.endTime % 1) * 1000);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  });

  const handleSave = () => {
    onSave(text, startTime, endTime);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-muted-foreground">Start Time</label>
          <Input
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            placeholder="00:00.000"
            className="text-xs"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">End Time</label>
          <Input
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            placeholder="00:02.000"
            className="text-xs"
          />
        </div>
      </div>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Subtitle text..."
        className="min-h-[60px] text-sm"
      />
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleSave}>
          <Save className="w-3 h-3 mr-1" />
          Save
        </Button>
      </div>
    </div>
  );
};