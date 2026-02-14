import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  Upload, 
  FileText, 
  Trash2, 
  ExternalLink, 
  Plus, 
  Search,
  Filter,
  File,
  Loader2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { TeacherLayout } from "@/components/layouts/TeacherLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { instructorService } from "@/services/instructor";
import { authService } from "@/services/auth";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1
  }
};

interface Material {
  _id: string;
  title: string;
  description?: string;
  fileName: string;
  fileSize: number;
  fileUrl: string;
  courseID?: {
    _id: string;
    title: string;
  };
  moduleID?: {
    _id: string;
    name: string;
  };
  createdAt: string;
}

interface Course {
  _id: string;
  title: string;
  modules?: Module[];
}

interface Module {
  _id: string;
  name: string;
}

export default function TeacherStudyMaterials() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  
  // Upload Form State
  const [uploadData, setUploadData] = useState({
    title: "",
    description: "",
    courseID: "",
    moduleID: "",
    file: null as File | null
  });

  const { toast } = useToast();

  const fetchInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [materialsData, coursesData] = await Promise.all([
        instructorService.getMaterials(),
        instructorService.getCourses()
      ]);
      setMaterials(Array.isArray(materialsData) ? materialsData : []);
      setCourses(Array.isArray(coursesData) ? coursesData : []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleCourseChange = async (courseId: string) => {
    setUploadData(prev => ({ ...prev, courseID: courseId, moduleID: "" }));
    if (courseId) {
      try {
        // Fetch modules for the selected course
        const course = courses.find(c => c._id === courseId);
        if (course && Array.isArray(course.modules) && course.modules.length > 0) {
          setModules(course.modules);
        } else {
          // If modules aren't pre-loaded in course object, fetch them
          const data = await instructorService.getCourse(courseId);
          setModules(Array.isArray(data.modules) ? data.modules : []);
        }
      } catch (error) {
        console.error("Error fetching modules:", error);
        setModules([]);
      }
    } else {
      setModules([]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadData(prev => ({ ...prev, file: e.target.files[0] }));
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadData.file || !uploadData.title || !uploadData.courseID || !uploadData.moduleID) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields and select a file.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', uploadData.file);
      formData.append('title', uploadData.title);
      formData.append('description', uploadData.description);
      formData.append('courseID', uploadData.courseID);
      formData.append('moduleID', uploadData.moduleID);

      await instructorService.uploadMaterial(formData);
      
      toast({
        title: "Success",
        description: "Study material uploaded to IPFS successfully!",
      });

      // Reset form and refresh list
      setIsUploadModalOpen(false);
      setUploadData({
        title: "",
        description: "",
        courseID: "",
        moduleID: "",
        file: null
      });
      fetchInitialData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to upload material";
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this material?")) return;

    try {
      await instructorService.deleteMaterial(id);
      toast({
        title: "Deleted",
        description: "Material removed successfully",
      });
      setMaterials(materials.filter(m => m._id !== id));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete material";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const filteredMaterials = Array.isArray(materials) ? materials.filter(m => {
    if (!m) return false;
    const title = m.title || "";
    const fileName = m.fileName || "";
    const description = m.description || "";
    
    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const mCourseId = m.courseID?._id || (typeof m.courseID === 'string' ? m.courseID : null);
    const matchesCourse = selectedCourse === "all" || mCourseId === selectedCourse;
    return matchesSearch && matchesCourse;
  }) : [];

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <TeacherLayout>
      <div className="p-6 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Study Materials</h1>
            <p className="text-muted-foreground">
              Manage and upload course resources to decentralized storage (IPFS).
            </p>
          </div>

          <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent hover:bg-accent/90 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Upload Material
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Upload Study Material</DialogTitle>
                <DialogDescription>
                  Files will be pinned to IPFS via Pinata for permanent storage.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleUpload} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input 
                    id="title" 
                    placeholder="e.g. Advanced React Patterns PDF" 
                    value={uploadData.title}
                    onChange={(e) => setUploadData(prev => ({...prev, title: e.target.value}))}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Course *</Label>
                    <Select onValueChange={handleCourseChange} value={uploadData.courseID}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Course" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.isArray(courses) && courses.map(course => (
                          <SelectItem key={course._id} value={course._id}>
                            {course.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Module *</Label>
                    <Select 
                      onValueChange={(val) => setUploadData(prev => ({...prev, moduleID: val}))} 
                      value={uploadData.moduleID}
                      disabled={!uploadData.courseID}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Module" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.isArray(modules) && modules.map(mod => (
                          <SelectItem key={mod._id} value={mod._id}>
                            {mod.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input 
                    id="description" 
                    placeholder="Briefly describe the content" 
                    value={uploadData.description}
                    onChange={(e) => setUploadData(prev => ({...prev, description: e.target.value}))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file">File *</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-accent transition-colors cursor-pointer relative">
                    <input 
                      type="file" 
                      id="file" 
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                      onChange={handleFileChange}
                      required
                    />
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {uploadData.file ? uploadData.file.name : "Click or drag to upload file"}
                    </p>
                  </div>
                </div>

                <DialogFooter>
                  <Button 
                    type="submit" 
                    className="w-full bg-accent hover:bg-accent/90"
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading to IPFS...
                      </>
                    ) : (
                      "Start Upload"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search materials..." 
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger className="w-full md:w-[200px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by Course" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {Array.isArray(courses) && courses.map(course => (
                <SelectItem key={course._id} value={course._id}>
                  {course.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Materials Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-accent" />
            <p className="text-muted-foreground">Loading your materials...</p>
          </div>
        ) : filteredMaterials.length > 0 ? (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {filteredMaterials.map((material) => (
              <motion.div key={material._id} variants={itemVariants}>
                <Card className="group hover:shadow-md transition-all border-border/50 overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="p-2 rounded-lg bg-accent/10 text-accent">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(material._id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <CardTitle className="mt-4 line-clamp-1">{material.title}</CardTitle>
                    <CardDescription className="line-clamp-2 h-10">
                      {material.description || "No description provided."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Course:</span>
                        <span className="font-medium text-foreground">{material.courseID?.title || "N/A"}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Module:</span>
                        <span className="font-medium text-foreground">{material.moduleID?.name || "N/A"}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Size:</span>
                        <span>{formatFileSize(material.fileSize || 0)}</span>
                      </div>
                    </div>
                    
                    <div className="pt-2 flex gap-2">
                      <Button 
                        variant="outline" 
                        className="flex-1 text-xs"
                        asChild
                      >
                        <a href={material.fileUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3 h-3 mr-2" />
                          View on IPFS
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-20 border-2 border-dashed border-border rounded-xl">
            <File className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-20" />
            <h3 className="text-lg font-medium">No materials found</h3>
            <p className="text-muted-foreground">
              {searchQuery || selectedCourse !== "all" 
                ? "Try adjusting your filters" 
                : "Start by uploading your first study material to IPFS."}
            </p>
          </div>
        )}
      </div>
    </TeacherLayout>
  );
}
