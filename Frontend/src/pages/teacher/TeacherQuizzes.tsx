import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TeacherLayout } from "@/components/layouts/TeacherLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, FileQuestion, Search, Filter, Loader2, Trash2, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { instructorService } from "@/services/instructor";
import { toast } from "@/hooks/use-toast";

interface Quiz {
  _id: string;
  title: string;
  questions: any[];
  totalAttempts?: number;
  avgScore?: number;
  createdAt: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
};

const TeacherQuizzes = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const data = await instructorService.getQuizzes();
        setQuizzes(data);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch quizzes",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuizzes();
  }, []);

  const handleDeleteQuiz = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this quiz?")) return;
    try {
      await instructorService.deleteQuiz(id);
      setQuizzes(quizzes.filter((q) => q._id !== id));
      toast({ title: "Success", description: "Quiz deleted successfully" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete quiz",
        variant: "destructive",
      });
    }
  };

  const filteredQuizzes = quizzes.filter((quiz) =>
    quiz.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <TeacherLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout>
      <motion.div
        className="space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Quizzes
            </h1>
            <p className="text-muted-foreground mt-1">
              Create and manage quizzes for your courses
            </p>
          </div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link to="/instructor/quiz/create">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Quiz
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Search and Filter */}
        <motion.div variants={itemVariants} className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search quizzes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
        </motion.div>

        {/* Stats Summary */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Quizzes", value: quizzes.length },
            { label: "Total Questions", value: quizzes.reduce((sum, q) => sum + (q.questions?.length || 0), 0) },
            { label: "Total Attempts", value: quizzes.reduce((sum, q) => sum + (q.totalAttempts || 0), 0) },
            { label: "Avg Score", value: quizzes.length > 0 ? `${Math.round(quizzes.reduce((sum, q) => sum + (q.avgScore || 0), 0) / quizzes.length)}%` : "-" },
          ].map((stat) => (
            <Card key={stat.label} className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <FileQuestion className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Quiz List */}
        <div className="grid gap-4">
          {filteredQuizzes.map((quiz) => (
            <motion.div key={quiz._id} variants={itemVariants}>
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-primary/10 text-primary">
                      <FileQuestion className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{quiz.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {quiz.questions?.length || 0} Questions • Created on {new Date(quiz.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" asChild>
                      <Link to={`/instructor/quiz/${quiz._id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteQuiz(quiz._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {filteredQuizzes.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <FileQuestion className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            </motion.div>
            <h3 className="text-xl font-semibold text-foreground mb-2">No quizzes yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {searchQuery
                ? "No quizzes match your search. Try a different query."
                : "Create your first quiz to test your students' knowledge and track their progress."}
            </p>
            {!searchQuery && (
              <Link to="/instructor/quiz/create">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Your First Quiz
                </Button>
              </Link>
            )}
          </motion.div>
        )}
      </motion.div>
    </TeacherLayout>
  );
};

export default TeacherQuizzes;
