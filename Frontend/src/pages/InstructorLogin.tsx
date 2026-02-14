import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { BookMarked, ArrowLeft, Eye, EyeOff, User, Mail, Building, GraduationCap, Upload, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { authService } from "@/services/auth";

const InstructorLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");

  // Additional fields for instructor request
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [institution, setInstitution] = useState("");
  const [department, setDepartment] = useState("");
  const [message, setMessage] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);



  useEffect(() => {
    if (authService.isAuthenticated()) {
      const user = authService.getUser();
      if (user?.role === 'instructor') {
        navigate('/instructor/dashboard');
      } else if (user?.role === 'student') {
        navigate('/student/dashboard');
      }
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
        title: "Missing fields",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const data = await authService.loginInstructor({
        email,
        password,
      });

      if (data.user.role !== 'instructor') {
        authService.logout();
        toast({
          title: "Access denied",
          description: "This login is for instructors only. Please use the student login.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Welcome back!",
        description: `Logged in as ${data.user.name || 'Instructor'}`,
      });

      navigate('/instructor/dashboard');
    } catch (error) {
      toast({
        title: "Login failed",
        description: (error as Error).message || "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match",
        variant: "destructive",
      });
      return;
    }

    if (!agreeTerms) {
      toast({
        title: "Terms required",
        description: "Please agree to the Instructor Terms & Conditions",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await authService.requestInstructorAccess({
        name,
        email,
        password,
        institution,
        department,
        message,
      });

      setRequestSubmitted(true);
      toast({
        title: "Request submitted!",
        description: "Your instructor access request has been sent for review.",
      });
    } catch (error) {
      toast({
        title: "Request failed",
        description: (error as Error).message || "Failed to submit request",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (requestSubmitted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-10 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-10 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md relative z-10"
        >
          <Card className="bg-black border-zinc-800 text-center">
            <CardContent className="pt-12 pb-8 space-y-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white">Request Submitted!</h2>
                <p className="text-zinc-400">
                  Your instructor access request has been submitted successfully.
                </p>
              </div>

              <div className="bg-zinc-800/50 rounded-lg p-4 text-left space-y-2">
                <p className="text-sm text-zinc-300">
                  <strong>What happens next?</strong>
                </p>
                <ul className="text-sm text-zinc-400 space-y-1 list-disc list-inside">
                  <li>Our admin team will review your application</li>
                  <li>Review typically takes 24-48 hours</li>
                  <li>You'll receive an email notification once approved</li>
                </ul>
              </div>

              <div className="space-y-3 pt-4">
                <Button
                  variant="outline"
                  className="w-full border-zinc-700 text-white hover:bg-zinc-800"
                  onClick={() => {
                    setRequestSubmitted(false);
                    setIsSignUp(false);
                    setName("");
                    setEmail("");
                    setPassword("");
                    setConfirmPassword("");
                    setInstitution("");
                    setDepartment("");
                    setMessage("");
                    setAgreeTerms(false);
                  }}
                >
                  Back to Login
                </Button>

                <Link to="/">
                  <Button variant="ghost" className="w-full text-zinc-400 hover:text-white">
                    Return to Home
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 ${isSignUp ? 'bg-black' : 'bg-gradient-hero'}`}>
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className={`absolute top-1/4 left-10 w-64 h-64 ${isSignUp ? 'bg-accent/10' : 'bg-accent/5'} rounded-full blur-3xl`} />
        <div className={`absolute bottom-1/4 right-10 w-80 h-80 ${isSignUp ? 'bg-primary/10' : 'bg-accent/10'} rounded-full blur-3xl`} />
      </div>

      <div className={`w-full ${isSignUp ? 'max-w-lg' : 'max-w-md'} relative z-10`}>
        <Link
          to={isSignUp ? "#" : "/"}
          onClick={isSignUp ? (e) => { e.preventDefault(); setIsSignUp(false); } : undefined}
          className={`inline-flex items-center gap-2 ${isSignUp ? 'text-zinc-400 hover:text-white' : 'text-muted-foreground hover:text-foreground'} transition-colors mb-8`}
        >
          <ArrowLeft className="w-4 h-4" />
          {isSignUp ? "Back to Login" : "Back to home"}
        </Link>

        <Card className={`animate-scale-in overflow-hidden ${isSignUp ? 'bg-zinc-900 border-zinc-800' : 'variant-elevated'}`}>
          <CardHeader className="text-center pb-2">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className={`w-12 h-12 rounded-xl ${isSignUp ? 'bg-accent' : 'bg-accent'} flex items-center justify-center`}>
                <BookMarked className="w-6 h-6 text-accent-foreground" />
              </div>
            </div>
            <CardTitle className={`text-2xl ${isSignUp ? 'text-white' : ''}`}>
              {isSignUp ? "Request Instructor Access" : "Instructor Login"}
            </CardTitle>
            <CardDescription className={isSignUp ? 'text-zinc-400' : ''}>
              {isSignUp
                ? "Apply to become an instructor on EduNexus"
                : "Access your teaching dashboard"
              }
            </CardDescription>
            {isSignUp && (
              <p className="text-xs text-zinc-500 mt-2">
                Your request will be reviewed by our admin team within 24-48 hours. You'll receive an email notification once approved.
              </p>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            <AnimatePresence mode="wait">
              {isSignUp ? (
                <motion.form
                  key="signup"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleRequestAccess}
                  className="space-y-4"
                >
                  {/* Full Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-zinc-300">
                      Full Name <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="name"
                        type="text"
                        placeholder="Dr. John Smith"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="h-12 pl-12 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                      />
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-zinc-300">
                      Email Address <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="john.smith@university.edu"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-12 pl-12 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                      />
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-zinc-300">
                      Password <span className="text-red-500">*</span>
                    </Label>
                    <p className="text-xs text-zinc-500">Minimum 8 characters</p>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-12 pr-12 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-zinc-300">
                      Confirm Password <span className="text-red-500">*</span>
                    </Label>
                    <p className="text-xs text-zinc-500">Re-enter your password</p>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="h-12 pr-12 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Institution */}
                  <div className="space-y-2">
                    <Label htmlFor="institution" className="text-zinc-300">
                      Institution/Organization (Optional)
                    </Label>
                    <div className="relative">
                      <Input
                        id="institution"
                        type="text"
                        placeholder="Stanford University"
                        value={institution}
                        onChange={(e) => setInstitution(e.target.value)}
                        className="h-12 pl-12 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                      />
                      <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    </div>
                  </div>

                  {/* Department */}
                  <div className="space-y-2">
                    <Label htmlFor="department" className="text-zinc-300">
                      Department (Optional)
                    </Label>
                    <div className="relative">
                      <Input
                        id="department"
                        type="text"
                        placeholder="Computer Science"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="h-12 pl-12 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                      />
                      <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    </div>
                  </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-zinc-300">
                      Brief Message (Why do you want to teach?)
                    </Label>
                    <Textarea
                      id="message"
                      placeholder="Tell us about your teaching experience and what you'd like to teach on EduNexus..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="min-h-[100px] bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 resize-none"
                    />
                  </div>

                  {/* Terms Checkbox */}
                  <div className="flex items-start space-x-3 pt-2">
                    <Checkbox
                      id="terms"
                      checked={agreeTerms}
                      onCheckedChange={(checked) => setAgreeTerms(checked as boolean)}
                      className="mt-1 border-zinc-600 data-[state=checked]:bg-accent data-[state=checked]:border-accent"
                    />
                    <Label htmlFor="terms" className="text-sm text-zinc-400 leading-relaxed cursor-pointer">
                      I agree to the{" "}
                      <span className="text-accent hover:underline">Instructor Terms & Conditions</span>
                      {" "}and understand that my account will be reviewed before activation
                      <span className="text-red-500"> *</span>
                    </Label>
                  </div>

                  <Button
                    type="submit"
                    variant="accent"
                    size="lg"
                    className="w-full mt-6"
                    disabled={isLoading}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {isLoading ? "Submitting..." : "Submit Access Request"}
                  </Button>
                </motion.form>
              ) : (
                <motion.form
                  key="login"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleLogin}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-12 pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="accent"
                    size="lg"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing in..." : "Sign in as Instructor"}
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>

            <div className="space-y-3">
              <p className={`text-center text-sm ${isSignUp ? 'text-zinc-400' : 'text-muted-foreground'}`}>
                {isSignUp ? "Already approved?" : "Want to become an instructor?"}{" "}
                <button
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-accent hover:underline font-medium"
                >
                  {isSignUp ? "Login as Instructor" : "Request Access"}
                </button>
              </p>

              <p className={`text-center text-sm ${isSignUp ? 'text-zinc-400' : 'text-muted-foreground'}`}>
                Are you a student?{" "}
                <Link to="/student/login" className="text-primary hover:underline font-medium">
                  Student Login
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InstructorLogin;
