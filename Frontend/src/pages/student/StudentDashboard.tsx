import React, { useState, useEffect } from "react";
import { StudentLayout } from "@/components/layouts/StudentLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  TrendingUp,
  Clock,
  Trophy,
  ArrowRight,
  PlayCircle,
  Sparkles,
  Search,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { Link } from "react-router-dom";
import { studentService } from "@/services/student";
import { extractYouTubeId, getYouTubeThumbnail } from "@/lib/video";
import { useToast } from "@/hooks/use-toast";

declare global {
  interface Window {
    YT: {
      Player: unknown;
      PlayerState: {
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

interface Instructor {
  name: string;
}

interface Course {
  _id: string;
  title: string;
  instructor?: Instructor;
  thumbnail?: string;
  category?: string;
  modules: Module[];
}

interface EnrolledCourse extends Course {
  progress?: number;
  lastActivity?: string | Date;
  completedItems?: Set<string>;
  nextContent?: Content | null;
}

interface Content {
  _id: string;
  title: string;
  contentType: 'video' | 'quiz' | 'text' | 'pdf';
  videoURL?: string;
  quizID?: string | { _id: string };
  moduleID?: string;
}

interface Module {
  _id: string;
  contents: Content[];
}

interface DashboardStats {
  quizzesCompleted: number;
  totalCourses: number;
}

interface Option {
  text: string;
}

interface Question {
  _id: string;
  questionText: string;
  options: Option[];
}

interface Quiz {
  _id: string;
  title: string;
  questions: Question[];
}

interface Answer {
  questionId: string;
  selectedOptions: string[];
}

interface ResultDetail {
  questionText: string;
  isCorrect: boolean;
  userAnswer?: string;
  correctAnswer?: string;
}

interface QuizResult {
  score: number;
  passed: boolean;
  results: ResultDetail[];
}

// Animation variants
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

const cardHover = {
  rest: { scale: 1, y: 0 },
  hover: {
    scale: 1.02,
    y: -5,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 17
    }
  }
};

const StudentDashboard = () => {
  const { toast } = useToast();
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [recommendations, setRecommendations] = useState<Course[]>([]);
  const [continueCourse, setContinueCourse] = useState<EnrolledCourse | null>(null);
  const [activeContent, setActiveContent] = useState<Content | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [videoCompleted, setVideoCompleted] = useState(false);
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizData, setQuizData] = useState<Quiz | null>(null);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({ quizzesCompleted: 0, totalCourses: 0 });
  const [coursesWithNextContent, setCoursesWithNextContent] = useState<EnrolledCourse[]>([]);

  const fetchData = async () => {
    try {
      // Fetch enrolled courses
      const enrolledData = await studentService.getEnrolledCourses();
      const courses = enrolledData.courses || [];
      setEnrolledCourses(courses);
      if (enrolledData.stats) {
        setDashboardStats(enrolledData.stats);
      }

      // Fetch next content for each course
      const coursesWithContent = await Promise.all(courses.map(async (course: EnrolledCourse) => {
        try {
          const courseDetails = await studentService.getCourse(course._id);
          const progressData = await studentService.getCourseProgress(course._id);
          const completedSet = new Set(progressData.completedContentIds || []);

          let nextContent = null;
          let found = false;
          for (const m of courseDetails.modules) {
            for (const c of m.contents) {
              const isVideoDone = completedSet.has(c._id);
              const quizId = c.quizID?._id || c.quizID;
              const isQuizDone = quizId ? completedSet.has(quizId) : true;

              if (c.contentType === 'video' && (!isVideoDone || !isQuizDone)) {
                nextContent = { ...c, moduleID: m._id };
                found = true;
                break;
              }
            }
            if (found) break;
          }

          if (!found && courseDetails.modules.length > 0) {
            const firstModule = courseDetails.modules[0];
            nextContent = firstModule.contents.find((c: Content) => c.contentType === 'video') || null;
          }

          return {
            ...course,
            nextContent,
            completedItems: completedSet
          };
        } catch (err) {
          return course;
        }
      }));

      setCoursesWithNextContent(coursesWithContent);

      // Find most recent course to continue (for the main player)
      if (coursesWithContent.length > 0) {
        const mostRecent = [...coursesWithContent].sort((a, b) =>
          new Date(b.lastActivity || 0).getTime() - new Date(a.lastActivity || 0).getTime()
        )[0];

        setContinueCourse(mostRecent);
        setActiveContent(mostRecent.nextContent);
        setCompletedItems(mostRecent.completedItems);
      }

      // Fetch available courses for recommendations
      const allData = await studentService.getAllCourses();
      // Filter out already enrolled ones
      const enrolledIds = new Set(courses.map((c: EnrolledCourse) => c._id));
      const available = (allData.courses || []).filter((c: Course) => !enrolledIds.has(c._id));
      setRecommendations(available.slice(0, 3));

    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStartQuiz = async (quizId: string) => {
    if (!quizId) return;
    try {
      const data = await studentService.getQuiz(quizId);
      setQuizData(data.quiz);
      setShowQuiz(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load quiz. Please try again.",
        variant: "destructive"
      });
    }
  };

  const totalProgress = enrolledCourses.reduce((acc, c) => acc + (c.progress || 0), 0);
  const avgProgress = enrolledCourses.length > 0 ? Math.round(totalProgress / enrolledCourses.length) : 0;

  const stats = [
    { label: "Courses Enrolled", value: enrolledCourses.length.toString(), icon: BookOpen, color: "text-primary", bg: "bg-primary/10" },
    { label: "Overall Progress", value: `${avgProgress}%`, icon: TrendingUp, color: "text-accent", bg: "bg-accent/10" },
    { label: "Quizzes Completed", value: dashboardStats.quizzesCompleted.toString(), icon: Trophy, color: "text-primary", bg: "bg-primary/10" },
    { label: "Hours Learned", value: Math.round(totalProgress * 0.1).toString(), icon: Clock, color: "text-accent", bg: "bg-accent/10" },
  ];

  if (isLoading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <motion.div
        className="space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Welcome Message */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center gap-3 mb-2">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 1, repeat: Infinity, repeatDelay: 3 }}
            >
              <Sparkles className="w-6 h-6 text-primary" />
            </motion.div>
            <h2 className="text-2xl font-bold text-foreground">
              Welcome back!
            </h2>
          </div>
          <p className="text-muted-foreground">
            Continue your learning journey. You're doing great!
          </p>
        </motion.div>

        {/* Continue Learning Section */}
        {continueCourse && activeContent && (
          <motion.div variants={itemVariants}>
            <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-card to-primary/5">
              <div className="flex flex-col lg:flex-row">
                <div className="lg:w-2/3 aspect-video bg-black relative group">
                  {activeContent.videoURL && extractYouTubeId(activeContent.videoURL) ? (
                    <>
                      <img
                        src={getYouTubeThumbnail(activeContent.videoURL)}
                        alt={activeContent.title}
                        className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform">
                          <PlayCircle className="w-12 h-12 text-white" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full text-white">
                      <PlayCircle className="w-12 h-12 opacity-20" />
                    </div>
                  )}
                </div>
                <div className="lg:w-1/3 p-6 flex flex-col justify-center space-y-4">
                  <div>
                    <Badge variant="outline" className="mb-2 text-primary border-primary/20">Continue Learning</Badge>
                    <h3 className="text-xl font-bold line-clamp-1">{continueCourse.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      Next: {activeContent.title}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Overall Progress</span>
                      <span>{enrolledCourses.find(c => c._id === continueCourse._id)?.progress || 0}%</span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${enrolledCourses.find(c => c._id === continueCourse._id)?.progress || 0}%` }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {(() => {
                      const getQuizIdStr = (qid: string | { _id: string } | undefined): string | undefined => {
                        if (!qid) return undefined;
                        return typeof qid === 'string' ? qid : qid._id;
                      };

                      const currentQuizId = getQuizIdStr(activeContent.quizID);
                      const isQuizCompleted = currentQuizId && completedItems.has(currentQuizId);

                      return (
                        <>
                          <Button asChild className="w-full group" variant={(videoCompleted || completedItems.has(activeContent._id)) && currentQuizId && !isQuizCompleted ? "outline" : "default"}>
                            <Link to={`/student/course/${continueCourse._id}`}>
                              Go to Course
                              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                          </Button>

                          {((videoCompleted || completedItems.has(activeContent._id)) && currentQuizId && !isQuizCompleted) && (
                            <Button
                              onClick={() => handleStartQuiz(currentQuizId!)}
                              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground animate-bounce"
                            >
                              <Trophy className="mr-2 w-4 h-4" />
                              Take Quiz Now
                            </Button>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Quiz Section */}
        <AnimatePresence>
          {showQuiz && quizData && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <QuizParticipation
                quiz={quizData}
                onComplete={(result) => {
                  setQuizResult(result);
                  setShowQuiz(false);
                  if (result.passed) {
                    const newCompleted = new Set(completedItems);
                    newCompleted.add(quizData._id);
                    setCompletedItems(newCompleted);
                    fetchData(); // Refresh dashboard stats and progress
                  }
                  toast({ title: "Quiz Completed!", description: `You scored ${result.score}%` });
                }}
                onClose={() => setShowQuiz(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quiz Result Section */}
        <AnimatePresence>
          {quizResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card border-2 border-primary/20 rounded-xl p-8 space-y-6"
            >
              <div className="text-center space-y-4">
                <Trophy className="w-16 h-16 text-accent mx-auto" />
                <h3 className="text-2xl font-bold">Quiz Results</h3>
                <div className="text-4xl font-black text-primary">{quizResult.score}%</div>
                <p className="text-muted-foreground">
                  {quizResult.passed ? "Congratulations! You passed the quiz." : "Keep practicing! You can retake the quiz to improve your score."}
                </p>
              </div>

              <div className="space-y-4 mt-8">
                <h4 className="font-bold text-lg border-b pb-2">Review Answers</h4>
                <div className="grid gap-4">
                  {quizResult.results.map((res: ResultDetail, idx: number) => (
                    <div key={idx} className={`p-4 rounded-lg border ${res.isCorrect ? 'bg-green-500/5 border-green-500/20' : 'bg-destructive/5 border-destructive/20'}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <p className="font-medium">Q{idx + 1}: {res.questionText}</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 text-sm">
                            <div className="space-y-1">
                              <span className="text-muted-foreground block">Your Answer:</span>
                              <span className={res.isCorrect ? 'text-green-600 font-semibold' : 'text-destructive font-semibold'}>
                                {res.userAnswer || "No answer"}
                              </span>
                            </div>
                            {!res.isCorrect && (
                              <div className="space-y-1">
                                <span className="text-muted-foreground block">Correct Answer:</span>
                                <span className="text-green-600 font-semibold">
                                  {res.correctAnswer}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        {res.isCorrect ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-center pt-4">
                <Button onClick={() => setQuizResult(null)}>Continue Learning</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Grid */}
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          variants={containerVariants}
        >
          {stats.map((stat, index) => {
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
                    className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  />
                  <CardContent className="p-5 relative">
                    <div className="flex items-center gap-4">
                      <motion.div
                        className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`}
                        whileHover={{ rotate: 10 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <Icon className={`w-6 h-6 ${stat.color}`} />
                      </motion.div>
                      <div>
                        <motion.p
                          className="text-2xl font-bold text-foreground"
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.2 + index * 0.1, type: "spring" }}
                        >
                          {stat.value}
                        </motion.p>
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Enrolled Courses */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">My Courses</h3>
            <Button variant="ghost" size="sm" asChild className="group">
              <Link to="/student/courses">
                View all
                <motion.div
                  className="ml-1"
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight className="w-4 h-4" />
                </motion.div>
              </Link>
            </Button>
          </div>

          {enrolledCourses.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledCourses.map((course, index) => (
                <motion.div
                  key={course._id}
                  variants={itemVariants}
                  initial="rest"
                  whileHover="hover"
                  animate="rest"
                >
                  <Link to={`/student/course/${course._id}`}>
                    <motion.div variants={cardHover}>
                      <Card variant="feature" className="overflow-hidden cursor-pointer group h-full dark:shadow-none dark:border-border/50">
                        <div className="aspect-video relative overflow-hidden bg-muted">
                          <motion.img
                            src={extractYouTubeId(course.thumbnail) ? getYouTubeThumbnail(course.thumbnail) : (course.thumbnail || "https://placehold.co/600x400")}
                            alt={course.title}
                            className="w-full h-full object-cover"
                            whileHover={{ scale: 1.1 }}
                            transition={{ duration: 0.4 }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
                          <motion.div
                            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <div className="w-14 h-14 rounded-full bg-primary-foreground/90 flex items-center justify-center shadow-lg">
                              <PlayCircle className="w-8 h-8 text-primary fill-current" />
                            </div>
                          </motion.div>
                        </div>
                        <CardContent className="p-5">
                          <h4 className="font-semibold text-foreground mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                            {course.title}
                          </h4>
                          <p className="text-sm text-muted-foreground mb-4">
                            {course.instructor?.name || "Instructor"}
                          </p>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Progress</span>
                              <span className="font-medium text-foreground">{course.progress || 0}%</span>
                            </div>
                            <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
                              <motion.div
                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-accent rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${course.progress || 0}%` }}
                                transition={{ duration: 1, delay: 0.3 + index * 0.1, ease: "easeOut" }}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No courses enrolled yet</h3>
              <p className="text-muted-foreground mb-4">Explore our catalog to start learning!</p>
              <Button asChild>
                <Link to="/student/courses">Browse Courses</Link>
              </Button>
            </div>
          )}
        </motion.div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <motion.div variants={itemVariants}>
            <Card variant="glass" className="overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Recommended for You
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-3 gap-4">
                  {recommendations.map((rec, index) => (
                    <motion.div
                      key={index}
                      className="p-4 rounded-xl bg-secondary/50 cursor-pointer"
                      whileHover={{
                        scale: 1.03,
                        backgroundColor: "hsl(var(--secondary))",
                        transition: { duration: 0.2 }
                      }}
                      whileTap={{ scale: 0.98 }}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                    >
                      <Link to={`/student/courses`}>
                        <motion.p
                          className="text-xs text-primary font-medium mb-1"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.6 + index * 0.1 }}
                        >
                          {rec.category}
                        </motion.p>
                        <p className="font-medium text-foreground line-clamp-1">{rec.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{rec.instructor?.name}</p>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </StudentLayout>
  );
};

export default StudentDashboard;

const QuizParticipation = ({ quiz, onComplete, onClose }: { quiz: Quiz, onComplete: (result: QuizResult) => void, onClose: () => void }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime] = useState(Date.now());

  const handleOptionSelect = (questionId: string, optionIndex: number) => {
    const newAnswers = [...answers];
    const existingIndex = newAnswers.findIndex(a => a.questionId === questionId);
    if (existingIndex > -1) {
      newAnswers[existingIndex].selectedOptions = [optionIndex.toString()];
    } else {
      newAnswers.push({ questionId, selectedOptions: [optionIndex.toString()] });
    }
    setAnswers(newAnswers);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      const result = await studentService.submitQuiz(quiz._id, answers, timeSpent);
      onComplete(result.attempt);
    } catch (error) {
      console.error("Failed to submit quiz", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const question = quiz.questions[currentQuestion];
  const selectedOption = answers.find(a => a.questionId === question._id)?.selectedOptions[0];

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{quiz.title}</CardTitle>
          <p className="text-sm text-muted-foreground">Question {currentQuestion + 1} of {quiz.questions.length}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h4 className="text-lg font-medium">{question.questionText}</h4>
          <div className="grid gap-3">
            {question.options.map((option: Option, index: number) => (
              <Button
                key={index}
                variant={selectedOption === index.toString() ? "default" : "outline"}
                className="justify-start h-auto py-4 px-6 text-left"
                onClick={() => handleOptionSelect(question._id, index)}
              >
                <span className="mr-4 w-6 h-6 rounded-full border flex items-center justify-center text-xs">
                  {String.fromCharCode(65 + index)}
                </span>
                {option.text}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            disabled={currentQuestion === 0}
            onClick={() => setCurrentQuestion(prev => prev - 1)}
          >
            Previous
          </Button>
          {currentQuestion === quiz.questions.length - 1 ? (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || answers.length < quiz.questions.length}
            >
              {isSubmitting ? "Submitting..." : "Finish Quiz"}
            </Button>
          ) : (
            <Button
              disabled={!selectedOption}
              onClick={() => setCurrentQuestion(prev => prev + 1)}
            >
              Next Question
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
