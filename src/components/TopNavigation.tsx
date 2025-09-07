import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Spline from '@splinetool/react-spline';

export const TopNavigation = () => {
  return (
    <nav className="fixed top-4 left-4 right-4 z-50 bg-background/90 backdrop-blur-md border border-border/50 rounded-2xl shadow-glow-soft">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
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