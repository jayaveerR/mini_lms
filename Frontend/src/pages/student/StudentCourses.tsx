import { StudentLayout } from "@/components/layouts/StudentLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { Search, PlayCircle, Clock, BookOpen, Sparkles, PlusCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { studentService } from "@/services/student";
import { toast } from "@/hooks/use-toast";
import { extractYouTubeId, getYouTubeThumbnail } from "@/lib/video";

interface Instructor {
  name: string;
}

interface Course {
  _id: string;
  title: string;
  description: string;
  instructor?: Instructor;
  thumbnail?: string;
  category?: string;
}

interface EnrolledCourse extends Course {
  progress?: number;
}

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
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 12
    }
  }
};

const StudentCourses = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [catalogCourses, setCatalogCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const enrolledData = await studentService.getEnrolledCourses();
      const allData = await studentService.getAllCourses();

      const enrolled = enrolledData.courses || [];
      const enrolledIds = new Set(enrolled.map((c: EnrolledCourse) => c._id));

      const available = (allData.courses || []).filter((c: Course) => !enrolledIds.has(c._id));

      setEnrolledCourses(enrolled);
      setCatalogCourses(available);
    } catch (error) {
      console.error("Failed to fetch courses", error);
      toast({
        title: "Error",
        description: "Failed to load courses. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEnroll = async (courseId: string) => {
    try {
      await studentService.enrollCourse(courseId);
      toast({
        title: "Success",
        description: "Enrolled in course successfully!",
      });
      // Refresh data
      fetchData();
    } catch (error: unknown) {
      // safe to use any here for error object from axios/fetch usually
      const err = error as { response?: { data?: { message?: string } } };
      toast({
        title: "Enrollment Failed",
        description: err.response?.data?.message || "Could not enroll in course.",
        variant: "destructive"
      });
    }
  };

  const filterCourses = <T extends Course>(courses: T[]): T[] => {
    return courses.filter(course =>
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (course.instructor?.name || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  return (
    <StudentLayout>
      <motion.div
        className="space-y-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <BookOpen className="w-6 h-6 text-primary" />
              </motion.div>
              <h2 className="text-2xl font-bold text-foreground">Learning Center</h2>
            </div>
            <p className="text-muted-foreground">
              Manage your enrollments and discover new content
            </p>
          </motion.div>

          {/* Search */}
          <motion.div
            className="relative w-full md:w-72"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 transition-all focus:ring-2 focus:ring-primary/20"
            />
          </motion.div>
        </div>

        <Tabs defaultValue="enrolled" className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="enrolled">My Enrollments</TabsTrigger>
            <TabsTrigger value="catalog">Course Catalog</TabsTrigger>
          </TabsList>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <TabsContent value="enrolled">
                <AnimatePresence mode="popLayout">
                  {enrolledCourses.length > 0 ? (
                    <motion.div
                      className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {filterCourses(enrolledCourses).map((course, index) => (
                        <motion.div
                          key={course._id}
                          variants={itemVariants}
                          layout
                        >
                          <Card variant="feature" className="overflow-hidden cursor-pointer group h-full flex flex-col dark:shadow-none dark:border-border/50">
                            <div className="aspect-video relative overflow-hidden bg-muted">
                              <img
                                src={extractYouTubeId(course.thumbnail) ? getYouTubeThumbnail(course.thumbnail) : (course.thumbnail || "https://placehold.co/600x400")}
                                alt={course.title}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                              />
                              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                            </div>
                            <CardContent className="p-5 flex-1 flex flex-col">
                              <h4 className="font-semibold text-foreground mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                                {course.title}
                              </h4>
                              <p className="text-sm text-muted-foreground mb-4">
                                {course.instructor?.name || "Instructor"}
                              </p>

                              <div className="mt-auto space-y-3">
                                <div className="space-y-1">
                                  <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Progress</span>
                                    <span>{course.progress || 0}%</span>
                                  </div>
                                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                                    <motion.div
                                      className="h-full bg-primary rounded-full"
                                      initial={{ width: 0 }}
                                      animate={{ width: `${course.progress || 0}%` }}
                                      transition={{ duration: 0.5 }}
                                    />
                                  </div>
                                </div>
                                <Button className="w-full" asChild>
                                  <a href={`/student/course/${course._id}`}>Continue Learning</a>
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : (
                    <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
                      <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">No active enrollments</h3>
                      <p className="text-muted-foreground mb-4">Check the Course Catalog to find new courses!</p>
                    </div>
                  )}
                </AnimatePresence>
              </TabsContent>

              <TabsContent value="catalog">
                <AnimatePresence mode="popLayout">
                  {catalogCourses.length > 0 ? (
                    <motion.div
                      className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {filterCourses(catalogCourses).map((course, index) => (
                        <motion.div
                          key={course._id}
                          variants={itemVariants}
                          layout
                        >
                          <Card className="overflow-hidden h-full flex flex-col border-border/50 hover:border-primary/50 transition-colors dark:shadow-none">
                            <div className="aspect-video relative overflow-hidden bg-muted">
                              <img
                                src={extractYouTubeId(course.thumbnail) ? getYouTubeThumbnail(course.thumbnail) : (course.thumbnail || "https://placehold.co/600x400")}
                                alt={course.title}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute top-2 right-2 bg-background/90 backdrop-blur px-2 py-1 rounded text-xs font-medium">
                                {course.category}
                              </div>
                            </div>
                            <CardContent className="p-5 flex-1 flex flex-col">
                              <h4 className="font-semibold text-foreground mb-2 line-clamp-1">
                                {course.title}
                              </h4>
                              <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1">
                                {course.description}
                              </p>
                              <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50">
                                <span className="text-xs text-muted-foreground">
                                  By {course.instructor?.name || "Unknown"}
                                </span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-2"
                                  onClick={() => handleEnroll(course._id)}
                                >
                                  <PlusCircle className="w-4 h-4" />
                                  Enroll Now
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      No courses available in the catalog right now.
                    </div>
                  )}
                </AnimatePresence>
              </TabsContent>
            </>
          )}
        </Tabs>
      </motion.div>
    </StudentLayout>
  );
};

export default StudentCourses;
