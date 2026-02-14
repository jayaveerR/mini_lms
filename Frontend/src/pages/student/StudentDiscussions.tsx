import { StudentLayout } from "@/components/layouts/StudentLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageCircle, 
  Search, 
  ThumbsUp, 
  MessageSquare, 
  Loader2, 
  ChevronDown, 
  ChevronUp, 
  Send, 
  Pin, 
  CheckCircle2, 
  Lock,
  Trash2,
  Star,
  MoreVertical
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";
import { studentService } from "@/services/student";
import { authService } from "@/services/auth";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

interface Discussion {
  _id: string;
  title: string;
  content: string;
  authorID: { _id: string; name: string; role: string };
  courseID: string;
  status: 'OPEN' | 'RESOLVED' | 'CLOSED';
  isPinned: boolean;
  acceptedAnswerId?: string;
  replies: {
    _id: string;
    authorID: { _id: string; name: string; role: string };
    content: string;
    isHelpful: string[];
    isInstructorEndorsed: boolean;
    createdAt: string;
  }[];
  likes: string[];
  isHot: boolean;
  createdAt: string;
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

const StudentDiscussions = () => {
  const { toast } = useToast();
  const currentUser = authService.getUser();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);
  const [newDiscussion, setNewDiscussion] = useState({ title: "", content: "" });
  const [submitting, setSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchDiscussions(selectedCourse);
    }
  }, [selectedCourse]);

  const fetchCourses = async () => {
    try {
      const data = await studentService.getEnrolledCourses();
      // The backend returns { success: true, courses: [...] }
      const enrolledCourses = data.courses || [];
      setCourses(enrolledCourses);
      if (enrolledCourses.length > 0) {
        setSelectedCourse(enrolledCourses[0]._id);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch courses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDiscussions = async (courseId: string) => {
    try {
      const data = await studentService.getDiscussions(courseId);
      setDiscussions(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch discussions",
        variant: "destructive",
      });
    }
  };

  const handleCreateDiscussion = async () => {
    if (!newDiscussion.title || !newDiscussion.content) return;
    setSubmitting(true);
    try {
      await studentService.createDiscussion(selectedCourse, newDiscussion.title, newDiscussion.content);
      toast({ title: "Success", description: "Discussion created!" });
      setShowNewModal(false);
      setNewDiscussion({ title: "", content: "" });
      fetchDiscussions(selectedCourse);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create discussion",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddReply = async (discussionId: string) => {
    if (!replyContent) return;
    try {
      await studentService.addReply(discussionId, replyContent);
      setReplyContent("");
      fetchDiscussions(selectedCourse);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add reply",
        variant: "destructive",
      });
    }
  };

  const handleLike = async (discussionId: string) => {
    try {
      await studentService.toggleLike(discussionId);
      fetchDiscussions(selectedCourse);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to like",
        variant: "destructive",
      });
    }
  };

  const handleToggleHelpful = async (discussionId: string, replyId: string) => {
    try {
      await studentService.toggleHelpful(discussionId, replyId);
      fetchDiscussions(selectedCourse);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async (discussionId: string, replyId?: string) => {
    if (!window.confirm(`Are you sure you want to delete your ${replyId ? 'reply' : 'discussion'}?`)) return;
    
    try {
      if (replyId) {
        await studentService.deleteReply(discussionId, replyId);
      } else {
        await studentService.deleteDiscussion(discussionId);
      }
      fetchDiscussions(selectedCourse);
      toast({ title: "Success", description: `${replyId ? 'Reply' : 'Discussion'} deleted` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const filteredDiscussions = discussions.filter(d =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        className="space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <MessageCircle className="w-6 h-6 text-primary" />
              </motion.div>
              <h2 className="text-2xl font-bold text-foreground">Discussions</h2>
            </div>
            <p className="text-muted-foreground">
              Connect with fellow students and get help
            </p>
          </div>
          <div className="flex items-center gap-4">
            <select 
              className="bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
            >
              {courses?.map(course => (
                <option key={course._id} value={course._id}>{course.title}</option>
              ))}
            </select>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="accent" onClick={() => setShowNewModal(true)}>
                <MessageSquare className="w-4 h-4" />
                New Discussion
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div 
          className="relative max-w-md"
          variants={itemVariants}
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search discussions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 h-12"
          />
        </motion.div>

        {/* New Discussion Modal (Simple Inline) */}
        <AnimatePresence>
          {showNewModal && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <Card className="border-primary/50 bg-primary/5">
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-bold">Start a New Discussion</h3>
                  <Input 
                    placeholder="Discussion Title" 
                    value={newDiscussion.title}
                    onChange={(e) => setNewDiscussion({...newDiscussion, title: e.target.value})}
                  />
                  <Textarea 
                    placeholder="What's on your mind?" 
                    value={newDiscussion.content}
                    onChange={(e) => setNewDiscussion({...newDiscussion, content: e.target.value})}
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setShowNewModal(false)}>Cancel</Button>
                    <Button onClick={handleCreateDiscussion} disabled={submitting}>
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post Discussion"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Discussions List */}
        <motion.div className="space-y-4" variants={containerVariants}>
          {(!filteredDiscussions || filteredDiscussions.length === 0) ? (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center">
                <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                <p className="text-muted-foreground">No discussions found for this course.</p>
              </CardContent>
            </Card>
          ) : (
            filteredDiscussions.map((discussion) => (
              <motion.div key={discussion._id} variants={itemVariants}>
                <Card className={`hover:border-primary/50 transition-colors ${discussion.isPinned ? 'border-primary/30 bg-primary/5' : ''}`}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {discussion.isPinned && (
                            <Badge variant="default" className="bg-primary text-primary-foreground gap-1">
                              <Pin className="w-3 h-3" /> Pinned
                            </Badge>
                          )}
                          <h3 className="text-lg font-bold text-foreground">{discussion.title}</h3>
                          {discussion.isHot && (
                            <Badge variant="secondary" className="bg-orange-500/10 text-orange-500 border-orange-500/20">
                              Hot
                            </Badge>
                          )}
                          {discussion.status === 'RESOLVED' && (
                            <Badge variant="outline" className="text-green-500 border-green-500/20 bg-green-500/5 gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Resolved
                            </Badge>
                          )}
                          {discussion.status === 'CLOSED' && (
                            <Badge variant="outline" className="text-muted-foreground border-muted-foreground/20 bg-muted/5 gap-1">
                              <Lock className="w-3 h-3" /> Closed
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Posted by <span className="text-primary font-medium">{discussion.authorID?.name || 'Unknown'}</span> 
                          {discussion.authorID?.role === 'instructor' && <Badge variant="outline" className="ml-2 text-[10px] py-0 h-4">Instructor</Badge>}
                          • {new Date(discussion.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      {currentUser && discussion.authorID?._id === currentUser.id && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(discussion._id)}>
                              <Trash2 className="w-4 h-4 mr-2" /> Delete Discussion
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                    
                    <p className="text-foreground/80 mb-6 line-clamp-2">{discussion.content}</p>

                    <div className="flex items-center justify-between pt-4 border-t border-border/50">
                      <div className="flex items-center gap-6">
                        <button 
                          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                          onClick={() => handleLike(discussion._id)}
                        >
                          <ThumbsUp className={`w-4 h-4 ${currentUser && discussion.likes?.includes(currentUser.id) ? "fill-primary text-primary" : ""}`} />
                          {discussion.likes?.length || 0}
                        </button>
                        <button 
                          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                          onClick={() => setExpandedId(expandedId === discussion._id ? null : discussion._id)}
                        >
                          <MessageSquare className="w-4 h-4" />
                          {discussion.replies?.length || 0} Replies
                          {expandedId === discussion._id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Replies Section */}
                    <AnimatePresence>
                      {expandedId === discussion._id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-6 space-y-4 overflow-hidden"
                        >
                          <div className="space-y-4 pl-4 border-l-2 border-primary/20">
                            {discussion.replies?.map((reply) => (
                              <div key={reply._id} className={`p-3 rounded-lg ${discussion.acceptedAnswerId === reply._id ? 'bg-green-500/10 border border-green-500/20' : 'bg-muted/30'} ${reply.isInstructorEndorsed ? 'border-l-4 border-l-purple-500' : ''}`}>
                                <div className="flex justify-between items-center mb-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-primary">{reply.authorID?.name || 'Unknown'}</span>
                                    {reply.authorID?.role === 'instructor' && <Badge variant="outline" className="text-[10px] py-0 h-4">Instructor</Badge>}
                                    {discussion.acceptedAnswerId === reply._id && (
                                      <Badge variant="default" className="bg-green-500 text-white text-[10px] py-0 h-4">Accepted Answer</Badge>
                                    )}
                                    {reply.isInstructorEndorsed && (
                                      <Badge variant="secondary" className="bg-purple-500 text-white text-[10px] py-0 h-4 gap-1"><Star className="w-2 h-2" /> Endorsed</Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button 
                                      className={`flex items-center gap-1 text-[10px] transition-colors ${currentUser && reply.isHelpful?.includes(currentUser.id) ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
                                      onClick={() => handleToggleHelpful(discussion._id, reply._id)}
                                    >
                                      <ThumbsUp className={`w-3 h-3 ${currentUser && reply.isHelpful?.includes(currentUser.id) ? 'fill-primary' : ''}`} />
                                      Helpful ({reply.isHelpful?.length || 0})
                                    </button>
                                    {currentUser && reply.authorID?._id === currentUser.id && (
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="icon" className="h-6 w-6"><MoreVertical className="w-3 h-3" /></Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(discussion._id, reply._id)}>
                                            <Trash2 className="w-4 h-4 mr-2" /> Delete Reply
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    )}
                                    <span className="text-xs text-muted-foreground">{new Date(reply.createdAt).toLocaleDateString()}</span>
                                  </div>
                                </div>
                                <p className="text-sm text-foreground/80">{reply.content}</p>
                              </div>
                            ))}
                          </div>
                          
                          {discussion.status !== 'CLOSED' && (
                            <div className="flex gap-2 mt-4">
                              <Input 
                                placeholder={discussion.status === 'RESOLVED' ? "Only instructors can reply to resolved threads..." : "Write a reply..."}
                                value={replyContent}
                                disabled={discussion.status === 'RESOLVED' && currentUser?.role !== 'instructor'}
                                onChange={(e) => setReplyContent(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddReply(discussion._id)}
                              />
                              <Button 
                                size="icon" 
                                onClick={() => handleAddReply(discussion._id)}
                                disabled={discussion.status === 'RESOLVED' && currentUser?.role !== 'instructor'}
                              >
                                <Send className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </motion.div>
      </motion.div>
    </StudentLayout>
  );
};

export default StudentDiscussions;
