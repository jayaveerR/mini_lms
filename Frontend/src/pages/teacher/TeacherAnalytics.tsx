import { TeacherLayout } from "@/components/layouts/TeacherLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { TrendingUp, Users, BookOpen, Target, BarChart3, Sparkles, Loader2, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { instructorService } from "@/services/instructor";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

const TeacherAnalytics = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchAnalytics(selectedCourse);
    }
  }, [selectedCourse]);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      const coursesData = await instructorService.getCourses();
      setCourses(coursesData);
      if (coursesData.length > 0) {
        setSelectedCourse(coursesData[0]._id);
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load courses",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  const fetchAnalytics = async (courseId: string) => {
    try {
      setIsLoading(true);
      const data = await instructorService.getCourseAnalytics(courseId);
      setAnalytics(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch analytics",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const overviewStats = analytics ? [
    { label: "Total Students", value: analytics.totalStudents, change: "+12%", icon: Users, color: "text-primary", bg: "bg-primary/10" },
    { label: "Course Completions", value: analytics.completedEnrollments, change: "+5%", icon: BookOpen, color: "text-accent", bg: "bg-accent/10" },
    { label: "Average Progress", value: `${Math.round(analytics.avgProgress)}%`, change: "+8%", icon: Target, color: "text-primary", bg: "bg-primary/10" },
    { label: "Completion Rate", value: `${Math.round(analytics.completionRate)}%`, change: "+2%", icon: TrendingUp, color: "text-accent", bg: "bg-accent/10" },
  ] : [];

  return (
    <TeacherLayout>
      <motion.div 
        className="space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              >
                <BarChart3 className="w-6 h-6 text-accent" />
              </motion.div>
              <h2 className="text-2xl font-bold text-foreground">Analytics</h2>
            </div>
            <p className="text-muted-foreground">
              Track student progress and course performance
            </p>
          </div>

          <div className="w-full md:w-64">
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger>
                <SelectValue placeholder="Select Course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map(course => (
                  <SelectItem key={course._id} value={course._id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-accent" />
            <p className="text-muted-foreground">Analyzing data...</p>
          </div>
        ) : analytics ? (
          <>
            {/* Overview Stats */}
            <motion.div 
              className="grid grid-cols-2 lg:grid-cols-4 gap-4"
              variants={containerVariants}
            >
              {overviewStats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={index}
                    variants={itemVariants}
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card variant="default" className="overflow-hidden relative group cursor-pointer">
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-br from-accent/5 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      />
                      <CardContent className="p-5 relative">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                            <motion.p 
                              className="text-2xl font-bold text-foreground"
                              initial={{ opacity: 0, scale: 0.5 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.2 + index * 0.1, type: "spring" }}
                            >
                              {stat.value}
                            </motion.p>
                            <motion.p 
                              className="text-xs text-primary mt-1 flex items-center gap-1"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.4 + index * 0.1 }}
                            >
                              <TrendingUp className="w-3 h-3" />
                              {stat.change} this month
                            </motion.p>
                          </div>
                          <motion.div 
                            className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}
                            whileHover={{ rotate: 10 }}
                            transition={{ type: "spring", stiffness: 300 }}
                          >
                            <Icon className={`w-5 h-5 ${stat.color}`} />
                          </motion.div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Quiz Performance */}
            <motion.div variants={itemVariants}>
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="w-5 h-5 text-accent" />
                    Quiz Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Quiz Title</th>
                          <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Attempts</th>
                          <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Avg Score</th>
                          <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Pass Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.quizStats.map((quiz: any, index: number) => (
                          <motion.tr 
                            key={quiz.quizID} 
                            className="border-b border-border/50 last:border-0"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 + index * 0.1 }}
                          >
                            <td className="py-4 px-4">
                              <p className="font-medium text-foreground">{quiz.title}</p>
                            </td>
                            <td className="py-4 px-4 text-center">{quiz.attempts}</td>
                            <td className="py-4 px-4 text-center">
                              <span className={`font-bold ${quiz.avgScore >= 80 ? "text-green-500" : "text-foreground"}`}>
                                {Math.round(quiz.avgScore)}%
                              </span>
                            </td>
                            <td className="py-4 px-4 text-center">
                              <Badge variant="outline" className="bg-primary/5">
                                {Math.round(quiz.passRate)}% Pass
                              </Badge>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Visual Charts */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card variant="glass">
                <CardHeader>
                  <CardTitle className="text-lg">Engagement Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48 flex items-end gap-2 justify-around">
                    {analytics.engagementTrend.map((val: any, i: number) => {
                      const maxCount = Math.max(...analytics.engagementTrend.map((d: any) => d.count), 1);
                      return (
                        <div key={i} className="flex flex-col items-center gap-2 w-full">
                          <motion.div 
                            className="w-full bg-accent/20 rounded-t-md relative group"
                            initial={{ height: 0 }}
                            animate={{ height: `${(val.count / maxCount) * 100}%` }}
                            transition={{ delay: i * 0.1 }}
                          >
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                              {val.count}
                            </div>
                          </motion.div>
                          <span className="text-[10px] text-muted-foreground rotate-45">{val.date}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card variant="glass">
                <CardHeader>
                  <CardTitle className="text-lg">Content Popularity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {analytics.contentPopularity.slice(0, 5).map((content: any, i: number) => {
                    const maxViews = analytics.contentPopularity[0]?.views || 1;
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="truncate max-w-[200px]">{content.title}</span>
                          <span className="text-muted-foreground">{content.views} views</span>
                        </div>
                        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-primary"
                            initial={{ width: 0 }}
                            animate={{ width: `${(content.views / maxViews) * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <div className="text-center py-20 border-2 border-dashed border-border rounded-xl">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-20" />
            <h3 className="text-lg font-medium">No data available</h3>
            <p className="text-muted-foreground">Select a course to view its performance analytics.</p>
          </div>
        )}
      </motion.div>
    </TeacherLayout>
  );
};

export default TeacherAnalytics;
