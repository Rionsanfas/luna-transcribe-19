import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, Plus, X, Sparkles } from "lucide-react";
import { LANGUAGES, POPULAR_LANGUAGES, getLanguageByCode } from "./languages";

interface TranscriptionSectionProps {
  isActive: boolean;
  primaryLanguage: string;
  onPrimaryLanguageChange: (language: string) => void;
  detectLanguages: string[];
  onDetectLanguagesChange: (languages: string[]) => void;
  autoDetect: boolean;
  onAutoDetectChange: (autoDetect: boolean) => void;
}

export const TranscriptionSection = ({
  isActive,
  primaryLanguage,
  onPrimaryLanguageChange,
  detectLanguages,
  onDetectLanguagesChange,
  autoDetect,
  onAutoDetectChange
}: TranscriptionSectionProps) => {
  const [showAllLanguages, setShowAllLanguages] = useState(false);

  if (!isActive) return null;

  const addDetectLanguage = (languageCode: string) => {
    if (!detectLanguages.includes(languageCode)) {
      onDetectLanguagesChange([...detectLanguages, languageCode]);
    }
  };

  const removeDetectLanguage = (languageCode: string) => {
    onDetectLanguagesChange(detectLanguages.filter(code => code !== languageCode));
  };

  const languageOptions = showAllLanguages ? LANGUAGES : LANGUAGES.filter(lang => 
    POPULAR_LANGUAGES.includes(lang.code)
  );

  return (
    <GlassCard className="p-4 md:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Mic className="h-5 w-5 text-primary" />
        <h3 className="font-fredoka text-base md:text-lg font-semibold text-foreground">
          Transcription Settings
        </h3>
      </div>

      <div className="space-y-6">
        {/* Language Detection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium font-fredoka text-foreground">
              Language Detection
            </Label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAutoDetectChange(!autoDetect)}
              className="h-8 px-3 font-fredoka"
            >
              <Sparkles className="h-3 w-3 mr-2" />
              {autoDetect ? 'Auto-Detect ON' : 'Manual Select'}
            </Button>
          </div>

          {!autoDetect && (
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium font-fredoka text-foreground mb-2 block">
                  Primary Language
                </Label>
                <Select value={primaryLanguage} onValueChange={onPrimaryLanguageChange}>
                  <SelectTrigger className="min-h-[44px] font-fredoka">
                    <SelectValue placeholder="Select primary language">
                      {primaryLanguage && (
                        <div className="flex items-center gap-2">
                          <span>{getLanguageByCode(primaryLanguage)?.flag}</span>
                          <span>{getLanguageByCode(primaryLanguage)?.name}</span>
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <div className="p-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAllLanguages(!showAllLanguages)}
                        className="w-full mb-2 font-fredoka"
                      >
                        {showAllLanguages ? 'Show Popular Only' : 'Show All Languages'}
                      </Button>
                    </div>
                    {languageOptions.map((language) => (
                      <SelectItem key={language.code} value={language.code}>
                        <div className="flex items-center gap-2">
                          <span>{language.flag}</span>
                          <span>{language.name}</span>
                          <span className="text-muted-foreground text-xs">({language.nativeName})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium font-fredoka text-foreground mb-2 block">
                  Additional Languages (Multi-language Detection)
                </Label>
                
                {detectLanguages.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {detectLanguages.map((code) => {
                      const lang = getLanguageByCode(code);
                      if (!lang) return null;
                      return (
                        <Badge
                          key={code}
                          variant="secondary"
                          className="flex items-center gap-1 py-1 px-2"
                        >
                          <span>{lang.flag}</span>
                          <span className="font-fredoka">{lang.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeDetectLanguage(code)}
                            className="h-4 w-4 p-0 hover:bg-destructive/20"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      );
                    })}
                  </div>
                )}

                <Select onValueChange={addDetectLanguage}>
                  <SelectTrigger className="min-h-[44px] font-fredoka">
                    <SelectValue placeholder="Add language for detection">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Plus className="h-4 w-4" />
                        <span>Add additional language...</span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {languageOptions
                      .filter(lang => !detectLanguages.includes(lang.code) && lang.code !== primaryLanguage)
                      .map((language) => (
                        <SelectItem key={language.code} value={language.code}>
                          <div className="flex items-center gap-2">
                            <span>{language.flag}</span>
                            <span>{language.name}</span>
                            <span className="text-muted-foreground text-xs">({language.nativeName})</span>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {autoDetect && (
            <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-sm font-fredoka text-foreground">
                <Sparkles className="h-4 w-4 inline mr-1" />
                AI will automatically detect the language(s) in your video and transcribe accurately using advanced speech recognition models.
              </p>
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  );
};