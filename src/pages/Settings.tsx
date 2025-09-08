import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ArrowLeft, Save, Upload, User, Mail, Lock, Coins } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const Settings = () => {
  const navigate = useNavigate();
  const { user, tokenBalance } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
  });
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  useEffect(() => {
    if (user) {
      setProfile({
        full_name: user.user_metadata?.full_name || "",
        email: user.email || "",
      });
    }
  }, [user]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        email: profile.email,
        data: { full_name: profile.full_name }
      });

      if (updateError) throw updateError;

      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwords.new !== passwords.confirm) {
      toast({
        title: "Password mismatch",
        description: "New password and confirm password don't match.",
        variant: "destructive",
      });
      return;
    }

    if (passwords.new.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwords.new
      });

      if (error) throw error;

      setPasswords({ current: "", new: "", confirm: "" });
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Password update failed",
        description: error.message || "Failed to update password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBillingClick = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('polar-customer-portal', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      } else {
        throw new Error('No portal URL received');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to open billing portal. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/80 backdrop-blur-md">
        <GlassCard className="rounded-none border-0">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate('/dashboard')}
                className="h-10 w-10"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="font-fredoka text-2xl font-bold text-foreground">Settings</h1>
            </div>
            <ThemeToggle />
          </div>
        </GlassCard>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Profile Section */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <User className="h-5 w-5 text-primary" />
            <h2 className="font-fredoka text-xl font-semibold text-foreground">Profile Information</h2>
          </div>

          <form onSubmit={handleProfileUpdate} className="space-y-6">
            <div className="flex items-center gap-6">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="text-2xl">
                  {profile.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Button type="button" variant="outline" size="sm" disabled>
                  <Upload className="h-4 w-4 mr-2" />
                  Change Avatar (Coming Soon)
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  Avatar upload will be available in a future update
                </p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={profile.full_name}
                  onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="Enter your full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full md:w-auto">
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </GlassCard>

        {/* Password Section */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <Lock className="h-5 w-5 text-primary" />
            <h2 className="font-fredoka text-xl font-semibold text-foreground">Change Password</h2>
          </div>

          <form onSubmit={handlePasswordUpdate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="current_password">Current Password</Label>
                <Input
                  id="current_password"
                  type="password"
                  value={passwords.current}
                  onChange={(e) => setPasswords(prev => ({ ...prev, current: e.target.value }))}
                  placeholder="Enter current password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new_password">New Password</Label>
                <Input
                  id="new_password"
                  type="password"
                  value={passwords.new}
                  onChange={(e) => setPasswords(prev => ({ ...prev, new: e.target.value }))}
                  placeholder="Enter new password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm_password">Confirm New Password</Label>
                <Input
                  id="confirm_password"
                  type="password"
                  value={passwords.confirm}
                  onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            <Button type="submit" disabled={loading || !passwords.new || !passwords.confirm} className="w-full md:w-auto">
              <Lock className="h-4 w-4 mr-2" />
              {loading ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </GlassCard>

        {/* Account Section */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <Coins className="h-5 w-5 text-primary" />
            <h2 className="font-fredoka text-xl font-semibold text-foreground">Account & Billing</h2>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium text-foreground">Token Balance</p>
                <p className="text-sm text-muted-foreground">Available tokens for processing</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">{tokenBalance}</p>
                <p className="text-sm text-muted-foreground">tokens</p>
              </div>
            </div>

            <Button onClick={handleBillingClick} className="w-full md:w-auto">
              <Mail className="h-4 w-4 mr-2" />
              Manage Billing & Subscriptions
            </Button>
          </div>
        </GlassCard>

        {/* System Info */}
        <GlassCard className="p-6">
          <div className="text-center space-y-4">
            <h3 className="font-fredoka text-lg font-semibold text-foreground">SubAI Transcription System</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our AI-powered transcription and translation system processes your audio and video files 
              with high accuracy across 25+ languages. The system uses advanced speech recognition 
              and natural language processing to deliver professional-quality subtitles.
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default Settings;