import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TeacherLayout } from "@/components/layouts/TeacherLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Plus,
  BookOpen,
  Users,
  Clock,
  Edit,
  Eye,
  Layers,
  Video,
  Search,
  Filter,
} from "lucide-react"; // Note: RotateCcw and Trash are imported below, merging them.
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { instructorService } from "@/services/instructor";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  RotateCcw,
  Trash
} from "lucide-react";

// Simplified Course interface for UI (matching backend response)
interface Course {
  _id: string;
  title: string;
  description: string;
  thumbnail: string;
  visibility: "public" | "private";
  enrollmentLimit?: number;
  status: "draft" | "published" | "archived";
  updatedAt: string;
  createdAt: string;
  youtubeUrl?: string;
  enrollmentCount?: number;
  moduleCount?: number;
}

// Extract YouTube video ID from various URL formats
const extractYouTubeId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

// Get YouTube thumbnail URL from video ID
const getYouTubeThumbnail = (videoId: string): string => {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

const TeacherCourses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [courseToDelete, setCourseToDelete] = useState<{ id: string; title: string; permanent: boolean } | null>(null);

  const [newCourse, setNewCourse] = useState({ title: "", description: "", youtubeUrl: "" });
  const [youtubePreview, setYoutubePreview] = useState<{ videoId: string; thumbnail: string } | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await instructorService.getCourses();
        setCourses(data);
      } catch (error) {
        console.error("Failed to fetch courses", error);
        toast({
          title: "Error",
          description: "Failed to load courses",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const handleYoutubeUrlChange = (url: string) => {
    setNewCourse({ ...newCourse, youtubeUrl: url });
    const videoId = extractYouTubeId(url);
    if (videoId) {
      setYoutubePreview({
        videoId,
        thumbnail: getYouTubeThumbnail(videoId),
      });
    } else {
      setYoutubePreview(null);
    }
  };

  const handleCreateCourse = async () => {
    if (!newCourse.title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a course title",
        variant: "destructive",
      });
      return;
    }

    if (!youtubePreview) {
      toast({
        title: "YouTube link required",
        description: "Please enter a valid YouTube video link",
        variant: "destructive",
      });
      return;
    }

    const coursePayload = {
      title: newCourse.title,
      description: newCourse.description,
      category: "General",
      thumbnail: youtubePreview.thumbnail,
      visibility: "public",
      enrollmentLimit: 100
    };

    try {
      const createdCourse = await instructorService.createCourse(coursePayload);
      setCourses([createdCourse, ...courses]);
      setNewCourse({ title: "", description: "", youtubeUrl: "" });
      setYoutubePreview(null);
      setIsCreateDialogOpen(false);

      toast({
        title: "Course created!",
        description: `"${createdCourse.title}" is ready.`,
      });
    } catch (error) {
      toast({
        title: "Creation failed",
        description: (error as Error).message,
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: Course["status"]) => {
    switch (status) {
      case "published":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "draft":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "archived":
        return "bg-muted text-muted-foreground border-border";
      default:
        return "";
    }
  };

  // Filter courses based on Tab status and Search query
  const getFilteredCourses = () => {
    let filtered = courses;

    // Tab Filtering
    if (activeTab === "published") {
      filtered = courses.filter((c) => c.status === "published");
    } else if (activeTab === "draft") {
      filtered = courses.filter((c) => c.status === "draft");
    } else if (activeTab === "archived") {
      filtered = courses.filter((c) => c.status === "archived"); // Trash
    } else {
      // "All" tab usually hides archived/trash unless explicitly requested
      filtered = courses.filter((c) => c.status !== "archived");
    }

    // Search Filtering
    if (searchQuery) {
      filtered = filtered.filter(
        (course) =>
          course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          course.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  const filteredCourses = getFilteredCourses();

  const handleSoftDelete = (course: Course) => {
    // Open confirmation for Soft Delete (Move to Trash)
    setCourseToDelete({ id: course._id, title: course.title, permanent: false });
  };

  const handlePermanentDelete = (course: Course) => {
    // Open confirmation for Permanent Delete
    setCourseToDelete({ id: course._id, title: course.title, permanent: true });
  };

  const confirmDelete = async () => {
    if (!courseToDelete) return;

    try {
      if (courseToDelete.permanent) {
        await instructorService.permanentDeleteCourse(courseToDelete.id);
        setCourses(courses.filter((c) => c._id !== courseToDelete.id));
        toast({ title: "Course Deleted", description: "Course permanently removed." });
      } else {
        await instructorService.deleteCourse(courseToDelete.id);
        // Optimize: Update local state to 'archived' instead of refetching
        setCourses(courses.map(c => c._id === courseToDelete.id ? { ...c, status: 'archived' as const } : c));
        toast({ title: "Moved to Trash", description: "Course moved to trash." });
      }
    } catch (error: any) {
      toast({
        title: "Delete Failed",
        description: error.message || "Action failed",
        variant: "destructive"
      });
    } finally {
      setCourseToDelete(null);
    }
  };

  const handleRestore = async (course: Course) => {
    try {
      await instructorService.restoreCourse(course._id);

      setCourses(courses.map(c => c._id === course._id ? { ...c, status: 'draft' as const } : c));
      toast({ title: "Restored", description: "Course restored to drafts." });
    } catch (error: any) {
      toast({ title: "Restore Failed", description: error.message, variant: "destructive" });
    }
  };

  // ... [handleCreateCourse implementation unchanged] ...

  return (
    <TeacherLayout>
      <motion.div className="space-y-6" variants={containerVariants} initial="hidden" animate="visible">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Course Management</h1>
            <p className="text-muted-foreground">Manage your curriculum and content</p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Create Course
          </Button>
        </div>

        {/* Tabs & Search */}
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
            <TabsList>
              <TabsTrigger value="all">All Courses</TabsTrigger>
              <TabsTrigger value="published">Published</TabsTrigger>
              <TabsTrigger value="draft">Drafts</TabsTrigger>
              <TabsTrigger value="archived" className="text-destructive data-[state=active]:text-destructive">
                <Trash className="h-4 w-4 mr-2" /> Trash
              </TabsTrigger>
            </TabsList>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <TabsContent value={activeTab} className="mt-0">
            <motion.div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6" layout>
              <AnimatePresence>
                {filteredCourses.map((course, index) => (
                  <motion.div
                    key={course._id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="group flex flex-col h-full overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-md transition-all">
                      {/* Thumbnail & Status */}
                      <div className="relative aspect-video bg-muted overflow-hidden">
                        <img
                          src={course.thumbnail || "https://placehold.co/600x400"}
                          alt={course.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          {activeTab === 'archived' ? (
                            <>
                              <Button size="sm" variant="secondary" onClick={() => handleRestore(course)}>
                                <RotateCcw className="h-4 w-4 mr-2" /> Restore
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handlePermanentDelete(course)}>
                                <Trash className="h-4 w-4 mr-2" /> Delete Forever
                              </Button>
                            </>
                          ) : (
                            <Link to={`/instructor/course/${course._id}`}>
                              <Button size="sm" variant="secondary" className="gap-2">
                                <Edit className="h-4 w-4" /> Manage
                              </Button>
                            </Link>
                          )}
                        </div>
                        <Badge className={`absolute top-2 right-2 ${getStatusColor(course.status)}`}>
                          {course.status}
                        </Badge>
                      </div>

                      {/* Content */}
                      <CardContent className="flex-1 p-4 flex flex-col gap-3">
                        <div>
                          <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                            {course.title}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {course.description}
                          </p>
                        </div>

                        <div className="mt-auto pt-3 flex items-center justify-between text-xs text-muted-foreground border-t border-border/40">
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" /> {course.enrollmentCount || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Layers className="h-3.5 w-3.5" /> {course.moduleCount || 0}
                          </span>

                          {activeTab !== 'archived' && (
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive"
                              onClick={(e) => {
                                e.preventDefault();
                                handleSoftDelete(course);
                              }}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>

            {filteredCourses.length === 0 && (
              <div className="text-center py-16">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                  {activeTab === 'archived' ? <Trash className="h-8 w-8 text-muted-foreground" /> : <BookOpen className="h-8 w-8 text-muted-foreground" />}
                </div>
                <h3 className="text-lg font-medium">No courses found</h3>
                <p className="text-muted-foreground">
                  {activeTab === 'archived' ? "Trash is empty." : "Create a new course to get started."}
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!courseToDelete} onOpenChange={() => setCourseToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {courseToDelete?.permanent ? "Delete Forever?" : "Move to Trash?"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {courseToDelete?.permanent
                  ? "This action cannot be undone. This will permanently delete the course, all modules, videos, and quizzes."
                  : "This course will be moved to trash. Students will no longer see it. You can restore it later."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className={courseToDelete?.permanent ? "bg-destructive hover:bg-destructive/90" : ""}
                onClick={confirmDelete}
              >
                {courseToDelete?.permanent ? "Delete Forever" : "Move to Trash"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Create Dialog (Unchanged) */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          {/* ... Dialog Content same as before ... */}
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Course</DialogTitle>
              <DialogDescription>
                Add a YouTube video link to get started. The thumbnail will be fetched automatically.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4 pb-2">
              {/* YouTube URL Input */}
              <div className="space-y-2">
                <Label htmlFor="youtube-url" className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-red-500" />
                  YouTube Video Link
                </Label>
                <Input
                  id="youtube-url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={newCourse.youtubeUrl}
                  onChange={(e) => handleYoutubeUrlChange(e.target.value)}
                />
                {newCourse.youtubeUrl && !youtubePreview && (
                  <p className="text-xs text-destructive">Invalid YouTube URL. Please enter a valid link.</p>
                )}
              </div>

              {/* YouTube Thumbnail Preview */}
              <AnimatePresence>
                {youtubePreview && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2"
                  >
                    <Label className="text-xs text-muted-foreground">Video Preview</Label>
                    <a
                      href={newCourse.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block relative aspect-video rounded-lg overflow-hidden group cursor-pointer border border-border"
                    >
                      <img
                        src={youtubePreview.thumbnail}
                        alt="Video thumbnail"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          e.currentTarget.src = `https://img.youtube.com/vi/${youtubePreview.videoId}/hqdefault.jpg`;
                        }}
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center shadow-xl">
                          <Video className="h-7 w-7 text-white ml-1" />
                        </div>
                      </div>
                    </a>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Course Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Course Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Introduction to Web Development"
                  value={newCourse.title}
                  onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of what students will learn..."
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                  className="min-h-[80px]"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateCourse}
                  className="flex-1"
                  disabled={!youtubePreview || !newCourse.title.trim()}
                >
                  Create Course
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

      </motion.div>
    </TeacherLayout>
  );
};

export default TeacherCourses;
