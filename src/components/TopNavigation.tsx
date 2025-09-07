import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Spline from '@splinetool/react-spline';

export const TopNavigation = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      {/* Small top animation */}
      <div className="absolute top-0 right-0 w-32 h-16 opacity-60 pointer-events-none">
        <Spline
          scene="https://prod.spline.design/pbCV2aNLv7Wsj0pv/scene.splinecode" 
        />
      </div>
      
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">S</span>
          </div>
          <span className="font-fredoka text-xl font-semibold">SubAI</span>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center space-x-8">
          <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
            Features
          </a>
          <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
            Pricing
          </a>
          <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
            Dashboard
          </Link>
        </div>

        {/* Auth Buttons - Placeholder for now */}
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            Sign In
          </Button>
          <Button size="sm" className="bg-primary hover:bg-primary/90">
            Get Started
          </Button>
        </div>
      </div>
    </nav>
  );
};