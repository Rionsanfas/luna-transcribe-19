import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { User, Coins } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export const TopNavigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, signOut, tokenBalance } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-primary/95 backdrop-blur-md border-b border-border/50 py-2 shadow-lg' 
        : 'bg-background/60 backdrop-blur-sm py-6'
    }`}>
      <div className="container mx-auto">
        <nav className="flex items-center justify-between px-6">
          {/* Left side - Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className={`text-sm transition-colors ${
              isScrolled ? 'text-white/90 hover:text-white' : 'text-muted-foreground hover:text-foreground'
            }`}>
              Features
            </a>
            <a href="#pricing" className={`text-sm transition-colors ${
              isScrolled ? 'text-white/90 hover:text-white' : 'text-muted-foreground hover:text-foreground'
            }`}>
              Pricing
            </a>
            {user && (
              <Link to="/dashboard" className={`text-sm transition-colors ${
                isScrolled ? 'text-white/90 hover:text-white' : 'text-muted-foreground hover:text-foreground'
              }`}>
                Dashboard
              </Link>
            )}
          </div>

          {/* Center - Logo */}
          <div className="flex items-center">
            <Link to="/" className={`font-fredoka text-xl font-semibold transition-all duration-300 ${
              isScrolled ? 'text-white scale-90' : 'text-foreground scale-100'
            }`}>
              SubAI
            </Link>
          </div>

          {/* Right Section - Auth */}
          <div className="flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-3">
                {/* Token Balance */}
                <div className={`flex items-center space-x-1 text-sm ${
                  isScrolled ? 'text-white/90' : 'text-muted-foreground'
                }`}>
                  <Coins className="h-4 w-4" />
                  <span>{tokenBalance}</span>
                </div>
                
                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className={`flex items-center space-x-2 ${
                      isScrolled ? 'text-white/90 hover:text-white hover:bg-white/20' : ''
                    }`}>
                      <User className="h-4 w-4" />
                      <span className="hidden sm:block">{user.email?.split('@')[0]}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard">Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut}>
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <>
                <Button variant="ghost" size="sm" className={`${
                  isScrolled ? 'text-white/90 hover:text-white hover:bg-white/20' : 'text-muted-foreground'
                }`} asChild>
                  <Link to="/auth">Sign In</Link>
                </Button>
                <Button size="sm" className={`${
                  isScrolled ? 'bg-white text-primary hover:bg-white/90' : 'bg-primary hover:bg-primary/90'
                }`} asChild>
                  <Link to="/auth">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};