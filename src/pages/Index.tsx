import { TopNavigation } from "@/components/TopNavigation";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { Pricing } from "@/components/Pricing";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background relative">
      <TopNavigation />
      <div className="pt-24"> {/* Add padding for fixed nav */}
        <Hero />
        <section id="features">
          <Features />
        </section>
        <section id="pricing">
          <Pricing />
        </section>
        <Footer />
      </div>
    </div>
  );
};

export default Index;
