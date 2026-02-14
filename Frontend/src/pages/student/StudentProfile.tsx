import { StudentLayout } from "@/components/layouts/StudentLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { User, Mail, BookOpen, Trophy, Calendar, Edit2, Camera, Loader2, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { authService } from "@/services/auth";
import { studentService } from "@/services/student";
import { useToast } from "@/hooks/use-toast";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 12
    }
  }
};

const StudentProfile = () => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    createdAt: ""
  });
  const [stats, setStats] = useState([
    { label: "Courses Enrolled", value: "0", icon: BookOpen },
    { label: "Quizzes Completed", value: "0", icon: Trophy },
    { label: "Member Since", value: "-", icon: Calendar },
  ]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [userData, reportData] = await Promise.all([
        authService.getProfile(),
        studentService.getProgressReport()
      ]);

      setProfile({
        name: userData.name || "",
        email: userData.email || "",
        createdAt: userData.createdAt || ""
      });

      if (reportData && reportData.report) {
        const { stats: s } = reportData.report;
        setStats([
          { label: "Courses Enrolled", value: s.totalCourses.toString(), icon: BookOpen },
          { label: "Quizzes Completed", value: s.totalQuizzes.toString(), icon: Trophy },
          { label: "Member Since", value: new Date(userData.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), icon: Calendar },
        ]);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch profile data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await authService.updateProfile({ name: profile.name });
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <motion.div 
        className="max-w-3xl mx-auto space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center gap-3 mb-2">
            <User className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">My Profile</h2>
          </div>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </motion.div>

        {/* Profile Card */}
        <motion.div variants={itemVariants}>
          <Card variant="elevated" className="overflow-hidden">
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <motion.div 
                  className="relative"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-12 h-12 text-primary" />
                  </div>
                  <motion.button 
                    className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Camera className="w-4 h-4" />
                  </motion.button>
                </motion.div>

                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-xl font-bold text-foreground">{profile.name}</h3>
                  <p className="text-muted-foreground">{profile.email}</p>
                  <p className="text-sm text-primary mt-1">Student</p>
                </div>

                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  {isEditing ? (
                    <Button 
                      onClick={handleSave}
                      disabled={saving}
                      className="gap-2"
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Save Changes
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      onClick={() => setIsEditing(true)}
                      className="gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit Profile
                    </Button>
                  )}
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats */}
        <motion.div 
          className="grid grid-cols-3 gap-4"
          variants={containerVariants}
        >
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ scale: 1.05, y: -3 }}
              >
                <Card variant="default" className="cursor-pointer">
                  <CardContent className="p-4 text-center">
                    <Icon className="w-6 h-6 text-primary mx-auto mb-2" />
                    <p className="text-xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Profile Form */}
        <motion.div variants={itemVariants}>
          <Card variant="feature">
            <CardContent className="p-6 space-y-4">
              <h4 className="font-semibold text-foreground mb-4">Personal Information</h4>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm text-muted-foreground">Full Name</label>
                  <Input 
                    value={profile.name} 
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    disabled={!isEditing}
                    className="transition-all"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm text-muted-foreground">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      value={profile.email} 
                      disabled
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </StudentLayout>
  );
};

export default StudentProfile;
