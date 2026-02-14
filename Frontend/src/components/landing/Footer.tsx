import { Link } from "react-router-dom";

const quickLinks = [
  { name: "Home", href: "/" },
  { name: "About", href: "#about" },
  { name: "Features", href: "#features" },
  { name: "Student Login", href: "/login?role=student" },
  { name: "Instructor Login", href: "/login?role=teacher" },
];

export const Footer = () => {
  return (
    <footer className="bg-foreground text-primary-foreground">
      <div className="container-wide px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary-foreground flex items-center justify-center">
                <span className="text-foreground font-bold text-lg">E</span>
              </div>
              <span className="font-bold text-xl">EduNexus</span>
            </Link>
            <p className="text-primary-foreground/70 text-sm leading-relaxed">
              Intelligent Learning Management System powered by AI. 
              Transforming education one learner at a time.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  {link.href.startsWith("#") ? (
                    <a 
                      href={link.href} 
                      className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm"
                    >
                      {link.name}
                    </a>
                  ) : (
                    <Link 
                      to={link.href} 
                      className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm"
                    >
                      {link.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Academic Project Note */}
          <div>
            <h4 className="font-semibold mb-4">About This Project</h4>
            <p className="text-primary-foreground/70 text-sm leading-relaxed">
              EduNexus is an academic final-year project demonstrating 
              modern LMS capabilities with AI integration. Built with 
              React, TypeScript, and Tailwind CSS.
            </p>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-primary-foreground/50 text-sm">
            © {new Date().getFullYear()} EduNexus. All rights reserved.
          </p>
          <p className="text-primary-foreground/50 text-sm">
            Academic Project • Built with passion for education
          </p>
        </div>
      </div>
    </footer>
  );
};
