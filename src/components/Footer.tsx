import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Github, Twitter, Mail, Heart } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="py-16 px-4 relative">
      <div className="max-w-7xl mx-auto">
        <GlassCard variant="default" className="text-center">
          <div className="mb-8">
            <h2 className="font-fredoka text-3xl font-bold mb-2 text-foreground">SubAI</h2>
            <p className="text-muted-foreground">
              Transform voice to professional subtitles with AI
            </p>
          </div>

          <div className="flex justify-center gap-4 mb-8">
            <Button variant="ghost" size="sm" className="rounded-full">
              <Github className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="rounded-full">
              <Twitter className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="rounded-full">
              <Mail className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8 text-sm">
            <div>
              <h4 className="font-fredoka font-semibold mb-3 text-foreground">Product</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">API</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Documentation</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-fredoka font-semibold mb-3 text-foreground">Company</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-fredoka font-semibold mb-3 text-foreground">Support</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Status</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Community</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-fredoka font-semibold mb-3 text-foreground">Legal</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
                <li><a href="/terms" className="hover:text-foreground transition-colors">Terms of Service</a></li>
                <li><a href="/refund" className="hover:text-foreground transition-colors">Refund Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>© 2024 SubAI. Made with</span>
              <Heart className="h-3 w-3 text-red-500" />
              <span>using AI technology</span>
            </div>
            <div>
              <span>Powered by OpenAI & Polar.sh</span>
            </div>
          </div>
        </GlassCard>
      </div>
    </footer>
  );
};