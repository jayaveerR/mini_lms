import { TeacherLayout } from "@/components/layouts/TeacherLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  MoreVertical,
  Flag,
  Check,
  Trash2,
  Star
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { instructorService } from "@/services/instructor";
import { authService } from "@/services/auth";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Course {
  _id: string;
  title: string;
}

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
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const TeacherDiscussions = () => {
  const { toast } = useToast();
  const currentUser = authService.getUser();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchCourses = useCallback(async () => {
    try {
      const data = await instructorService.getCourses();
      setCourses(data || []);
      if (data && data.length > 0) {
        setSelectedCourse(data[0]._id);
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch courses", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchDiscussions = useCallback(async (courseId: string) => {
    try {
      const data = await instructorService.getCourseDiscussions(courseId);
      setDiscussions(Array.isArray(data) ? data : []);
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch discussions", variant: "destructive" });
    }
  }, [toast]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  useEffect(() => {
    if (selectedCourse) {
      fetchDiscussions(selectedCourse);
    }
  }, [selectedCourse, fetchDiscussions]);

  const handleStatusChange = async (discussionId: string, status: 'OPEN' | 'RESOLVED' | 'CLOSED') => {
    setActionLoading(discussionId);
    try {
      await instructorService.updateDiscussionStatus(discussionId, status);
      toast({ title: "Status Updated", description: `Discussion is now ${status.toLowerCase()}` });
      fetchDiscussions(selectedCourse);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update status";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleTogglePin = async (discussionId: string) => {
    try {
      await instructorService.togglePin(discussionId);
      fetchDiscussions(selectedCourse);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to toggle pin";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const handleAcceptAnswer = async (discussionId: string, replyId: string) => {
    try {
      await instructorService.markAcceptedAnswer(discussionId, replyId);
      toast({ title: "Answer Accepted", description: "This thread is now marked as resolved." });
      fetchDiscussions(selectedCourse);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to accept answer";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const handleToggleEndorsement = async (discussionId: string, replyId: string) => {
    try {
      await instructorService.toggleEndorsement(discussionId, replyId);
      fetchDiscussions(selectedCourse);
      toast({ title: "Success", description: "Reply endorsement toggled" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to toggle endorsement";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const handleDelete = async (discussionId: string, replyId?: string) => {
    if (!window.confirm(`Are you sure you want to delete this ${replyId ? 'reply' : 'discussion'}?`)) return;
    
    try {
      await instructorService.deletePost(discussionId, replyId);
      fetchDiscussions(selectedCourse);
      toast({ title: "Success", description: `${replyId ? 'Reply' : 'Discussion'} deleted` });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const handleAddReply = async (discussionId: string) => {
    if (!replyContent) return;
    try {
      await instructorService.addReply(discussionId, replyContent);
      setReplyContent("");
      fetchDiscussions(selectedCourse);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to add reply";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const filteredDiscussions = discussions.filter(d =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <TeacherLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout>
      <motion.div className="space-y-8" variants={containerVariants} initial="hidden" animate="visible">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Course Discussions</h2>
            <p className="text-muted-foreground">Manage student questions and moderate discussions</p>
          </div>
          <select 
            className="bg-background border border-border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
          >
            {courses.map(course => (
              <option key={course._id} value={course._id}>{course.title}</option>
            ))}
          </select>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search discussions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 h-12"
          />
        </div>

        <div className="space-y-4">
          {filteredDiscussions.length === 0 ? (
            <Card className="border-dashed p-12 text-center">
              <p className="text-muted-foreground">No discussions found for this course.</p>
            </Card>
          ) : (
            filteredDiscussions.map((discussion) => (
              <motion.div key={discussion._id} variants={itemVariants}>
                <Card className={`hover:border-primary/50 transition-colors ${discussion.isPinned ? 'border-primary/30 bg-primary/5' : ''}`}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {discussion.isPinned && <Badge className="gap-1"><Pin className="w-3 h-3" /> Pinned</Badge>}
                          <h3 className="text-lg font-bold">{discussion.title}</h3>
                          {discussion.status === 'RESOLVED' && <Badge variant="outline" className="text-green-500 border-green-500/20 bg-green-500/5">Resolved</Badge>}
                          {discussion.status === 'CLOSED' && <Badge variant="outline" className="text-muted-foreground">Closed</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          By <span className="text-primary font-medium">{discussion.authorID?.name}</span> • {new Date(discussion.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleTogglePin(discussion._id)}>
                            <Pin className="w-4 h-4 mr-2" /> {discussion.isPinned ? 'Unpin' : 'Pin'}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(discussion._id, 'OPEN')}>
                            <MessageCircle className="w-4 h-4 mr-2" /> Mark Open
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(discussion._id, 'RESOLVED')}>
                            <CheckCircle2 className="w-4 h-4 mr-2" /> Mark Resolved
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(discussion._id, 'CLOSED')}>
                            <Lock className="w-4 h-4 mr-2" /> Close Thread
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(discussion._id)}>
                            <Trash2 className="w-4 h-4 mr-2" /> Delete Discussion
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    <p className="text-foreground/80 mb-6">{discussion.content}</p>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center gap-6">
                        <span className="flex items-center gap-2 text-sm text-muted-foreground">
                          <ThumbsUp className="w-4 h-4" /> {discussion.likes.length}
                        </span>
                        <button 
                          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
                          onClick={() => setExpandedId(expandedId === discussion._id ? null : discussion._id)}
                        >
                          <MessageSquare className="w-4 h-4" /> {discussion.replies.length} Replies
                        </button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {expandedId === discussion._id && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-6 space-y-4">
                          <div className="space-y-4 pl-4 border-l-2 border-primary/20">
                            {discussion.replies.map((reply) => (
                              <div key={reply._id} className={`p-3 rounded-lg ${discussion.acceptedAnswerId === reply._id ? 'bg-green-500/10 border border-green-500/20' : 'bg-muted/30'} ${reply.isInstructorEndorsed ? 'border-l-4 border-l-purple-500' : ''}`}>
                                <div className="flex justify-between items-center mb-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-primary">{reply.authorID?.name}</span>
                                    {reply.authorID?.role === 'instructor' && <Badge variant="outline" className="text-[10px]">Instructor</Badge>}
                                    {discussion.acceptedAnswerId === reply._id && <Badge className="bg-green-500 text-white text-[10px]">Accepted Answer</Badge>}
                                    {reply.isInstructorEndorsed && <Badge className="bg-purple-500 text-white text-[10px] gap-1"><Star className="w-2 h-2" /> Endorsed</Badge>}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {discussion.status !== 'CLOSED' && discussion.acceptedAnswerId !== reply._id && (
                                      <Button variant="ghost" size="sm" className="h-6 text-[10px] text-green-600" onClick={() => handleAcceptAnswer(discussion._id, reply._id)}>
                                        <Check className="w-3 h-3 mr-1" /> Accept
                                      </Button>
                                    )}
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-6 w-6"><MoreVertical className="w-3 h-3" /></Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleToggleEndorsement(discussion._id, reply._id)}>
                                          <Star className="w-4 h-4 mr-2" /> {reply.isInstructorEndorsed ? 'Remove Endorsement' : 'Endorse Reply'}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(discussion._id, reply._id)}>
                                          <Trash2 className="w-4 h-4 mr-2" /> Delete Reply
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                    <span className="text-xs text-muted-foreground">{new Date(reply.createdAt).toLocaleDateString()}</span>
                                  </div>
                                </div>
                                <p className="text-sm">{reply.content}</p>
                              </div>
                            ))}
                          </div>
                          
                          <div className="flex gap-2 mt-4">
                            <Input 
                              placeholder="Write a response..." 
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleAddReply(discussion._id)}
                            />
                            <Button size="icon" onClick={() => handleAddReply(discussion._id)}>
                              <Send className="w-4 h-4" />
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </TeacherLayout>
  );
};

export default TeacherDiscussions;
