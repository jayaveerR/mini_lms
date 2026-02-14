import { useState, useEffect } from "react";
import { StudentLayout } from "@/components/layouts/StudentLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { 
  TrendingUp, 
  BookOpen, 
  Target, 
  Award, 
  Sparkles, 
  Zap, 
  Calendar,
  ChevronRight,
  CheckCircle2,
  Clock,
  User,
  RefreshCw,
  CheckCircle
} from "lucide-react";
import { studentService } from "@/services/student";
import { authService, User as AuthUser } from "@/services/auth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface CourseProgress {
  id: string;
  title: string;
  category: string;
  progress: number;
  lastActivity: string;
}

interface QuizAttempt {
  id: string;
  quizTitle: string;
  courseTitle: string;
  score: number;
  passed: boolean;
  date: string;
}

interface Achievement {
  title: string;
  icon: string;
  earned: boolean;
}

interface ReportStats {
  totalCourses: number;
  completedCourses: number;
  avgProgress: number;
  totalQuizzes: number;
  avgQuizScore: number;
}

interface ProgressReport {
  stats: ReportStats;
  courses: CourseProgress[];
  quizAttempts: QuizAttempt[];
  achievements: Achievement[];
}

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

const StudentProgress = () => {
  const [report, setReport] = useState<ProgressReport | null>(null);
  const [loading, setLoading] = useState(true);
  const user = authService.getUser();
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchReport = async () => {
    try {
      setLoading(true);
      const data = await studentService.getProgressReport();
      setReport(data.report);
    } catch (error) {
      console.error("Failed to fetch report", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleCompleteCourse = async (courseId: string) => {
    try {
      await studentService.completeCourse(courseId);
      toast({ title: "Success", description: "Course marked as completed!" });
      fetchReport();
    } catch (error) {
      toast({ title: "Error", description: "Failed to complete course", variant: "destructive" });
    }
  };

  const handleResetCourse = async (courseId: string) => {
    if (!window.confirm("Are you sure you want to reset all progress for this course? This cannot be undone.")) return;
    try {
      await studentService.resetCourseProgress(courseId);
      toast({ title: "Success", description: "Course progress reset. You can start over!" });
      fetchReport();
    } catch (error) {
      toast({ title: "Error", description: "Failed to reset course", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </StudentLayout>
    );
  }

  if (!report) return null;

  const { stats, courses, quizAttempts, achievements } = report;

  const getGrade = (score: number) => {
    if (score >= 90) return { label: "A+", color: "text-green-500" };
    if (score >= 80) return { label: "A", color: "text-green-400" };
    if (score >= 70) return { label: "B", color: "text-blue-500" };
    if (score >= 60) return { label: "C", color: "text-yellow-500" };
    return { label: "D", color: "text-orange-500" };
  };

  const grade = getGrade(stats.avgQuizScore);

  return (
    <StudentLayout>
      <motion.div 
        className="max-w-6xl mx-auto space-y-8 pb-12"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Report Card Header */}
        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden border-none shadow-2xl bg-gradient-to-br from-primary/10 via-background to-accent/10">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="relative">
                  <div className="w-32 h-32 rounded-2xl bg-primary/20 flex items-center justify-center border-4 border-background shadow-xl">
                    <User className="w-16 h-16 text-primary" />
                  </div>
                  <motion.div 
                    className="absolute -bottom-2 -right-2 w-12 h-12 rounded-xl bg-background shadow-lg flex items-center justify-center border-2 border-primary/20"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Award className="w-6 h-6 text-primary" />
                  </motion.div>
                </div>
                
                <div className="flex-1 text-center md:text-left space-y-2">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                    <h1 className="text-3xl font-black tracking-tight">{user?.name || "Student"}</h1>
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                      Active Learner
                    </Badge>
                  </div>
                  <p className="text-muted-foreground max-w-md">
                    Your academic performance and learning milestones for the current semester.
                  </p>
                  <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      Joined {new Date(user?.createdAt || Date.now()).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {stats.totalCourses} Courses Enrolled
                    </div>
                  </div>
                </div>

                <div className="text-center px-8 py-4 bg-background/50 backdrop-blur-sm rounded-3xl border border-white/10 shadow-inner">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Overall Grade</p>
                  <motion.span 
                    className={`text-6xl font-black ${grade.color}`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.5 }}
                  >
                    {grade.label}
                  </motion.span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Avg Progress", value: `${stats.avgProgress}%`, icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-500/10" },
            { label: "Avg Quiz Score", value: `${stats.avgQuizScore}%`, icon: Target, color: "text-purple-500", bg: "bg-purple-500/10" },
            { label: "Completed", value: stats.completedCourses, icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10" },
            { label: "Quizzes Taken", value: stats.totalQuizzes, icon: Zap, color: "text-yellow-500", bg: "bg-yellow-500/10" },
          ].map((stat, idx) => (
            <motion.div key={idx} variants={itemVariants}>
              <Card className="border-none shadow-lg hover:shadow-xl transition-all group overflow-hidden">
                <CardContent className="p-6 relative">
                  <div className={`absolute top-0 right-0 w-24 h-24 ${stat.bg} rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110`} />
                  <stat.icon className={`w-5 h-5 ${stat.color} mb-4 relative`} />
                  <h3 className="text-2xl font-bold relative">{stat.value}</h3>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider relative">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Course Progress List */}
          <motion.div className="lg:col-span-2 space-y-6" variants={itemVariants}>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Course Performance
              </h3>
            </div>
            <div className="grid gap-4">
              {courses.map((course, idx) => (
                <Card key={idx} className="group hover:border-primary/50 transition-colors overflow-hidden">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-bold group-hover:text-primary transition-colors">{course.title}</h4>
                        <p className="text-xs text-muted-foreground">{course.category}</p>
                      </div>
                      <Badge variant={course.progress === 100 ? "default" : "secondary"} className={course.progress === 100 ? "bg-green-500" : ""}>
                        {course.progress === 100 ? "Completed" : "In Progress"}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-medium">
                        <span>Completion</span>
                        <span>{course.progress}%</span>
                      </div>
                      <Progress value={course.progress} className="h-2" />
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 text-xs h-8"
                        onClick={() => navigate(`/student/course/${course.id}`)}
                      >
                        View Course
                      </Button>
                      {course.progress < 100 && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs h-8 border-green-500/50 text-green-600 hover:bg-green-50"
                          onClick={() => handleCompleteCourse(course.id)}
                        >
                          <CheckCircle className="w-3 h-3 mr-1" /> Complete
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-xs h-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleResetCourse(course.id)}
                      >
                        <RefreshCw className="w-3 h-3 mr-1" /> Reset
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>

          {/* Sidebar: Achievements & Recent Quizzes */}
          <div className="space-y-8">
            {/* Achievements */}
            <motion.div variants={itemVariants} className="space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                Milestones
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {achievements.map((ach, idx) => (
                  <Card key={idx} className={`border-none shadow-md ${ach.earned ? 'bg-primary/5' : 'opacity-40 grayscale'}`}>
                    <CardContent className="p-4 text-center space-y-2">
                      <div className={`w-10 h-10 rounded-full mx-auto flex items-center justify-center ${ach.earned ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                        {ach.icon === "BookOpen" && <BookOpen className="w-5 h-5" />}
                        {ach.icon === "Award" && <Award className="w-5 h-5" />}
                        {ach.icon === "Target" && <Target className="w-5 h-5" />}
                        {ach.icon === "Zap" && <Zap className="w-5 h-5" />}
                      </div>
                      <p className="text-[10px] font-bold uppercase leading-tight">{ach.title}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>

            {/* Recent Quizzes */}
            <motion.div variants={itemVariants} className="space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Recent Quizzes
              </h3>
              <div className="space-y-3">
                {quizAttempts.slice(0, 4).map((quiz, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-3 rounded-xl bg-card border hover:border-primary/30 transition-all group">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${quiz.passed ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                      {quiz.score}%
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{quiz.quizTitle}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{quiz.courseTitle}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </StudentLayout>
  );
};

export default StudentProgress;
