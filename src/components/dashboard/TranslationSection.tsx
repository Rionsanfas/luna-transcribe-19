import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Languages, Plus, X, Globe, ArrowRight } from "lucide-react";
import { LANGUAGES, POPULAR_LANGUAGES, getLanguageByCode } from "./languages";

interface TranslationSectionProps {
  isActive: boolean;
  sourceLanguage: string;
  onSourceLanguageChange: (language: string) => void;
  targetLanguages: string[];
  onTargetLanguagesChange: (languages: string[]) => void;
  translationPrompt: string;
  onTranslationPromptChange: (prompt: string) => void;
  preserveFormatting: boolean;
  onPreserveFormattingChange: (preserve: boolean) => void;
  maintainTiming: boolean;
  onMaintainTimingChange: (maintain: boolean) => void;
}

export const TranslationSection = ({
  isActive,
  sourceLanguage,
  onSourceLanguageChange,
  targetLanguages,
  onTargetLanguagesChange,
  translationPrompt,
  onTranslationPromptChange,
  preserveFormatting,
  onPreserveFormattingChange,
  maintainTiming,
  onMaintainTimingChange
}: TranslationSectionProps) => {
  const [showAllLanguages, setShowAllLanguages] = useState(false);

  if (!isActive) return null;

  const addTargetLanguage = (languageCode: string) => {
    if (!targetLanguages.includes(languageCode) && languageCode !== sourceLanguage) {
      onTargetLanguagesChange([...targetLanguages, languageCode]);
    }
  };

  const removeTargetLanguage = (languageCode: string) => {
    onTargetLanguagesChange(targetLanguages.filter(code => code !== languageCode));
  };

  const languageOptions = showAllLanguages ? LANGUAGES : LANGUAGES.filter(lang => 
    POPULAR_LANGUAGES.includes(lang.code)
  );

  return (
    <GlassCard className="p-4 md:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Languages className="h-5 w-5 text-primary" />
        <h3 className="font-fredoka text-base md:text-lg font-semibold text-foreground">
          Translation Settings
        </h3>
      </div>

      <div className="space-y-6">
        {/* Source and Target Languages */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div className="space-y-2">
              <Label className="text-sm font-medium font-fredoka text-foreground">
                Source Language
              </Label>
              <Select value={sourceLanguage} onValueChange={onSourceLanguageChange}>
                <SelectTrigger className="min-h-[44px] font-fredoka">
                  <SelectValue placeholder="Select source language">
                    {sourceLanguage && (
                      <div className="flex items-center gap-2">
                        <span>{getLanguageByCode(sourceLanguage)?.flag}</span>
                        <span>{getLanguageByCode(sourceLanguage)?.name}</span>
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

            <div className="hidden md:flex justify-center items-center">
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium font-fredoka text-foreground mb-2 block">
              Target Languages
            </Label>
            
            {targetLanguages.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {targetLanguages.map((code) => {
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
                        onClick={() => removeTargetLanguage(code)}
                        className="h-4 w-4 p-0 hover:bg-destructive/20"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  );
                })}
              </div>
            )}

            <Select onValueChange={addTargetLanguage}>
              <SelectTrigger className="min-h-[44px] font-fredoka">
                <SelectValue placeholder="Add target language">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Plus className="h-4 w-4" />
                    <span>Add target language...</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {languageOptions
                  .filter(lang => !targetLanguages.includes(lang.code) && lang.code !== sourceLanguage)
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

            {targetLanguages.length === 0 && (
              <p className="text-xs text-muted-foreground mt-2 font-fredoka">
                Add one or more languages to translate your subtitles into.
              </p>
            )}
          </div>
        </div>

        {/* Translation Options */}
        <div className="space-y-4">
          <Label className="text-sm font-medium font-fredoka text-foreground">
            Translation Options
          </Label>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="preserve-formatting"
                checked={preserveFormatting}
                onCheckedChange={onPreserveFormattingChange}
              />
              <Label
                htmlFor="preserve-formatting"
                className="text-sm font-fredoka cursor-pointer"
              >
                Preserve text formatting and punctuation
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="maintain-timing"
                checked={maintainTiming}
                onCheckedChange={onMaintainTimingChange}
              />
              <Label
                htmlFor="maintain-timing"
                className="text-sm font-fredoka cursor-pointer"
              >
                Maintain original subtitle timing
              </Label>
            </div>
          </div>
        </div>

        {/* Custom Translation Prompt */}
        <div className="space-y-2">
          <Label htmlFor="translation-prompt" className="text-sm font-medium font-fredoka text-foreground">
            Custom Translation Instructions
          </Label>
          <Textarea
            id="translation-prompt"
            value={translationPrompt}
            onChange={(e) => onTranslationPromptChange(e.target.value)}
            placeholder="Provide specific instructions for translation (e.g., 'Keep technical terms in English', 'Use formal tone', etc.)"
            className="min-h-20 text-sm resize-none font-fredoka"
          />
          <p className="text-xs text-muted-foreground font-fredoka">
            Optional: Add context or specific requirements to improve translation quality.
          </p>
        </div>

        {/* Multi-language Output Info */}
        {targetLanguages.length > 1 && (
          <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
            <div className="flex items-center gap-2 mb-1">
              <Globe className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium font-fredoka text-foreground">
                Multi-language Output
              </span>
            </div>
            <p className="text-xs font-fredoka text-muted-foreground">
              Your video will generate {targetLanguages.length + 1} subtitle files: 
              1 original ({getLanguageByCode(sourceLanguage)?.name}) + {targetLanguages.length} translations.
            </p>
          </div>
        )}
      </div>
    </GlassCard>
  );
};