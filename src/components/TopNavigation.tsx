import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { User, Coins, Menu, X, Sun, Moon } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export const TopNavigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const { user, signOut, tokenBalance } = useAuth();
  const isMobile = useIsMobile();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    // Check initial theme
    setIsDark(document.documentElement.classList.contains('dark'));

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    if (newTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-card/95 backdrop-blur-md border-b border-border/50 py-2 shadow-lg rounded-b-3xl mx-4' 
        : 'bg-card/60 backdrop-blur-sm py-4 md:py-6'
    }`}>
      <div className="container mx-auto">
        <nav className="flex items-center justify-between px-4 md:px-6">
          {/* Mobile Menu Button */}
          {isMobile && (
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`${isScrolled ? 'text-card-foreground/90 hover:text-card-foreground' : 'text-foreground'}`}
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <SheetHeader>
                  <SheetTitle className="font-fredoka text-xl">SubAI</SheetTitle>
                </SheetHeader>
                <div className="mt-8 space-y-4">
                  <a 
                    href="#features" 
                    className="block text-base py-3 px-2 rounded-md hover:bg-accent transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Features
                  </a>
                  <a 
                    href="#pricing" 
                    className="block text-base py-3 px-2 rounded-md hover:bg-accent transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Pricing
                  </a>
                  {user && (
                    <Link 
                      to="/dashboard" 
                      className="block text-base py-3 px-2 rounded-md hover:bg-accent transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                  )}
                  {!user && (
                    <div className="space-y-3 pt-4">
                      <Button variant="outline" size="lg" className="w-full" asChild>
                        <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)}>Sign In</Link>
                      </Button>
                      <Button size="lg" className="w-full" asChild>
                        <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)}>Get Started</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          )}

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className={`text-sm transition-colors hover:scale-105 ${
              isScrolled ? 'text-card-foreground/90 hover:text-card-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}>
              Features
            </a>
            <a href="#pricing" className={`text-sm transition-colors hover:scale-105 ${
              isScrolled ? 'text-card-foreground/90 hover:text-card-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}>
              Pricing
            </a>
            {user && (
              <Link to="/dashboard" className={`text-sm transition-colors hover:scale-105 ${
                isScrolled ? 'text-card-foreground/90 hover:text-card-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}>
                Dashboard
              </Link>
            )}
          </div>

          {/* Center - Logo */}
          <div className="flex items-center absolute left-1/2 transform -translate-x-1/2 md:static md:transform-none">
            <Link to="/" className={`font-fredoka text-lg md:text-xl font-semibold transition-all duration-300 ${
              isScrolled ? 'text-card-foreground scale-90' : 'text-foreground scale-100'
            }`}>
              SubAI
            </Link>
          </div>

          {/* Right Section - Theme Toggle & Auth */}
          <div className="flex items-center space-x-2 md:space-x-3">
            {/* Theme Toggle */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleTheme}
              className={`min-h-[44px] ${
                isScrolled ? 'text-card-foreground/90 hover:text-card-foreground hover:bg-accent' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            {user ? (
              <div className="flex items-center space-x-2 md:space-x-3">
                {/* Token Balance - Hidden on very small screens */}
                <div className={`hidden sm:flex items-center space-x-1 text-sm ${
                  isScrolled ? 'text-card-foreground/90' : 'text-muted-foreground'
                }`}>
                  <Coins className="h-4 w-4" />
                  <span>{tokenBalance}</span>
                </div>
                
                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className={`flex items-center space-x-2 min-h-[44px] font-fredoka ${
                      isScrolled ? 'text-card-foreground hover:text-card-foreground hover:bg-accent' : 'text-foreground'
                    }`}>
                      <User className="h-4 w-4" />
                      <span className="hidden md:block">{user.email?.split('@')[0]}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-2 text-sm">
                      <p className="font-medium">{user.email?.split('@')[0]}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                      <div className="flex items-center gap-1 mt-1 text-xs text-primary">
                        <Coins className="h-3 w-3" />
                        <span>{tokenBalance} tokens</span>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard">Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/settings">Settings</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut}>
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" className={`min-h-[44px] ${
                  isScrolled ? 'text-card-foreground/90 hover:text-card-foreground hover:bg-accent' : 'text-muted-foreground'
                }`} asChild>
                  <Link to="/auth">Sign In</Link>
                </Button>
                <Button size="sm" className={`min-h-[44px] ${
                  isScrolled ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-primary hover:bg-primary/90'
                }`} asChild>
                  <Link to="/auth">Get Started</Link>
                </Button>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};