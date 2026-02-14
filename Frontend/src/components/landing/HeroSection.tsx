import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export const HeroSection = () => {
  return (
    <section id="home" className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      {/* Subtle decorative elements */}
      <div className="absolute top-1/4 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-10 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />

      <div className="container-wide px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-6"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">AI-Powered Learning</span>
          </motion.div>

          {/* Headline - smaller font when centered */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight mb-6"
          >
            The Future of{" "}
            <span className="gradient-text">Intelligent Learning</span>{" "}
            Starts Here
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-base md:text-lg text-muted-foreground mb-10 leading-relaxed max-w-2xl mx-auto"
          >
            Experience personalized education with AI-driven insights, interactive courses, 
            and seamless collaboration between instructors and students.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          >
            <Button variant="hero" size="xl" asChild>
              <Link to="/login?role=student">
                Start Learning
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button variant="hero-outline" size="xl" asChild>
              <Link to="/login?role=teacher">
                Start Teaching
              </Link>
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex items-center justify-center gap-8 md:gap-12"
          >
            <div>
              <p className="text-2xl md:text-3xl font-bold text-foreground">10K+</p>
              <p className="text-sm text-muted-foreground">Active Students</p>
            </div>
            <div className="w-px h-12 bg-border" />
            <div>
              <p className="text-2xl md:text-3xl font-bold text-foreground">500+</p>
              <p className="text-sm text-muted-foreground">Expert Instructors</p>
            </div>
            <div className="w-px h-12 bg-border" />
            <div>
              <p className="text-2xl md:text-3xl font-bold text-foreground">1,200+</p>
              <p className="text-sm text-muted-foreground">Courses</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
