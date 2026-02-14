import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, Link } from "react-router-dom";
import { TeacherLayout } from "@/components/layouts/TeacherLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ReactPlayer from "react-player";
import {
  Plus,
  Video,
  FileQuestion,
  CheckCircle2,
  Clock,
  Users,
  Layers,
  Edit,
  Trash2,
  GripVertical,
  AlertCircle,
  Lock,
  Unlock,
  ArrowLeft,
  BarChart3,
  Eye,
  Play
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { instructorService } from "@/services/instructor";
import { extractYouTubeId, getEmbedUrl } from "@/lib/video";

// Get YouTube thumbnail URL
const getYouTubeThumbnail = (url: string | undefined): string => {
  if (!url) return "https://placehold.co/600x400?text=No+Video";
  const videoId = extractYouTubeId(url);
  // Using hqdefault for better quality in list view
  return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : "https://placehold.co/600x400?text=Invalid+URL";
};

interface Module {
  id: string;
  title: string;
  description: string;
  videoTitle: string;
  videoDuration: string;
  videoUrl?: string; // Added videoUrl
  quizQuestions: number;
  status: "draft" | "published";
  completionRate: number;
  order: number;
}

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

const TeacherCourseDetail = () => {
  const { id } = useParams();
  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [previewVideo, setPreviewVideo] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourse = async () => {
      if (!id) return;
      try {
        const data = await instructorService.getCourse(id);
        setCourse(data.course);

        // Map backend modules to UI format
        const mappedModules = (data.modules || []).map((m: any) => {
          const videoContent = m.contents?.find((c: any) => c.contentType === 'video');
          // Quiz count comes from the linked quiz in the video content
          const quizQuestions = videoContent?.quizID?.questions?.length || 0;

          return {
            id: m._id,
            title: m.name,
            description: m.description || "",
            videoTitle: videoContent?.title || "No video content",
            // Format numeric duration to MM:SS
            videoDuration: videoContent?.duration ? `${Math.floor(videoContent.duration / 60)}:${(videoContent.duration % 60).toString().padStart(2, '0')}` : "N/A",
            videoUrl: videoContent?.videoURL,
            quizQuestions: quizQuestions,
            status: "published", // Default since modules don't separate status in this simplified backend
            completionRate: 0,
            order: m.order
          };
        });
        setModules(mappedModules);
      } catch (error) {
        console.error("Failed to load course", error);
        toast({
          title: "Error",
          description: "Failed to load course details",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchCourse();
  }, [id]);

  const handleDeleteModule = async (moduleId: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this module? This action cannot be undone.")) {
      return;
    }

    try {
      await instructorService.deleteModule(moduleId);
      setModules(modules.filter((m) => m.id !== moduleId));
      toast({
        title: "Module deleted",
        description: "The module has been permanently removed.",
      });
    } catch (error: any) {
      console.error("Delete failed", error);
      toast({
        title: "Delete failed",
        description: error.message || "Could not delete module",
        variant: "destructive"
      });
    }
  };

  const handlePublish = async () => {
    try {
      if (!id) return;
      await instructorService.publishCourse(id);
      setCourse({ ...course, status: 'published' });
      toast({
        title: "Course Published",
        description: "Your course is now live and visible to students!",
        className: "bg-green-500 text-white border-none"
      });
    } catch (error: any) {
      toast({
        title: "Publish Failed",
        description: error.message || "Could not publish course.",
        variant: "destructive"
      });
    }
  };

  const handleUnpublish = async () => {
    try {
      if (!id) return;
      await instructorService.unpublishCourse(id);
      setCourse({ ...course, status: 'draft' });
      toast({
        title: "Course Unpublished",
        description: "Your course is now reverted to draft mode."
      });
    } catch (error: any) {
      toast({
        title: "Unpublish Failed",
        description: error.message || "Could not unpublish course.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <TeacherLayout>
        <div className="flex items-center justify-center h-full min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </TeacherLayout>
    );
  }

  if (!course) {
    return (
      <TeacherLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">Course not found</h2>
          <Button asChild className="mt-4">
            <Link to="/instructor/courses">Back to Courses</Link>
          </Button>
        </div>
      </TeacherLayout>
    );
  }

  const publishedModules = modules.length; // Assuming all are visible for now
  const avgCompletion = 0; // Placeholder

  return (
    <TeacherLayout>
      <motion.div
        className="space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Back Button & Header */}
        <motion.div variants={itemVariants}>
          <Link
            to="/instructor/courses"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Courses
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                  {course.title}
                </h1>
                <Badge
                  className={
                    course.status === "published"
                      ? "bg-green-500/10 text-green-500 border-green-500/20"
                      : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                  }
                >
                  {course.status}
                </Badge>
              </div>
              <p className="text-muted-foreground max-w-2xl">
                {course.description}
              </p>
            </div>
            <div className="flex gap-3">
              {course.status === 'draft' ? (
                <Button onClick={handlePublish} className="bg-green-600 hover:bg-green-700 text-white gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Publish Course
                </Button>
              ) : (
                <Button variant="outline" onClick={handleUnpublish} className="border-amber-500 text-amber-600 hover:bg-amber-50 gap-2">
                  <Lock className="h-4 w-4" />
                  Unpublish
                </Button>
              )}
              <Button variant="outline" className="gap-2">
                <Edit className="h-4 w-4" />
                Edit Course
              </Button>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button asChild className="gap-2">
                  <Link to={`/instructor/course/${id}/content/new`}>
                    <Plus className="h-4 w-4" />
                    Add Learning Content
                  </Link>
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Modules", value: modules.length, icon: Layers, color: "text-primary" },
            { label: "Content Items", value: modules.length, icon: CheckCircle2, color: "text-green-500" }, // Simplified
            { label: "Enrolled Students", value: course.enrollmentCount || 0, icon: Users, color: "text-blue-500" },
            { label: "Avg. Completion", value: `${avgCompletion}%`, icon: BarChart3, color: "text-amber-500" },
          ].map((stat) => (
            <Card key={stat.label} className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Important Notice */}
        <motion.div variants={itemVariants}>
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Video-Quiz Linked Learning</p>
                <p className="text-sm text-muted-foreground">
                  Each module requires both a video and a linked quiz. Students must complete the video
                  before taking the quiz, and the quiz must be passed to unlock the next module.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Module List */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Learning Modules</h2>
            <p className="text-sm text-muted-foreground">
              {publishedModules} modules
            </p>
          </div>

          <div className="space-y-4">
            <AnimatePresence>
              {modules?.map((module, index) => (
                <motion.div
                  key={module.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  layout
                >
                  <Card
                    className={`border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden`}
                  >
                    <CardContent className="p-0">
                      <div className="flex flex-col md:flex-row items-stretch">
                        {/* Drag Handle & Order */}
                        <div className="flex items-center justify-center p-3 md:w-16 bg-muted/30 border-r border-border/30">
                          <div className="flex flex-col items-center gap-1">
                            <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                            <span className="text-lg font-bold text-muted-foreground">
                              {module.order}
                            </span>
                          </div>
                        </div>

                        {/* Thumbnail Image */}
                        <div className="relative w-full md:w-60 aspect-video flex-shrink-0 self-start mt-3 mb-3 ml-3 rounded-md overflow-hidden bg-black/5 shadow-sm border border-border/10">
                          <img
                            src={getYouTubeThumbnail(module.videoUrl)}
                            alt={module.videoTitle}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer group"
                            onClick={() => module.videoUrl && setPreviewVideo(module.videoUrl)}>
                            <div className="p-2 rounded-full bg-primary/90 text-primary-foreground backdrop-blur-sm shadow-lg transform transition-transform group-hover:scale-110">
                              <Play className="w-5 h-5 fill-current ml-0.5" />
                            </div>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-4 flex flex-col justify-between">
                          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              {/* Header */}
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="text-lg font-semibold text-foreground line-clamp-1">
                                    {module.title}
                                  </h3>
                                  {module.description && (
                                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                      {module.description}
                                    </p>
                                  )}
                                </div>
                                <Badge
                                  variant="outline"
                                  className="bg-green-500/10 text-green-500 border-green-500/20 whitespace-nowrap ml-2"
                                >
                                  <Unlock className="h-3 w-3 mr-1" /> Published
                                </Badge>
                              </div>

                              {/* Meta Info */}
                              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pt-1">
                                <span className="flex items-center gap-1.5" title="Video Title">
                                  <Video className="h-4 w-4 text-primary" />
                                  <span className="line-clamp-1 max-w-[200px]">{module.videoTitle}</span>
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <Clock className="h-4 w-4" />
                                  {module.videoDuration}
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <FileQuestion className="h-4 w-4 text-primary" />
                                  {module.quizQuestions} questions
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Footer Actions */}
                          <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/40">
                            <div className="flex items-center gap-3 flex-1 mr-4">
                              {module.status === "published" && (
                                <div className="flex-1 max-w-xs">
                                  <div className="flex items-center justify-between text-xs mb-1.5">
                                    <span className="text-muted-foreground">Completion</span>
                                    <span className="font-medium text-foreground">{module.completionRate}%</span>
                                  </div>
                                  <Progress value={module.completionRate} className="h-1.5" />
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1.5 h-8 text-xs"
                                onClick={() => module.videoUrl && setPreviewVideo(module.videoUrl)}
                                disabled={!module.videoUrl}
                              >
                                <Eye className="h-3.5 w-3.5" />
                                Preview
                              </Button>
                              <Button variant="ghost" size="sm" className="gap-1.5 h-8 text-xs">
                                <Edit className="h-3.5 w-3.5" />
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                                onClick={() => handleDeleteModule(module.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {modules.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 border-2 border-dashed border-border rounded-xl"
            >
              <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No modules yet</h3>
              <p className="text-muted-foreground mb-4">
                Add your first learning module with video and quiz
              </p>
              <Button asChild>
                <Link to={`/instructor/course/${id}/content/new`}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Learning Content
                </Link>
              </Button>
            </motion.div>
          )}

          {/* Add More Button */}
          {modules.length > 0 && (
            <motion.div
              variants={itemVariants}
              className="flex justify-center pt-4"
            >
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="outline"
                  asChild
                  className="border-dashed border-2 gap-2"
                >
                  <Link to={`/instructor/course/${id}/content/new`}>
                    <Plus className="h-5 w-5" />
                    Add Another Module
                  </Link>
                </Button>
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      </motion.div>

      {/* Video Preview Dialog */}
      <Dialog open={!!previewVideo} onOpenChange={(open) => !open && setPreviewVideo(null)}>
        <DialogContent 
          className="max-w-4xl p-0 overflow-hidden bg-black border-none text-white aspect-video"
          aria-describedby={undefined}
        >
          <DialogHeader className="hidden">
            <DialogTitle>Video Preview</DialogTitle>
          </DialogHeader>
          {previewVideo && (
            <div className="w-full h-full">
              {extractYouTubeId(previewVideo) ? (
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${extractYouTubeId(previewVideo)}?autoplay=1&modestbranding=1&rel=0`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              ) : (
                <ReactPlayer
                  key={previewVideo}
                  url={previewVideo}
                  width="100%"
                  height="100%"
                  controls
                  playing
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </TeacherLayout>
  );
};

export default TeacherCourseDetail;
