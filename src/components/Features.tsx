import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Bot, Globe, Zap, Shield, Clock, FileText } from "lucide-react";

const features = [
  {
    icon: Bot,
    title: "AI-Powered Transcription",
    description: "Advanced OpenAI models ensure perfect voice-to-text conversion with industry-leading accuracy.",
    badge: "Core Feature"
  },
  {
    icon: Globe,
    title: "Multi-Language Support",
    description: "Translate and transcribe in 50+ languages with native-level quality and cultural context.",
    badge: "50+ Languages"
  },
  {
    icon: Zap,
    title: "Lightning Fast Processing",
    description: "Process hours of audio in minutes. Our optimized pipeline delivers results 10x faster than competitors.",
    badge: "10x Speed"
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "Bank-grade encryption and privacy protection. Your audio files are processed securely and never stored.",
    badge: "SOC 2 Compliant"
  },
  {
    icon: Clock,
    title: "Real-Time Generation",
    description: "Watch subtitles appear in real-time as you upload. Perfect for live events and streaming.",
    badge: "Live Processing"
  },
  {
    icon: FileText,
    title: "Multiple Export Formats",
    description: "Export in SRT, VTT, TXT, or custom formats. Compatible with all major video platforms.",
    badge: "Universal Support"
  }
];

export const Features = () => {
  return (
    <section className="py-20 px-4 relative">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-fredoka text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Powerful AI Features
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to create professional subtitles with the power of artificial intelligence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <GlassCard 
              key={index} 
              variant="hover" 
              className="group relative overflow-hidden"
              style={{ 
                animationDelay: `${index * 100}ms`,
                animation: 'slide-up 0.8s var(--ease-out-expo) forwards'
              }}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-fredoka text-lg font-semibold text-foreground">{feature.title}</h3>
                  </div>
                  <Badge variant="secondary" className="mb-3 text-xs rounded-full">
                    {feature.badge}
                  </Badge>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
              
              {/* Hover glow effect */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-r from-transparent via-primary/5 to-transparent"></div>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
};