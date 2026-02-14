import { TeacherLayout } from "@/components/layouts/TeacherLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Search, User, TrendingUp, Clock, MoreVertical, Users, Sparkles, Mail, BookOpen, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { instructorService } from "@/services/instructor";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 12
    }
  }
};

const TeacherStudents = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();

  useEffect(() => {
    fetchStudents();
  }, [searchQuery, statusFilter]);

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      const data = await instructorService.getStudents(searchQuery, statusFilter);
      setStudents(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch students",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default" className="bg-green-500/10 text-green-500 border-0">Active</Badge>;
      case "at-risk":
        return <Badge variant="default" className="bg-red-500/10 text-red-500 border-0">At Risk</Badge>;
      case "completed":
        return <Badge variant="default" className="bg-blue-500/10 text-blue-500 border-0">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <TeacherLayout>
      <motion.div 
        className="space-y-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <motion.div 
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Users className="w-6 h-6 text-accent" />
              </motion.div>
              <h2 className="text-2xl font-bold text-foreground">Students</h2>
            </div>
            <p className="text-muted-foreground">
              Monitor and manage your enrolled students
            </p>
          </div>
          <motion.p 
            className="text-sm text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-full"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            {students.length} total students
          </motion.p>
        </motion.div>

        {/* Filters */}
        <motion.div 
          className="flex flex-col md:flex-row gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name or email..." 
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {["all", "active", "at-risk", "completed"].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? "accent" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(status)}
                className="capitalize"
              >
                {status.replace("-", " ")}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Students List */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-accent" />
            <p className="text-muted-foreground">Loading students...</p>
          </div>
        ) : students.length > 0 ? (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {students.map((student) => (
              <motion.div key={student._id} variants={itemVariants}>
                <Card className="group hover:shadow-lg transition-all border-border/50 overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-lg">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{student.name}</CardTitle>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Mail className="w-3 h-3" />
                            {student.email}
                          </div>
                        </div>
                      </div>
                      {getStatusBadge(student.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" /> Average Progress
                        </span>
                        <span className="font-medium">{Math.round(student.avgProgress)}%</span>
                      </div>
                      <Progress value={student.avgProgress} className="h-1.5" />
                    </div>

                    <div className="pt-2 flex items-center justify-between text-xs text-muted-foreground border-t border-border/50 mt-4">
                      <div className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        {student.enrollmentCount} Courses
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Active {new Date(student.lastActivity).toLocaleDateString()}
                      </div>
                    </div>

                    <Button variant="outline" className="w-full mt-2 group-hover:bg-accent group-hover:text-white transition-colors">
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-20 border-2 border-dashed border-border rounded-xl">
            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-20" />
            <h3 className="text-lg font-medium">No students found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters</p>
          </div>
        )}
      </motion.div>
    </TeacherLayout>
  );
};

export default TeacherStudents;
