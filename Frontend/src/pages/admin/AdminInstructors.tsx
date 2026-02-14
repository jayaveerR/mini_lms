import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Mail,
  Star,
  Users,
  DollarSign,
  Eye,
  CheckCircle,
  XCircle,
  Award,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/layouts/AdminLayout";
import { adminService } from "@/services/admin";

interface Instructor {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: "active" | "inactive" | "pending";
  joinedAt: string;
  coursesTaught: number;
  totalStudents: number;
  totalRevenue: number;
  rating: number;
  reviewCount: number;
  completionRate: number;
  specialization: string;
}

export default function AdminInstructors() {
  const { toast } = useToast();
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const fetchInstructors = useCallback(async () => {
    try {
      const data = await adminService.getAllInstructors();
      const mappedInstructors = data.map((i: any) => ({
        id: i._id,
        name: i.name,
        email: i.email,
        status: i.status === "approved" ? "active" : i.status === "rejected" ? "inactive" : "pending",
        joinedAt: new Date(i.createdAt).toLocaleDateString(),
        coursesTaught: 0,
        totalStudents: 0,
        totalRevenue: 0,
        rating: 0,
        reviewCount: 0,
        completionRate: 0,
        specialization: i.department || "General"
      }));
      setInstructors(mappedInstructors);
    } catch (error) {
      console.error("Failed to fetch instructors", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInstructors();
    const interval = setInterval(fetchInstructors, 30000);
    return () => clearInterval(interval);
  }, [fetchInstructors]);

  const filteredInstructors = instructors.filter((instructor) => {
    const matchesSearch =
      instructor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      instructor.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      instructor.specialization.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || instructor.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: instructors.length,
    active: instructors.filter((i) => i.status === "active").length,
    totalCourses: instructors.reduce((sum, i) => sum + (i.coursesTaught || 0), 0),
    totalRevenue: instructors.reduce((sum, i) => sum + (i.totalRevenue || 0), 0),
    avgRating: instructors.length > 0 
      ? (instructors.reduce((sum, i) => sum + (i.rating || 0), 0) / instructors.length).toFixed(1)
      : "0.0",
  };

  const handleEditInstructor = (instructor: Instructor) => {
    setEditingInstructor({ ...instructor });
    setIsEditDialogOpen(true);
  };

  const handleSaveInstructor = () => {
    if (!editingInstructor) return;
    setInstructors(instructors.map((i) => (i.id === editingInstructor.id ? editingInstructor : i)));
    setIsEditDialogOpen(false);
    toast({
      title: "Instructor updated",
      description: `${editingInstructor.name}'s profile has been updated.`,
    });
  };

  const handleApprove = async (instructor: Instructor) => {
    try {
      await adminService.approveInstructor(instructor.id);
      setInstructors(instructors.map((i) => (i.id === instructor.id ? { ...i, status: "active" as const } : i)));
      toast({
        title: "Instructor approved",
        description: `${instructor.name} is now an active instructor.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve instructor.",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (instructor: Instructor) => {
    try {
      await adminService.rejectInstructor(instructor.id);
      setInstructors(instructors.map((i) => (i.id === instructor.id ? { ...i, status: "inactive" as const } : i)));
      toast({
        title: "Instructor rejected",
        description: `${instructor.name} has been rejected.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject instructor.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-success/15 text-success border-success/30"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
      case "inactive":
        return <Badge variant="outline" className="text-muted-foreground border-border bg-muted/50"><XCircle className="w-3 h-3 mr-1" />Inactive</Badge>;
      case "pending":
        return <Badge className="bg-warning/15 text-warning border-warning/30"><Award className="w-3 h-3 mr-1" />Pending</Badge>;
      default:
        return null;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Instructor Management</h1>
            <p className="text-muted-foreground mt-1">Manage platform instructors and their courses</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: "Total Instructors", value: stats.total, icon: Users, iconBg: "bg-primary", iconFg: "text-primary-foreground" },
            { label: "Active", value: stats.active, icon: CheckCircle, iconBg: "bg-success", iconFg: "text-success-foreground" },
            { label: "Total Courses", value: stats.totalCourses, icon: BookOpen, iconBg: "bg-accent", iconFg: "text-accent-foreground" },
            { label: "Total Revenue", value: `$${(stats.totalRevenue / 1000).toFixed(0)}K`, icon: DollarSign, iconBg: "bg-warning", iconFg: "text-warning-foreground" },
            { label: "Avg. Rating", value: stats.avgRating, icon: Star, iconBg: "bg-primary", iconFg: "text-primary-foreground" },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover-lift">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl ${stat.iconBg} flex items-center justify-center shadow-lg ring-1 ring-border/20`}>
                      <stat.icon className={`w-6 h-6 ${stat.iconFg}`} strokeWidth={2.5} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or specialization..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Instructors Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin mb-4" />
            <p>Loading instructors...</p>
          </div>
        ) : filteredInstructors.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>No instructors found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInstructors.map((instructor, index) => (
              <motion.div
                key={instructor.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover-lift overflow-hidden">
                  <CardContent className="p-0">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-14 h-14 border-2 border-background shadow-lg">
                            <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-lg">
                              {instructor.name.split(" ").map((n) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-foreground">{instructor.name}</h3>
                            <p className="text-sm text-muted-foreground">{instructor.specialization}</p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditInstructor(instructor)}>
                              <Edit className="w-4 h-4 mr-2" />Edit Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" />View Courses
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Mail className="w-4 h-4 mr-2" />Send Email
                            </DropdownMenuItem>
                            {instructor.status === "pending" && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleApprove(instructor)} className="text-emerald-600">
                                  <CheckCircle className="w-4 h-4 mr-2" />Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleReject(instructor)} className="text-red-600">
                                  <XCircle className="w-4 h-4 mr-2" />Reject
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="mt-3">{getStatusBadge(instructor.status)}</div>
                    </div>

                    {/* Stats */}
                    <div className="p-4 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-secondary/50 rounded-xl">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <BookOpen className="w-4 h-4 text-primary" />
                            <span className="text-lg font-bold text-foreground">{instructor.coursesTaught}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Courses</p>
                        </div>
                        <div className="text-center p-3 bg-secondary/50 rounded-xl">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <Users className="w-4 h-4 text-accent" />
                            <span className="text-lg font-bold text-foreground">{(instructor.totalStudents || 0).toLocaleString()}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Students</p>
                        </div>
                      </div>

                    <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm text-muted-foreground">Revenue</span>
                      </div>
                      <span className="font-bold text-foreground">${instructor.totalRevenue.toLocaleString()}</span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                          <span className="font-medium text-foreground">{instructor.rating}</span>
                          <span className="text-muted-foreground">({instructor.reviewCount} reviews)</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Completion Rate</span>
                          <span className="font-medium text-foreground">{instructor.completionRate}%</span>
                        </div>
                        <Progress value={instructor.completionRate} className="h-2" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Instructor</DialogTitle>
              <DialogDescription>Update instructor information.</DialogDescription>
            </DialogHeader>
            {editingInstructor && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={editingInstructor.name}
                    onChange={(e) => setEditingInstructor({ ...editingInstructor, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={editingInstructor.email}
                    onChange={(e) => setEditingInstructor({ ...editingInstructor, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialization">Specialization</Label>
                  <Input
                    id="specialization"
                    value={editingInstructor.specialization}
                    onChange={(e) => setEditingInstructor({ ...editingInstructor, specialization: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={editingInstructor.status}
                    onValueChange={(value: "active" | "inactive" | "pending") =>
                      setEditingInstructor({ ...editingInstructor, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveInstructor}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
