import { TopNavigation } from "@/components/TopNavigation";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { Pricing } from "@/components/Pricing";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background relative">
      <TopNavigation />
      <div className="pt-20 md:pt-24"> {/* Responsive padding for fixed nav */}
        {/* Hero Section */}
        <Hero />
        
        {/* Features Section */}
        <section id="features">
          <Features />
        </section>
        
        {/* Pricing Section */}
        <section id="pricing">
          <Pricing />
        </section>
        
        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default Index;
