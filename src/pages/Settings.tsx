import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowLeft, 
  User, 
  Lock, 
  Camera, 
  Save,
  Trash2,
  CreditCard,
  Moon,
  Sun,
  LogOut
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

const Settings = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isDark, setIsDark] = useState(false);
  
  // Form states
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          display_name: displayName,
          avatar_url: avatarUrl
        });

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateEmail = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ email });
      
      if (error) throw error;

      toast({
        title: "Email update initiated",
        description: "Check your new email for confirmation.",
      });
    } catch (error: any) {
      toast({
        title: "Error updating email",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!user) return;
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ 
        password: newPassword 
      });
      
      if (error) throw error;

      toast({
        title: "Password updated",
        description: "Your password has been updated successfully.",
      });
      
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({
        title: "Error updating password",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openCustomerPortal = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('polar-customer-portal', {
        body: { user_id: user?.id }
      });

      if (error) throw error;

      if (data?.portal_url) {
        window.open(data.portal_url, '_blank');
      } else {
        throw new Error('No portal URL received');
      }
    } catch (error: any) {
      toast({
        title: "Error opening billing portal",
        description: error.message || "Could not open the billing portal. Please try again.",
        variant: "destructive",
      });
    }
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
      {/* Header */}
      <div className="border-b border-border/50 bg-card/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="font-fredoka text-2xl font-bold">Settings</h1>
              <p className="text-muted-foreground">Manage your account and preferences</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Profile Section */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <User className="h-5 w-5 text-primary" />
            <h2 className="font-fredoka text-xl font-semibold">Profile Information</h2>
          </div>
          
          <div className="flex items-center gap-6 mb-6">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="text-xl">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <Button
                variant="outline"
                size="sm"
                className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
              >
                <Camera className="h-3 w-3" />
              </Button>
            </div>
            <div className="space-y-2 flex-1 max-w-md">
              <Label htmlFor="avatar-url">Avatar URL</Label>
              <Input
                id="avatar-url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="display-name">Display Name</Label>
              <Input
                id="display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your display name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="flex gap-2">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Button 
                  variant="outline" 
                  onClick={handleUpdateEmail}
                  disabled={isLoading || email === user?.email}
                >
                  Update
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <Button onClick={handleUpdateProfile} disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              Save Profile
            </Button>
          </div>
        </GlassCard>

        {/* Password Section */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <Lock className="h-5 w-5 text-primary" />
            <h2 className="font-fredoka text-xl font-semibold">Change Password</h2>
          </div>
          
          <div className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <Button 
              onClick={handleUpdatePassword} 
              disabled={isLoading || !newPassword || !confirmPassword}
            >
              <Lock className="h-4 w-4 mr-2" />
              Update Password
            </Button>
          </div>
        </GlassCard>

        {/* Billing Section */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <CreditCard className="h-5 w-5 text-primary" />
            <h2 className="font-fredoka text-xl font-semibold">Billing & Subscription</h2>
          </div>
          
          <p className="text-muted-foreground mb-4">
            Manage your subscription, view billing history, and update payment methods.
          </p>

          <Button variant="outline" onClick={openCustomerPortal}>
            <CreditCard className="h-4 w-4 mr-2" />
            Open Billing Portal
          </Button>
        </GlassCard>

        {/* Preferences Section */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center">
              {isDark ? <Moon className="h-3 w-3 text-primary" /> : <Sun className="h-3 w-3 text-primary" />}
            </div>
            <h2 className="font-fredoka text-xl font-semibold">Preferences</h2>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Theme</h3>
              <p className="text-sm text-muted-foreground">Choose your preferred color scheme</p>
            </div>
            <Button variant="outline" onClick={toggleTheme}>
              {isDark ? (
                <>
                  <Sun className="h-4 w-4 mr-2" />
                  Light Mode
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4 mr-2" />
                  Dark Mode
                </>
              )}
            </Button>
          </div>
        </GlassCard>

        {/* Danger Zone */}
        <GlassCard className="p-6 border-destructive/20">
          <div className="flex items-center gap-4 mb-6">
            <Trash2 className="h-5 w-5 text-destructive" />
            <h2 className="font-fredoka text-xl font-semibold text-destructive">Danger Zone</h2>
          </div>
          
          <Separator className="mb-4" />
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Sign Out</h3>
                <p className="text-sm text-muted-foreground">Sign out of your account on this device</p>
              </div>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default Settings;