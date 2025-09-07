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
  const { user, signOut, tokenBalance } = useAuth();

  return (
    <nav className="fixed top-4 left-4 right-4 z-50 bg-background/90 backdrop-blur-md border border-border/50 rounded-2xl shadow-glow-soft">
      <div className="max-w-full mx-auto px-6 py-4 flex items-center justify-center">
        {/* Left Section - Navigation Links */}
        <div className="hidden md:flex items-center space-x-8 flex-1">
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

        {/* Center - Logo */}
        <div className="flex-1 flex justify-center">
          <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
            <span className="font-fredoka text-xl font-semibold">SubAI</span>
          </Link>
        </div>

        {/* Right Section - Auth */}
        <div className="flex items-center space-x-3 flex-1 justify-end">
          {user ? (
            <div className="flex items-center space-x-3">
              {/* Token Balance */}
              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                <Coins className="h-4 w-4" />
                <span>{tokenBalance}</span>
              </div>
              
              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center space-x-2">
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
              <Button variant="ghost" size="sm" className="text-muted-foreground" asChild>
                <Link to="/auth">Sign In</Link>
              </Button>
              <Button size="sm" className="bg-primary hover:bg-primary/90" asChild>
                <Link to="/auth">Get Started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};