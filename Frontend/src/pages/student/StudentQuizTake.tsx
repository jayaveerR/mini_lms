import { useState, useEffect, useCallback } from "react";
import { StudentLayout } from "@/components/layouts/StudentLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  Trophy,
  Sparkles,
  RotateCcw,
  Home,
  CheckCircle,
  RefreshCw
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { studentService } from "@/services/student";
import { useToast } from "@/hooks/use-toast";

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
  courseID: string;
  questions: Question[];
  timeLimit?: number;
  passingPercentage: number;
}

interface Answer {
  questionId: string;
  selectedOptions: string[];
}

interface ResultDetail {
  questionID: string;
  isCorrect: boolean;
  userAnswer?: string;
  correctAnswer?: string;
}

interface AttemptResult {
  score: number;
  passed: boolean;
  timeSpent: number;
  results: ResultDetail[];
}

const questionVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
    scale: 0.9
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 30
    }
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
    scale: 0.9,
    transition: { duration: 0.2 }
  })
};

const optionVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: 0.1 + i * 0.1,
      type: "spring" as const,
      stiffness: 100,
      damping: 12
    }
  })
};

const StudentQuizTake = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [direction, setDirection] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20 * 60);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    const fetchQuiz = async () => {
      if (!id) return;
      try {
        const data = await studentService.getQuiz(id);
        setQuiz(data.quiz);

        // If there's an existing attempt, show it
        if (data.attempt) {
          setResult(data.attempt);
          setShowResult(true);
          setIsCompleted(true);
        } else {
          setTimeLeft((data.quiz.timeLimit || 20) * 60);
        }

      } catch (error) {
        toast({ title: "Error", description: "Failed to load quiz", variant: "destructive" });
        navigate(-1);
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuiz();
  }, [id, navigate, toast]);

  const submitQuiz = useCallback(async () => {
    if (!id || isCompleted) return;
    setIsCompleted(true);
    try {
      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      const data = await studentService.submitQuiz(id, answers, timeSpent);
      setResult(data.attempt);
      setShowResult(true);
    } catch (error) {
      toast({ title: "Error", description: "Failed to submit quiz", variant: "destructive" });
      setIsCompleted(false);
    }
  }, [id, isCompleted, answers, startTime, toast]);

  // Timer
  useEffect(() => {
    if (isCompleted || !quiz) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          submitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isCompleted, quiz, submitQuiz]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswer = (optionIndex: number) => {
    if (isCompleted || !quiz) return;
    const questionId = quiz.questions[currentQuestion]._id;
    const newAnswers = [...answers];
    const existingIndex = newAnswers.findIndex(a => a.questionId === questionId);

    if (existingIndex > -1) {
      newAnswers[existingIndex].selectedOptions = [optionIndex.toString()];
    } else {
      newAnswers.push({ questionId, selectedOptions: [optionIndex.toString()] });
    }
    setAnswers(newAnswers);
  };

  const goToQuestion = (index: number) => {
    setDirection(index > currentQuestion ? 1 : -1);
    setCurrentQuestion(index);
  };

  const nextQuestion = () => {
    if (quiz && currentQuestion < quiz.questions.length - 1) {
      setDirection(1);
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setDirection(-1);
      setCurrentQuestion(currentQuestion - 1);
    }
  };



  if (isLoading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </StudentLayout>
    );
  }

  if (!quiz) return null;

  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;
  const answeredCount = answers.length;

  const handleCompleteCourse = async () => {
    try {
      await studentService.completeCourse(quiz.courseID);
      toast({ title: "Success", description: "Course marked as completed!" });
      navigate('/student/my-courses');
    } catch (error) {
      toast({ title: "Error", description: "Failed to complete course", variant: "destructive" });
    }
  };

  const handleResetCourse = async () => {
    if (!window.confirm("Are you sure you want to reset all progress for this course? This cannot be undone.")) return;
    try {
      await studentService.resetCourseProgress(quiz.courseID);
      toast({ title: "Success", description: "Course progress reset. You can start over!" });
      navigate(`/student/course/${quiz.courseID}`);
    } catch (error) {
      toast({ title: "Error", description: "Failed to reset course", variant: "destructive" });
    }
  };

  if (showResult && result) {
    const score = result.score;
    const passed = result.passed;

    return (
      <StudentLayout>
        <motion.div
          className="max-w-2xl mx-auto"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card variant="elevated" className="overflow-hidden">
            <CardContent className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              >
                {passed ? (
                  <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                    <Trophy className="w-12 h-12 text-primary" />
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
                    <RotateCcw className="w-12 h-12 text-accent" />
                  </div>
                )}
              </motion.div>

              <motion.h2
                className="text-2xl font-bold text-foreground mb-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {passed ? "Congratulations!" : "Keep Learning!"}
              </motion.h2>

              <motion.p
                className="text-muted-foreground mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {passed
                  ? "You've successfully completed the quiz!"
                  : "You can review and try again to improve your score."}
              </motion.p>

              <motion.div
                className="relative w-32 h-32 mx-auto mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="hsl(var(--secondary))"
                    strokeWidth="12"
                    fill="none"
                  />
                  <motion.circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke={passed ? "hsl(var(--primary))" : "hsl(var(--accent))"}
                    strokeWidth="12"
                    fill="none"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: score / 100 }}
                    transition={{ duration: 1.5, delay: 0.6, ease: "easeOut" }}
                    style={{
                      strokeDasharray: "352",
                      strokeDashoffset: "0"
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.span
                    className={`text-3xl font-bold ${passed ? 'text-primary' : 'text-accent'}`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1, type: "spring" }}
                  >
                    {score}%
                  </motion.span>
                </div>
              </motion.div>

              <motion.div
                className="flex items-center justify-center gap-4 mb-8 text-sm text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>Time Spent: {formatTime(result.timeSpent)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Passing Score: {quiz.passingPercentage}%</span>
                </div>
              </motion.div>

              {/* Question Results */}
              <motion.div
                className="grid grid-cols-5 gap-2 mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                {quiz.questions.map((q: Question, index: number) => {
                  const isCorrect = result.results.find((r: ResultDetail) => r.questionID === q._id)?.isCorrect;
                  return (
                    <motion.div
                      key={index}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${isCorrect
                        ? 'bg-primary/10 text-primary'
                        : 'bg-destructive/10 text-destructive'
                        }`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.9 + index * 0.1, type: "spring" }}
                    >
                      {isCorrect ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <XCircle className="w-5 h-5" />
                      )}
                    </motion.div>
                  );
                })}
              </motion.div>

              <motion.div
                className="flex flex-wrap gap-4 justify-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
              >
                <Button variant="outline" onClick={() => navigate(`/student/course/${quiz.courseID}`)}>
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back to Course
                </Button>

                <Button variant="default" className="bg-green-600 hover:bg-green-700" onClick={handleCompleteCourse}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Complete Course
                </Button>

                <Button variant="secondary" onClick={handleResetCourse}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Re-attempt Course
                </Button>

                {!passed && (
                  <Button
                    variant="accent"
                    onClick={() => {
                      setAnswers([]);
                      setCurrentQuestion(0);
                      setTimeLeft((quiz.timeLimit || 20) * 60);
                      setIsCompleted(false);
                      setShowResult(false);
                    }}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                )}
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <motion.div
        className="max-w-3xl mx-auto space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Header */}
        <motion.div
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h1 className="text-xl font-bold text-foreground">{quiz.title}</h1>
          </div>
          <motion.div
            className={`flex items-center gap-2 px-4 py-2 rounded-full ${timeLeft < 60 ? 'bg-destructive/10 text-destructive' : 'bg-secondary'
              }`}
            animate={timeLeft < 60 ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 0.5, repeat: timeLeft < 60 ? Infinity : 0 }}
          >
            <Clock className="w-4 h-4" />
            <span className="font-mono font-semibold">{formatTime(timeLeft)}</span>
          </motion.div>
        </motion.div>

        {/* Progress */}
        <motion.div
          className="space-y-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Question {currentQuestion + 1} of {quiz.questions.length}
            </span>
            <span className="text-muted-foreground">
              {answeredCount} answered
            </span>
          </div>
          <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-accent rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </motion.div>

        {/* Question Navigation Dots */}
        <motion.div
          className="flex flex-wrap gap-2 justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {quiz.questions.map((q: Question, index: number) => {
            const isAnswered = answers.some(a => a.questionId === q._id);
            return (
              <motion.button
                key={index}
                onClick={() => goToQuestion(index)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${index === currentQuestion
                  ? 'bg-primary text-primary-foreground'
                  : isAnswered
                    ? 'bg-primary/20 text-primary'
                    : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                  }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {index + 1}
              </motion.button>
            );
          })}
        </motion.div>

        {/* Question Card */}
        <div className="relative overflow-hidden min-h-[400px]">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentQuestion}
              custom={direction}
              variants={questionVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full"
            >
              <Card variant="elevated">
                <CardContent className="p-6 sm:p-8">
                  <motion.h3
                    className="text-lg sm:text-xl font-semibold text-foreground mb-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    {quiz.questions[currentQuestion].questionText}
                  </motion.h3>

                  <div className="space-y-3">
                    {quiz.questions[currentQuestion].options.map((option: Option, index: number) => {
                      const isSelected = answers.find(a => a.questionId === quiz.questions[currentQuestion]._id)?.selectedOptions[0] === index.toString();
                      return (
                        <motion.button
                          key={index}
                          custom={index}
                          variants={optionVariants}
                          initial="hidden"
                          animate="visible"
                          onClick={() => handleAnswer(index)}
                          className={`w-full p-4 rounded-xl text-left transition-all border-2 ${isSelected
                            ? 'border-primary bg-primary/10 text-foreground'
                            : 'border-border bg-card hover:border-primary/50 hover:bg-secondary/50 text-foreground'
                            }`}
                          whileHover={{ scale: 1.02, x: 5 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex items-center gap-3">
                            <motion.div
                              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isSelected
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-secondary text-muted-foreground'
                                }`}
                              animate={isSelected ? { scale: [1, 1.2, 1] } : {}}
                              transition={{ duration: 0.3 }}
                            >
                              {String.fromCharCode(65 + index)}
                            </motion.div>
                            <span className="flex-1">{option.text}</span>
                            {isSelected && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 500 }}
                              >
                                <CheckCircle2 className="w-5 h-5 text-primary" />
                              </motion.div>
                            )}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <motion.div
          className="flex items-center justify-between"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              onClick={prevQuestion}
              disabled={currentQuestion === 0}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
          </motion.div>

          {currentQuestion === quiz.questions.length - 1 ? (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="accent"
                onClick={submitQuiz}
                disabled={answeredCount < quiz.questions.length}
                className="relative"
              >
                {answeredCount === quiz.questions.length && (
                  <motion.span
                    className="absolute -top-1 -right-1"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  >
                    <Sparkles className="w-4 h-4 text-accent" />
                  </motion.span>
                )}
                Submit Quiz
              </Button>
            </motion.div>
          ) : (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="default" onClick={nextQuestion}>
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </StudentLayout>
  );
};

export default StudentQuizTake;
