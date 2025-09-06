import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Play, Upload, Zap } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";

export const Hero = () => {
  return (
    <section className="min-h-screen flex items-center justify-center px-4 py-20 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/50"></div>
      
      {/* Hero content */}
      <div className="relative z-10 max-w-7xl mx-auto text-center">
        <div className="animate-fade-in">
          <h1 className="font-fredoka font-bold text-5xl md:text-7xl lg:text-8xl mb-6 bg-gradient-to-r from-foreground via-muted-foreground to-foreground bg-clip-text text-transparent">
            VoiceScript
            <span className="font-motley block text-4xl md:text-5xl lg:text-6xl mt-2 opacity-80">
              AI Subtitles
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            Transform voice to professional subtitles with AI-powered transcription and translation. 
            Powered by advanced OpenAI models for perfect accuracy.
          </p>
        </div>

        {/* Hero image */}
        <div className="animate-slide-up mb-12">
          <GlassCard variant="glow" className="max-w-4xl mx-auto overflow-hidden">
            <img 
              src={heroImage} 
              alt="AI subtitle generation visualization" 
              className="w-full h-auto rounded-xl"
            />
          </GlassCard>
        </div>

        {/* CTA buttons */}
        <div className="animate-slide-up flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
          <Button size="lg" className="group font-fredoka font-medium text-lg px-8 py-4 rounded-2xl bg-primary hover:bg-primary/90 shadow-glow-soft hover:shadow-glow-strong transition-all duration-300">
            <Upload className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
            Start Generating
          </Button>
          <Button variant="outline" size="lg" className="group font-fredoka font-medium text-lg px-8 py-4 rounded-2xl border-2 hover:bg-accent/50 transition-all duration-300">
            <Play className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
            Watch Demo
          </Button>
        </div>

        {/* Stats */}
        <div className="animate-slide-up grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          {[
            { icon: Zap, label: "Processing Speed", value: "10x Faster" },
            { icon: Upload, label: "Accuracy Rate", value: "99.5%" },
            { icon: Play, label: "Languages", value: "50+" }
          ].map((stat, index) => (
            <GlassCard key={index} variant="hover" className="text-center">
              <stat.icon className="h-8 w-8 mx-auto mb-3 text-primary" />
              <div className="font-fredoka text-2xl font-bold mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
};