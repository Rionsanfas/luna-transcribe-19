import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { TopNavigation } from "@/components/TopNavigation";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { Pricing } from "@/components/Pricing";
import { Footer } from "@/components/Footer";
import { useEffect } from "react";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // Don't auto-redirect authenticated users anymore
  // Let them access the home page if they want

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show landing page for both authenticated and non-authenticated users

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation />
      <Hero />
      <Features />
      <Pricing />
      <Footer />
    </div>
  );
};

export default Index;
