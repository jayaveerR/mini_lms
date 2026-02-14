import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeatureCarousel } from "@/components/landing/FeatureCarousel";
import { AboutSection } from "@/components/landing/AboutSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { RoleSplitSection } from "@/components/landing/RoleSplitSection";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <FeatureCarousel />
        <AboutSection />
        <HowItWorks />
        <RoleSplitSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
