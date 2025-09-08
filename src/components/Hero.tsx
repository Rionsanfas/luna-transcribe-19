import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Play, Upload, Zap } from "lucide-react";

export const Hero = () => {
  return (
    <section className="min-h-screen flex items-center justify-center px-4 py-20 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-secondary/20 animate-pulse"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-primary/10 to-transparent animate-pulse" style={{animationDelay: '3s'}}></div>
        
        {/* Floating Elements */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/20 rounded-full blur-2xl animate-bounce" style={{animationDuration: '4s'}}></div>
        <div className="absolute bottom-1/3 right-1/4 w-24 h-24 bg-secondary/20 rounded-full blur-xl animate-bounce" style={{animationDuration: '5s', animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 right-1/3 w-16 h-16 bg-accent/30 rounded-full blur-lg animate-bounce" style={{animationDuration: '3s', animationDelay: '2s'}}></div>
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
            <Button 
              size="lg" 
              className="font-fredoka font-medium text-lg px-8 py-4 rounded-2xl"
              onClick={() => window.location.href = '/dashboard'}
            >
              Start Transcribing
              <Zap className="ml-2 h-5 w-5" />
            </Button>
          <Button variant="outline" size="lg" className="group font-fredoka font-medium text-lg px-8 py-4 rounded-2xl border-2 hover:bg-accent/50 transition-all duration-300"
            onClick={() => window.location.href = '/dashboard'}
          >
            <Upload className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
            Try Dashboard
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