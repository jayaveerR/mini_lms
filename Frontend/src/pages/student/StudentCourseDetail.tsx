import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import ReactPlayer from "react-player";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
    CheckCircle,
    PlayCircle,
    Lock,
    MonitorPlay,
    FileQuestion,
    ChevronLeft,
    Menu,
    Award,
    RefreshCw,
    CheckCircle2,
    FileText,
    ExternalLink,
    Download
} from "lucide-react";
import { studentService } from "@/services/student";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
    Sheet,
    SheetContent,
    SheetTrigger,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { getEmbedUrl, extractYouTubeId } from "@/lib/video";

interface Content {
    _id: string;
    title: string;
    contentType: 'video' | 'quiz' | 'text';
    videoURL?: string;
    description?: string;
    duration?: number; // seconds
    quizID?: string | { _id: string };
}

interface Module {
    _id: string;
    name: string;
    contents: Content[];
}

interface Course {
    _id: string;
    title: string;
    description?: string;
}

interface Material {
    _id: string;
    title: string;
    fileName: string;
    fileUrl: string;
}

const StudentCourseDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState<Course | null>(null);
    const [modules, setModules] = useState<Module[]>([]);
    const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
    const [activeContent, setActiveContent] = useState<Content | null>(null);
    const [materials, setMaterials] = useState<Material[]>([]);
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState(0);

    const fetchData = React.useCallback(async () => {
        if (!id) {
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const [courseData, progressData, materialsData] = await Promise.all([
                studentService.getCourse(id),
                studentService.getCourseProgress(id),
                studentService.getMaterials(id)
            ]);

            setCourse(courseData.course);
            const loadedModules = courseData.modules || [];
            setModules(loadedModules);
            setMaterials(materialsData || []);

            const completedSet = new Set<string>(progressData.completedContentIds);
            setCompletedItems(completedSet);

            // Calculate total steps
            let totalSteps = 0;
            loadedModules.forEach((m: Module) => {
                m.contents.forEach((c: Content) => {
                    totalSteps += 1; // The content itself
                    if (c.quizID) totalSteps += 1; // The quiz
                });
            });

            setProgress(totalSteps > 0 ? Math.min(Math.round((completedSet.size / totalSteps) * 100), 100) : 0);

        } catch (error) {
            console.error("Failed to load course", error);
            toast({ title: "Error", description: "Could not load course content", variant: "destructive" });
            navigate("/student/dashboard");
        } finally {
            setLoading(false);
        }
    }, [id, navigate]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Initialize active content when modules are loaded
    useEffect(() => {
        if (!loading && modules && modules.length > 0 && !activeContent) {
            let foundActive = false;
            // Try to find the first incomplete content
            for (const m of modules) {
                if (!m.contents) continue;
                for (const c of m.contents) {
                    if (!completedItems.has(c._id)) {
                        setActiveContent(c);
                        foundActive = true;
                        break;
                    }
                }
                if (foundActive) break;
            }
            // Fallback to first content if all completed or none found
            if (!foundActive && modules.length > 0 && modules[0].contents && modules[0].contents.length > 0) {
                setActiveContent(modules[0].contents[0]);
            }
        }
    }, [modules, loading, activeContent, completedItems]);

    const handleCompleteCourse = async () => {
        if (!id) return;
        try {
            await studentService.completeCourse(id);
            toast({ title: "Success", description: "Course marked as completed!" });
            fetchData();
        } catch (error) {
            toast({ title: "Error", description: "Failed to complete course", variant: "destructive" });
        }
    };

    const handleResetCourse = async () => {
        if (!id) return;
        if (!window.confirm("Are you sure you want to reset all progress for this course? This cannot be undone.")) return;
        try {
            await studentService.resetCourseProgress(id);
            toast({ title: "Success", description: "Course progress reset. You can start over!" });
            fetchData();
        } catch (error) {
            toast({ title: "Error", description: "Failed to reset course", variant: "destructive" });
        }
    };

    const getModuleId = React.useCallback((contentId: string) => {
        for (const m of modules) {
            if (m.contents.some(c => c._id === contentId)) return m._id;
        }
        return "";
    }, [modules]);

    const onMediaEnded = React.useCallback(async () => {
        if (!activeContent || !id) return;
        const mId = getModuleId(activeContent._id);

        try {
            if (mId) {
                await studentService.markVideoCompleted(id, mId, activeContent._id, activeContent.duration || 0);
            }

            setCompletedItems(prev => {
                const newSet = new Set(prev);
                newSet.add(activeContent._id);
                return newSet;
            });

            toast({
                title: "Lesson Completed!",
                description: "Your progress has been saved.",
                className: "bg-green-500 text-white"
            });

            // Refresh to unlock next item
            fetchData();
        } catch (error) {
            console.error("Failed to mark completion", error);
        }
    }, [activeContent, id, getModuleId, fetchData]);

    const getQuizId = (content: Content | null) => {
        if (!content || !content.quizID) return "";
        if (typeof content.quizID === 'string') return content.quizID;
        return content.quizID._id;
    };





    const isLocked = (content: Content) => {
        const allContents = modules.flatMap(m => m.contents);
        const idx = allContents.findIndex(c => c._id === content._id);
        if (idx <= 0) return false;
        return !completedItems.has(allContents[idx - 1]._id);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-muted-foreground animate-pulse">Loading course content...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-background flex-col md:flex-row overflow-hidden">
            {/* Sidebar - Desktop */}
            <div className="hidden md:flex w-80 flex-col border-r bg-card/50 backdrop-blur-sm z-20">
                <div className="p-4 border-b">
                    <Link to="/student/dashboard" className="flex items-center text-sm text-muted-foreground hover:text-primary mb-4">
                        <ChevronLeft className="w-4 h-4 mr-1" /> Back to Dashboard
                    </Link>
                    <h2 className="font-bold text-lg line-clamp-1">{course?.title}</h2>
                    <div className="mt-4 space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Course Progress</span>
                            <span>{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />

                        <div className="flex flex-col gap-2 pt-2">
                            {progress < 100 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full text-xs h-8 border-green-500/50 text-green-600 hover:bg-green-50"
                                    onClick={handleCompleteCourse}
                                >
                                    <CheckCircle2 className="w-3 h-3 mr-1" /> Complete Course
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full text-xs h-8 text-muted-foreground hover:text-destructive"
                                onClick={handleResetCourse}
                            >
                                <RefreshCw className="w-3 h-3 mr-1" /> Reset Progress
                            </Button>
                        </div>
                    </div>
                </div>
                <ScrollArea className="flex-1">
                    <div className="p-4 space-y-4">
                        {modules.map((module, mIdx) => (
                            <div key={module._id} className="space-y-2">
                                <div className="flex items-center gap-2 font-semibold text-sm text-foreground/80 uppercase tracking-wider">
                                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">
                                        {mIdx + 1}
                                    </span>
                                    {module.name}
                                </div>
                                <div className="space-y-1 ml-3 pl-3 border-l border-border/50">
                                    {module.contents.map((content, cIdx) => {
                                        const locked = isLocked(content);
                                        const completed = completedItems.has(content._id);
                                        const active = activeContent?._id === content._id;

                                        return (
                                            <button
                                                key={content._id}
                                                disabled={locked}
                                                onClick={() => setActiveContent(content)}
                                                className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all text-sm group ${active ? "bg-primary text-primary-foreground shadow-md" :
                                                    locked ? "opacity-50 cursor-not-allowed" : "hover:bg-accent"
                                                    }`}
                                            >
                                                {completed ? (
                                                    <CheckCircle className={`w-4 h-4 ${active ? "text-white" : "text-green-500"}`} />
                                                ) : locked ? (
                                                    <Lock className="w-4 h-4 text-muted-foreground" />
                                                ) : content.contentType === 'quiz' ? (
                                                    <FileQuestion className="w-4 h-4" />
                                                ) : (
                                                    <PlayCircle className="w-4 h-4" />
                                                )}

                                                <div className="flex-1">
                                                    <p className={`font-medium line-clamp-1 ${completed && !active ? "text-muted-foreground line-through" : ""}`}>
                                                        {content.title}
                                                    </p>
                                                    <div className="flex items-center gap-2 text-xs opacity-80 mt-1">
                                                        {content.contentType === 'video' && <span>{Math.floor((content.duration || 0) / 60)} min</span>}
                                                        {content.contentType === 'quiz' && <span>Quiz</span>}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}

                        {/* Study Materials Section */}
                        {materials.length > 0 && (
                            <div className="mt-8 space-y-4">
                                <div className="flex items-center gap-2 font-bold text-sm text-foreground/80 uppercase tracking-wider px-2">
                                    <FileText className="w-4 h-4 text-accent" />
                                    Study Materials
                                </div>
                                <div className="space-y-2">
                                    {materials.map((material) => (
                                        <a
                                            key={material._id}
                                            href={material.fileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-all text-sm group border border-transparent hover:border-border/50"
                                        >
                                            <div className="p-2 rounded bg-accent/10 text-accent group-hover:bg-accent group-hover:text-white transition-colors">
                                                <Download className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium truncate">{material.title}</p>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {material.fileName}
                                                </p>
                                            </div>
                                            <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* Mobile Header */}
                <div className="md:hidden flex items-center justify-between p-4 border-b bg-card">
                    <div className="flex items-center gap-3">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <Menu className="w-6 h-6" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-80 p-0" aria-describedby={undefined}>
                                <div className="p-4 border-b">
                                    <SheetTitle className="font-bold text-lg line-clamp-1">{course?.title}</SheetTitle>
                                    <div className="mt-4 space-y-2">
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>Course Progress</span>
                                            <span>{progress}%</span>
                                        </div>
                                        <Progress value={progress} className="h-2" />

                                        <div className="flex flex-col gap-2 pt-2">
                                            {progress < 100 && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="w-full text-xs h-8 border-green-500/50 text-green-600 hover:bg-green-50"
                                                    onClick={handleCompleteCourse}
                                                >
                                                    <CheckCircle2 className="w-3 h-3 mr-1" /> Complete Course
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="w-full text-xs h-8 text-muted-foreground hover:text-destructive"
                                                onClick={handleResetCourse}
                                            >
                                                <RefreshCw className="w-3 h-3 mr-1" /> Reset Progress
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                                <ScrollArea className="h-[calc(100vh-180px)]">
                                    <div className="p-4 space-y-4">
                                        {modules.map((module, mIdx) => (
                                            <div key={module._id} className="space-y-2">
                                                <div className="flex items-center gap-2 font-semibold text-sm text-foreground/80 uppercase tracking-wider">
                                                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">
                                                        {mIdx + 1}
                                                    </span>
                                                    {module.name}
                                                </div>
                                                <div className="space-y-1 ml-3 pl-3 border-l border-border/50">
                                                    {module.contents.map((content) => {
                                                        const locked = isLocked(content);
                                                        const completed = completedItems.has(content._id);
                                                        const active = activeContent?._id === content._id;

                                                        return (
                                                            <button
                                                                key={content._id}
                                                                disabled={locked}
                                                                onClick={() => setActiveContent(content)}
                                                                className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all text-sm group ${active ? "bg-primary text-primary-foreground shadow-md" :
                                                                    locked ? "opacity-50 cursor-not-allowed" : "hover:bg-accent"
                                                                    }`}
                                                            >
                                                                {completed ? (
                                                                    <CheckCircle className={`w-4 h-4 ${active ? "text-white" : "text-green-500"}`} />
                                                                ) : locked ? (
                                                                    <Lock className="w-4 h-4 text-muted-foreground" />
                                                                ) : content.contentType === 'quiz' ? (
                                                                    <FileQuestion className="w-4 h-4" />
                                                                ) : (
                                                                    <PlayCircle className="w-4 h-4" />
                                                                )}

                                                                <div className="flex-1">
                                                                    <p className={`font-medium line-clamp-1 ${completed && !active ? "text-muted-foreground line-through" : ""}`}>
                                                                        {content.title}
                                                                    </p>
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}

                                        {/* Mobile Study Materials */}
                                        {materials.length > 0 && (
                                            <div className="mt-8 space-y-4">
                                                <div className="flex items-center gap-2 font-bold text-sm text-foreground/80 uppercase tracking-wider">
                                                    <FileText className="w-4 h-4 text-accent" />
                                                    Study Materials
                                                </div>
                                                <div className="space-y-2">
                                                    {materials.map((material) => (
                                                        <a
                                                            key={material._id}
                                                            href={material.fileUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-3 p-3 rounded-lg bg-accent/5 hover:bg-accent/10 transition-all text-sm"
                                                        >
                                                            <Download className="w-4 h-4 text-accent" />
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-medium truncate">{material.title}</p>
                                                            </div>
                                                            <ExternalLink className="w-3 h-3 text-muted-foreground" />
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                            </SheetContent>
                        </Sheet>
                        <h1 className="font-bold text-sm line-clamp-1">{course?.title}</h1>
                    </div>
                    <Link to="/student/dashboard">
                        <Button variant="ghost" size="sm">
                            <ChevronLeft className="w-4 h-4 mr-1" /> Exit
                        </Button>
                    </Link>
                </div>

                <ScrollArea className="flex-1">
                    <div className="p-6 max-w-5xl mx-auto w-full space-y-6">
                        {/* Mobile Header logic could go here */}

                        {activeContent ? (
                            <div
                                className="space-y-6"
                            >
                                <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-2xl relative group">
                                    {activeContent.contentType === 'video' ? (
                                        (() => {
                                            const ytId = extractYouTubeId(activeContent.videoURL || "");
                                            if (ytId) {
                                                return (
                                                    <iframe
                                                        key={activeContent._id}
                                                        src={`https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1&autoplay=1`}
                                                        className="w-full h-full border-0"
                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                        allowFullScreen
                                                        title={activeContent.title}
                                                    />
                                                );
                                            }
                                            const Player = ReactPlayer as React.ElementType;
                                            return (
                                                <Player
                                                    key={activeContent._id}
                                                    url={activeContent.videoURL || ""}
                                                    width="100%"
                                                    height="100%"
                                                    controls
                                                    playing
                                                    onEnded={onMediaEnded}
                                                />
                                            );
                                        })()
                                    ) : activeContent.contentType === 'quiz' ? (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-card text-card-foreground p-8 text-center bg-[url('/patterns/grid.svg')]">
                                            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                                                <FileQuestion className="w-10 h-10 text-primary" />
                                            </div>
                                            <h2 className="text-3xl font-bold mb-4">{activeContent.title}</h2>
                                            <p className="text-muted-foreground mb-8 max-w-md">
                                                Complete this quiz to test your knowledge.
                                                Ensure you have watched the previous videos!
                                            </p>
                                            {isLocked(activeContent) ? (
                                                <Button disabled variant="secondary" size="lg">
                                                    <Lock className="w-4 h-4 mr-2" /> Locked
                                                </Button>
                                            ) : (
                                                <Link to={`/student/quiz/${getQuizId(activeContent)}`}>
                                                    <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8">
                                                        Start Quiz
                                                    </Button>
                                                </Link>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-muted-foreground">
                                            Content type not supported
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <h1 className="text-2xl font-bold">{activeContent.title}</h1>
                                            <p className="text-muted-foreground mt-2">{activeContent.description}</p>
                                        </div>
                                        {activeContent.contentType === 'video' && (
                                            <div className="flex gap-2">
                                                <Button onClick={onMediaEnded} variant="outline" className={completedItems.has(activeContent._id) ? "text-green-500 border-green-500" : ""}>
                                                    {completedItems.has(activeContent._id) ? (
                                                        <>
                                                            <CheckCircle className="w-4 h-4 mr-2" /> Completed
                                                        </>
                                                    ) : (
                                                        "Mark as Completed"
                                                    )}
                                                </Button>

                                                {activeContent.quizID && completedItems.has(activeContent._id) && (
                                                    <Link to={`/student/quiz/${getQuizId(activeContent)}`}>
                                                        <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
                                                            <FileQuestion className="w-4 h-4 mr-2" />
                                                            {completedItems.has(getQuizId(activeContent)) ? "Retake Quiz" : "Take Quiz"}
                                                        </Button>
                                                    </Link>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-[50vh] text-center text-muted-foreground">
                                <MonitorPlay className="w-12 h-12 mb-4 opacity-20" />
                                <p>Select a lesson to start learning</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
};

export default StudentCourseDetail;
