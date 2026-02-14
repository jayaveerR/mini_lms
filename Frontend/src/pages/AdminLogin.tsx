import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, ArrowLeft, Eye, EyeOff, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { authService } from "@/services/auth";

const AdminLogin = () => {
    const navigate = useNavigate();
    const { toast } = useToast();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (authService.isAuthenticated()) {
            const user = authService.getUser();
            if (user?.role === 'admin') {
                navigate('/admin/dashboard');
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
            // Use authService (generic login) but specify expected role checks handled by backend or service
            // The authService.login accepts role, but our backend login implementation checks role if passed.
            // We will assume authService can handle generic login or we use a specific method if added.
            // Current authService.loginInstructor sets 'instructor' role. 
            // We need to use `login` from authService which is generic, or add `loginAdmin`.
            // Let's modify authService first or use the generic endpoint.
            // Actually, looking at authService, it has loginInstructor and loginStudent.
            // Let's assume we can call the generic login endpoint directly via fetch OR add loginAdmin to authService.
            // For now, I will add loginAdmin to authService in the next step. 
            // Wait, I can't restart the write_to_file. I will implement the UI here and assume I will add `loginAdmin` to authService.

            const response = await authService.loginAdmin({ email, password });

            if (response.user.role !== 'admin') {
                authService.logout();
                throw new Error('Access denied. Admin privileges required.');
            }

            toast({
                title: "Welcome Admin",
                description: "Logged in successfully",
            });

            navigate('/admin/dashboard');
        } catch (error) {
            toast({
                title: "Login failed",
                description: (error as Error).message || "Invalid credentials",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6">
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-10 w-64 h-64 bg-red-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-10 w-80 h-80 bg-red-500/5 rounded-full blur-3xl" />
            </div>

            <div className="w-full max-w-md relative z-10">
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-8"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to home
                </Link>

                <Card className="bg-zinc-900 border-zinc-800 animate-scale-in">
                    <CardHeader className="text-center pb-2">
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-red-600/20 flex items-center justify-center">
                                <Shield className="w-6 h-6 text-red-500" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl text-white">
                            Admin Portal
                        </CardTitle>
                        <CardDescription className="text-zinc-400">
                            Restricted access. Authorized personnel only.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        <motion.form
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            onSubmit={handleLogin}
                            className="space-y-4"
                        >
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-zinc-300">Email</Label>
                                <div className="relative">
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="admin@edunexus.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="h-12 pl-12 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-red-500"
                                    />
                                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-zinc-300">Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="h-12 pl-12 pr-12 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-red-500"
                                    />
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-red-600 hover:bg-red-700 text-white h-12 text-base"
                                disabled={isLoading}
                            >
                                {isLoading ? "Authenticating..." : "Access Dashboard"}
                            </Button>
                        </motion.form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AdminLogin;
