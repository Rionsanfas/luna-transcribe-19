import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Play, Upload, Zap } from "lucide-react";
import Spline from '@splinetool/react-spline';

export const Hero = () => {
  return (
    <section className="min-h-screen flex items-center justify-center px-4 py-20 relative overflow-hidden">
      {/* 3D Spline Background Animation - Interactive */}
      <div className="absolute inset-0 z-10 pointer-events-auto opacity-40">
        <Spline
          scene="https://prod.spline.design/Z8nNT2-vDbtY8ZP7/scene.splinecode" 
        />
      </div>
      
      {/* Hero content */}
      <div className="relative z-20 max-w-5xl mx-auto text-center pointer-events-auto">
        <div className="animate-fade-in">
          <h1 className="font-fredoka font-bold text-5xl md:text-7xl lg:text-8xl mb-4 bg-gradient-to-r from-foreground via-muted-foreground to-foreground bg-clip-text text-transparent">
            Transform Video to Subtitles
          </h1>
          
          <h2 className="font-motley text-xl md:text-3xl lg:text-4xl mb-8 text-muted-foreground">
            AI-Powered Subtitle Generation with Perfect Accuracy
          </h2>
          
          <p className="text-lg md:text-xl text-muted-foreground/80 mb-12 max-w-3xl mx-auto leading-relaxed">
            Transform voice to professional subtitles with AI-powered transcription and translation. 
            Powered by advanced OpenAI models for perfect accuracy.
          </p>
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