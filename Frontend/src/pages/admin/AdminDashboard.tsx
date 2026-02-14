import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Users,
  GraduationCap,
  BookOpen,
  TrendingUp,
  Activity,
  DollarSign,
  UserPlus,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AdminLayout from "@/components/layouts/AdminLayout";
import { adminService } from "@/services/admin";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from "recharts";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLive, setIsLive] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      const data = await adminService.getAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    if (!isLive) return;
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [isLive, fetchDashboardData]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading dashboard data...</p>
        </div>
      </AdminLayout>
    );
  }

  const statCards = [
    {
      title: "Total Users",
      value: (analytics?.totalUsers || 0).toLocaleString(),
      change: "+0%",
      trend: "up",
      icon: Users,
      iconBg: "bg-primary",
      iconFg: "text-primary-foreground",
    },
    {
      title: "Instructors",
      value: (analytics?.totalInstructors || 0).toLocaleString(),
      change: "+0%",
      trend: "up",
      icon: GraduationCap,
      iconBg: "bg-accent",
      iconFg: "text-accent-foreground",
    },
    {
      title: "Total Courses",
      value: (analytics?.totalCourses || 0).toLocaleString(),
      change: "+0%",
      trend: "up",
      icon: BookOpen,
      iconBg: "bg-success",
      iconFg: "text-success-foreground",
    },
    {
      title: "Total Revenue",
      value: `$${(analytics?.totalRevenue || 0).toLocaleString()}`,
      change: "+0%",
      trend: "up",
      icon: DollarSign,
      iconBg: "bg-warning",
      iconFg: "text-warning-foreground",
    },
  ];

  const weeklyData = analytics?.userGrowth?.length > 0
    ? analytics.userGrowth.map((g: any) => ({
      day: `Month ${g.month}`,
      users: g.total,
      enrollments: 0,
      revenue: 0
    }))
    : [
      { day: "Mon", users: 0, enrollments: 0, revenue: 0 },
    ];

  const recentActivity = analytics?.recentActivity?.length > 0
    ? analytics.recentActivity.map((a: any) => ({
      user: a.userID?.name || "Unknown",
      action: a.action ? a.action.replace(/_/g, ' ') : "Activity",
      target: a.details || "Platform",
      time: new Date(a.createdAt).toLocaleTimeString(),
      type: a.action
    }))
    : [];

  const topCourses = analytics?.coursePerformance?.length > 0
    ? analytics.coursePerformance.map((c: any) => ({
      name: c.title,
      students: c.enrollments,
      rating: 0,
      revenue: c.price * c.enrollments
    }))
    : [];

  const liveStats = [
    {
      label: "Active Now",
      value: analytics?.activeNow || 0,
      icon: Activity,
      iconBg: "bg-primary",
      iconFg: "text-primary-foreground",
    },
    {
      label: "New Signups Today",
      value: analytics?.newSignups || 0,
      icon: UserPlus,
      iconBg: "bg-accent",
      iconFg: "text-accent-foreground",
    },
    {
      label: "Avg. Session",
      value: `${analytics?.avgSessionTime || 0}m`,
      icon: Clock,
      iconBg: "bg-success",
      iconFg: "text-success-foreground",
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Platform overview and real-time analytics
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={isLive ? "default" : "secondary"}
              className="cursor-pointer"
              onClick={() => setIsLive(!isLive)}
            >
              <span className={`w-2 h-2 rounded-full mr-2 ${isLive ? "bg-green-400 animate-pulse" : "bg-muted-foreground"}`} />
              {isLive ? "Live" : "Paused"}
            </Badge>
          </div>
        </div>

        {/* Live Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 border border-primary/20 rounded-2xl p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            {liveStats.map((stat, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl ${stat.iconBg} flex items-center justify-center shadow-lg ring-1 ring-border/20`}>
                  <stat.icon className={`w-6 h-6 ${stat.iconFg}`} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <motion.p
                    key={stat.value}
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    className="text-xl font-bold text-foreground"
                  >
                    {stat.value}
                  </motion.p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="relative overflow-hidden hover-lift">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      <motion.p
                        key={stat.value}
                        initial={{ scale: 1.05 }}
                        animate={{ scale: 1 }}
                        className="text-3xl font-bold text-foreground mt-1"
                      >
                        {stat.value}
                      </motion.p>
                      <div className="flex items-center gap-1 mt-2">
                        {stat.trend === "up" ? (
                          <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4 text-red-500" />
                        )}
                        <span className={`text-sm font-medium ${stat.trend === "up" ? "text-emerald-600" : "text-red-500"}`}>
                          {stat.change}
                        </span>
                        <span className="text-sm text-muted-foreground">vs last month</span>
                      </div>
                    </div>
                    <div className={`w-14 h-14 rounded-xl ${stat.iconBg} flex items-center justify-center shadow-lg ring-1 ring-border/20`}>
                      <stat.icon className={`w-7 h-7 ${stat.iconFg}`} strokeWidth={2.5} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Activity Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Weekly User Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyData}>
                    <defs>
                      <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(173, 58%, 39%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(173, 58%, 39%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 20%, 90%)" />
                    <XAxis dataKey="day" stroke="hsl(220, 10%, 50%)" fontSize={12} />
                    <YAxis stroke="hsl(220, 10%, 50%)" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(0, 0%, 100%)",
                        border: "1px solid hsl(210, 20%, 90%)",
                        borderRadius: "8px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="users"
                      stroke="hsl(173, 58%, 39%)"
                      strokeWidth={2}
                      fill="url(#userGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Weekly Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 20%, 90%)" />
                    <XAxis dataKey="day" stroke="hsl(220, 10%, 50%)" fontSize={12} />
                    <YAxis stroke="hsl(220, 10%, 50%)" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(0, 0%, 100%)",
                        border: "1px solid hsl(210, 20%, 90%)",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="revenue" fill="hsl(12, 76%, 61%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-4 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center shadow-md ${activity.type === "enrollment" ? "bg-primary text-white" :
                        activity.type === "completion" ? "bg-emerald-500 text-white" :
                          activity.type === "course" ? "bg-accent text-white" :
                            activity.type === "certificate" ? "bg-amber-500 text-white" :
                              "bg-purple-500 text-white"
                      }`}>
                      {activity.type === "enrollment" && <BookOpen className="w-5 h-5" />}
                      {activity.type === "completion" && <GraduationCap className="w-5 h-5" />}
                      {activity.type === "course" && <TrendingUp className="w-5 h-5" />}
                      {activity.type === "certificate" && <Activity className="w-5 h-5" />}
                      {activity.type === "signup" && <UserPlus className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">
                        <span className="font-medium">{activity.user}</span>{" "}
                        <span className="text-muted-foreground">{activity.action}</span>{" "}
                        <span className="font-medium">{activity.target}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Courses */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top Performing Courses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topCourses.map((course, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-4 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{course.name}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{course.students.toLocaleString()} students</span>
                        <span>⭐ {course.rating}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground">${(course.revenue / 1000).toFixed(1)}K</p>
                      <p className="text-xs text-muted-foreground">revenue</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
