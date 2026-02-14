import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Trophy,
  Target,
} from "lucide-react";

interface Option {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  text: string;
  options: Option[];
  points: number;
}

interface QuizSettings {
  title: string;
  description: string;
  timeLimit: number;
  passingScore: number;
  shuffleQuestions: boolean;
  showResults: boolean;
}

interface QuizPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: Question[];
  settings: QuizSettings;
}

const QuizPreviewModal = ({
  isOpen,
  onClose,
  questions,
  settings,
}: QuizPreviewModalProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(settings.timeLimit * 60);
  const [showResults, setShowResults] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setTimeRemaining(settings.timeLimit * 60);
      setShowResults(false);
      setQuizStarted(false);
    }
  }, [isOpen, settings.timeLimit]);

  useEffect(() => {
    if (!quizStarted || showResults) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setShowResults(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quizStarted, showResults]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSelectAnswer = (optionId: string) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestion.id]: optionId,
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = () => {
    setShowResults(true);
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setTimeRemaining(settings.timeLimit * 60);
    setShowResults(false);
    setQuizStarted(false);
  };

  const calculateScore = () => {
    let earnedPoints = 0;
    questions.forEach((question) => {
      const selectedOptionId = selectedAnswers[question.id];
      const selectedOption = question.options.find((o) => o.id === selectedOptionId);
      if (selectedOption?.isCorrect) {
        earnedPoints += question.points;
      }
    });
    return earnedPoints;
  };

  const getCorrectAnswersCount = () => {
    return questions.filter((question) => {
      const selectedOptionId = selectedAnswers[question.id];
      const selectedOption = question.options.find((o) => o.id === selectedOptionId);
      return selectedOption?.isCorrect;
    }).length;
  };

  const score = calculateScore();
  const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
  const passed = percentage >= settings.passingScore;

  if (!currentQuestion) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-3xl max-h-[90vh] overflow-y-auto"
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{settings.title || "Quiz Preview"}</span>
            {quizStarted && !showResults && (
              <motion.div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                  timeRemaining < 60
                    ? "bg-destructive/10 text-destructive"
                    : "bg-muted text-muted-foreground"
                }`}
                animate={timeRemaining < 60 ? { scale: [1, 1.05, 1] } : {}}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                <Clock className="h-4 w-4" />
                {formatTime(timeRemaining)}
              </motion.div>
            )}
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {!quizStarted ? (
            <motion.div
              key="start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="py-8 text-center space-y-6"
            >
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">
                  {settings.title || "Untitled Quiz"}
                </h2>
                {settings.description && (
                  <p className="text-muted-foreground">{settings.description}</p>
                )}
              </div>

              <div className="flex justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  <span>{questions.length} Questions</span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-500" />
                  <span>{totalPoints} Points</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span>{settings.timeLimit} Minutes</span>
                </div>
              </div>

              <div className="pt-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Pass score: {settings.passingScore}%
                </p>
                <Button onClick={() => setQuizStarted(true)} size="lg">
                  Start Quiz Preview
                </Button>
              </div>
            </motion.div>
          ) : showResults ? (
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="py-6 space-y-6"
            >
              {/* Score Circle */}
              <div className="flex flex-col items-center">
                <motion.div
                  className={`relative w-32 h-32 rounded-full flex items-center justify-center ${
                    passed ? "bg-green-500/10" : "bg-destructive/10"
                  }`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                >
                  <motion.div
                    className="absolute inset-2 rounded-full border-4"
                    style={{
                      borderColor: passed ? "rgb(34 197 94)" : "hsl(var(--destructive))",
                    }}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: percentage / 100 }}
                  />
                  <div className="text-center">
                    <motion.span
                      className="text-3xl font-bold"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      {percentage}%
                    </motion.span>
                    <p className="text-xs text-muted-foreground">Score</p>
                  </div>
                </motion.div>

                <motion.div
                  className={`mt-4 px-4 py-2 rounded-full font-medium ${
                    passed
                      ? "bg-green-500/10 text-green-500"
                      : "bg-destructive/10 text-destructive"
                  }`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  {passed ? "Quiz Passed!" : "Quiz Failed"}
                </motion.div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold text-foreground">{score}</p>
                  <p className="text-xs text-muted-foreground">Points Earned</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold text-foreground">
                    {getCorrectAnswersCount()}/{questions.length}
                  </p>
                  <p className="text-xs text-muted-foreground">Correct</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold text-foreground">
                    {formatTime(settings.timeLimit * 60 - timeRemaining)}
                  </p>
                  <p className="text-xs text-muted-foreground">Time Taken</p>
                </div>
              </div>

              {/* Question Review */}
              {settings.showResults && (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  <h3 className="font-medium text-foreground">Question Review</h3>
                  {questions.map((question, index) => {
                    const selectedOptionId = selectedAnswers[question.id];
                    const selectedOption = question.options.find(
                      (o) => o.id === selectedOptionId
                    );
                    const correctOption = question.options.find((o) => o.isCorrect);
                    const isCorrect = selectedOption?.isCorrect;

                    return (
                      <motion.div
                        key={question.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`p-3 rounded-lg border ${
                          isCorrect
                            ? "border-green-500/30 bg-green-500/5"
                            : "border-destructive/30 bg-destructive/5"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {isCorrect ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                          ) : (
                            <XCircle className="h-5 w-5 text-destructive mt-0.5" />
                          )}
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">
                              Q{index + 1}: {question.text}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Your answer: {selectedOption?.text || "Not answered"}
                            </p>
                            {!isCorrect && (
                              <p className="text-xs text-green-500 mt-1">
                                Correct: {correctOption?.text}
                              </p>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {isCorrect ? question.points : 0}/{question.points} pts
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-center gap-3 pt-4">
                <Button variant="outline" onClick={handleRestart} className="gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Try Again
                </Button>
                <Button onClick={onClose}>Close Preview</Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="quiz"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </span>
                  <span className="text-muted-foreground">
                    {currentQuestion.points} points
                  </span>
                </div>
                <Progress
                  value={((currentQuestionIndex + 1) / questions.length) * 100}
                  className="h-2"
                />
              </div>

              {/* Question */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQuestion.id}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <h3 className="text-lg font-medium text-foreground">
                    {currentQuestion.text}
                  </h3>

                  <div className="space-y-3">
                    {currentQuestion.options.map((option, index) => {
                      const isSelected = selectedAnswers[currentQuestion.id] === option.id;

                      return (
                        <motion.button
                          key={option.id}
                          onClick={() => handleSelectAnswer(option.id)}
                          className={`w-full p-4 rounded-lg border text-left transition-all ${
                            isSelected
                              ? "border-primary bg-primary/10"
                              : "border-border hover:border-primary/50 hover:bg-muted/50"
                          }`}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                                isSelected
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border"
                              }`}
                            >
                              {String.fromCharCode(65 + index)}
                            </div>
                            <span className="text-foreground">{option.text}</span>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-4 border-t border-border/30">
                <Button
                  variant="outline"
                  onClick={handlePrev}
                  disabled={currentQuestionIndex === 0}
                  className="gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                {/* Question indicators */}
                <div className="hidden sm:flex gap-1">
                  {questions.map((q, index) => (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQuestionIndex(index)}
                      className={`w-8 h-8 rounded-full text-xs font-medium transition-all ${
                        index === currentQuestionIndex
                          ? "bg-primary text-primary-foreground"
                          : selectedAnswers[q.id]
                          ? "bg-green-500/20 text-green-500 border border-green-500/30"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>

                {currentQuestionIndex === questions.length - 1 ? (
                  <Button onClick={handleSubmit} className="gap-2">
                    Submit Quiz
                    <CheckCircle2 className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button onClick={handleNext} className="gap-2">
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default QuizPreviewModal;
