import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { TranscribeUploadSection } from "@/components/dashboard/TranscribeUploadSection";
import { TranslateUploadSection } from "@/components/dashboard/TranslateUploadSection";
import { StyleMatchingUploadSection } from "@/components/dashboard/StyleMatchingUploadSection";
import { 
  Zap, 
  Settings, 
  User,
  LogOut,
  Moon,
  Sun,
  Coins,
  Type,
  Mic,
  Image
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, tokenBalance, signOut } = useAuth();
  const { toast } = useToast();
  const [isDark, setIsDark] = useState(false);
  const [uploadMode, setUploadMode] = useState<'transcribe' | 'translate' | 'style-match'>('transcribe');

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account.",
      });
    } catch (error) {
      toast({
        title: "Error signing out",
        description: "There was a problem signing you out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <nav className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <GlassCard className="rounded-none border-0">
          <div className="flex items-center justify-between p-3 md:p-4">
            {/* Logo - Clickable to return home */}
            <button 
              onClick={() => navigate('/')}
              className="font-fredoka text-xl md:text-2xl font-bold text-primary hover:text-primary/80 transition-colors touch-manipulation min-h-[44px] flex items-center"
            >
              SubAI
            </button>

            {/* Right side */}
            <div className="flex items-center gap-2 md:gap-4">
              {/* Theme toggle */}
              <Button variant="ghost" size="sm" onClick={toggleTheme} className="min-h-[44px] min-w-[44px]">
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>

              {/* User menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 md:gap-3 px-2 md:px-3 min-h-[44px]">
                    <Avatar className="h-6 w-6 md:h-8 md:w-8">
                      <AvatarFallback className="text-xs">
                        {user?.email?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:flex flex-col items-start text-sm">
                      <span className="text-foreground font-fredoka text-xs md:text-sm">{user?.email}</span>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Coins className="h-3 w-3" />
                        <span>{tokenBalance} tokens</span>
                      </div>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-2 text-sm sm:hidden">
                    <p className="font-medium font-fredoka text-foreground">{user?.email}</p>
                    <div className="flex items-center gap-1 mt-1 text-xs text-primary">
                      <Coins className="h-3 w-3" />
                      <span>{tokenBalance} tokens</span>
                    </div>
                  </div>
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={async () => {
                    toast({
                      title: "Opening billing portal...",
                      description: "Redirecting you to manage your subscription.",
                    });
                    
                    try {
                      const { data: { session } } = await supabase.auth.getSession();
                      if (!session?.access_token) throw new Error('Not authenticated');
                      
                      const { data, error } = await supabase.functions.invoke('polar-customer-portal', {
                        headers: {
                          Authorization: `Bearer ${session.access_token}`,
                        },
                      });
                      
                      if (error) throw error;
                      
                      if (data?.url) {
                        window.open(data.url, '_blank');
                      }
                    } catch (error: any) {
                      console.error('Billing portal error:', error);
                      toast({
                        title: "Error",
                        description: "Could not open billing portal. Please try again.",
                        variant: "destructive",
                      });
                    }
                  }}>
                    <Coins className="mr-2 h-4 w-4" />
                    Billing
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </GlassCard>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-6xl">
        {/* Processing Mode Selection */}
        <GlassCard className="p-4 md:p-6">
          <h2 className="font-fredoka text-lg md:text-xl font-semibold mb-4 text-foreground">Select Processing Mode</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant={uploadMode === 'transcribe' ? 'default' : 'outline'}
              onClick={() => setUploadMode('transcribe')}
              className="h-auto p-4 flex flex-col items-center gap-2 min-h-[80px] touch-manipulation font-fredoka"
            >
              <Mic className="h-6 w-6" />
              <span className="text-sm font-medium">Transcribe</span>
              <span className="text-xs text-muted-foreground">Convert speech to text</span>
            </Button>
            <Button
              variant={uploadMode === 'translate' ? 'default' : 'outline'}
              onClick={() => setUploadMode('translate')}
              className="h-auto p-4 flex flex-col items-center gap-2 min-h-[80px] touch-manipulation font-fredoka"
            >
              <Type className="h-6 w-6" />
              <span className="text-sm font-medium">Translate</span>
              <span className="text-xs text-muted-foreground">Transcribe & translate</span>
            </Button>
            <Button
              variant={uploadMode === 'style-match' ? 'default' : 'outline'}
              onClick={() => setUploadMode('style-match')}
              className="h-auto p-4 flex flex-col items-center gap-2 min-h-[80px] touch-manipulation font-fredoka"
            >
              <Image className="h-6 w-6" />
              <span className="text-sm font-medium">Style Match</span>
              <span className="text-xs text-muted-foreground">Match subtitle style</span>
            </Button>
          </div>
        </GlassCard>

        {/* Mode-specific Upload Sections */}
        {uploadMode === 'transcribe' && <TranscribeUploadSection />}
        {uploadMode === 'translate' && <TranslateUploadSection />}
        {uploadMode === 'style-match' && <StyleMatchingUploadSection />}

        {/* Token Status */}
        <GlassCard className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-fredoka text-base md:text-lg font-semibold text-foreground">Token Balance</h3>
              <p className="text-muted-foreground text-sm font-fredoka">1 token = 10MB processing</p>
            </div>
            <div className="text-center sm:text-right">
              <div className="text-xl md:text-2xl font-bold text-primary font-fredoka">{tokenBalance}</div>
              <Button variant="outline" size="sm" className="mt-2 min-h-[44px] touch-manipulation font-fredoka">
                <Zap className="mr-2 h-4 w-4" />
                Buy More Tokens
              </Button>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default Dashboard;