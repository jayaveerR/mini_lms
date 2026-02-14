import { CheckCircle2 } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const problems = [
  "One-size-fits-all curriculum",
  "Lack of real-time progress tracking",
  "Disconnected learning resources",
  "Limited teacher-student interaction"
];

const solutions = [
  "AI-personalized learning paths",
  "Real-time analytics and insights",
  "Unified content management",
  "Seamless collaboration tools"
];

export const AboutSection = () => {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.4 }
    }
  };

  const solutionItemVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.4 }
    }
  };

  return (
    <section id="about" className="section-padding" ref={sectionRef}>
      <div className="container-narrow">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Why EduNexus?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Traditional LMS platforms fail to adapt to individual needs. 
            We're changing that with intelligent, personalized learning.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 lg:gap-20">
          {/* Problem */}
          <motion.div 
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
          >
            <motion.div 
              className="inline-flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive rounded-full text-sm font-medium"
              variants={itemVariants}
            >
              The Problem
            </motion.div>
            <div className="space-y-4">
              {problems.map((problem, index) => (
                <motion.div 
                  key={index} 
                  className="flex items-start gap-3 p-4 bg-secondary/50 rounded-xl"
                  variants={itemVariants}
                >
                  <div className="w-2 h-2 rounded-full bg-destructive mt-2" />
                  <p className="text-muted-foreground">{problem}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Solution */}
          <motion.div 
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
          >
            <motion.div 
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium"
              variants={solutionItemVariants}
            >
              Our Solution
            </motion.div>
            <div className="space-y-4">
              {solutions.map((solution, index) => (
                <motion.div 
                  key={index} 
                  className="flex items-start gap-3 p-4 bg-primary/5 rounded-xl border border-primary/10"
                  variants={solutionItemVariants}
                >
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <p className="text-foreground font-medium">{solution}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
