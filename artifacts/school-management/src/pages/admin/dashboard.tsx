import { useGetAdminDashboard, useGetAttendanceAnalytics } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, BookOpen, GraduationCap, Building, Bell, Calendar as CalendarIcon, Clock, CreditCard } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { format } from "date-fns";

export default function AdminDashboard() {
  const { data: dashboard, isLoading } = useGetAdminDashboard();
  const { data: analytics, isLoading: isAnalyticsLoading } = useGetAttendanceAnalytics({ months: 6 });

  if (isLoading || isAnalyticsLoading) {
    return (
      <div className="p-8 space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-[400px] w-full rounded-xl" />
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!dashboard) return null;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Dashboard Overview</h1>
        <p className="text-muted-foreground mt-1">Welcome back. Here is what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Students" 
          value={dashboard.totalStudents.toString()} 
          icon={<Users className="w-5 h-5" />} 
          trend="+2% from last month"
          trendUp={true}
        />
        <StatCard 
          title="Total Teachers" 
          value={dashboard.totalTeachers.toString()} 
          icon={<GraduationCap className="w-5 h-5" />} 
        />
        <StatCard 
          title="Active Classes" 
          value={dashboard.totalClasses.toString()} 
          icon={<Building className="w-5 h-5" />} 
        />
        <StatCard 
          title="Subjects Taught" 
          value={dashboard.totalSubjects.toString()} 
          icon={<BookOpen className="w-5 h-5" />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Today's Attendance" 
          value={`${dashboard.todayAttendanceRate}%`} 
          icon={<Clock className="w-5 h-5 text-emerald-500" />} 
          className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/50"
          valueClassName="text-emerald-700 dark:text-emerald-400"
        />
        <StatCard 
          title="Pending Leaves" 
          value={dashboard.pendingLeaves.toString()} 
          icon={<CalendarIcon className="w-5 h-5 text-amber-500" />} 
          className="bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/50"
          valueClassName="text-amber-700 dark:text-amber-400"
        />
        <StatCard 
          title="Pending Fees" 
          value={dashboard.pendingFees.toString()} 
          icon={<CreditCard className="w-5 h-5 text-red-500" />} 
          className="bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/50"
          valueClassName="text-red-700 dark:text-red-400"
        />
        <StatCard 
          title="Total Revenue" 
          value={`$${dashboard.totalRevenue?.toLocaleString() || '0'}`} 
          icon={<CreditCard className="w-5 h-5 text-blue-500" />} 
          className="bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/50"
          valueClassName="text-blue-700 dark:text-blue-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle>Attendance Trends</CardTitle>
            <CardDescription>Average attendance rate over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {analytics && analytics.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      domain={[0, 100]}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
                      itemStyle={{ color: 'var(--foreground)' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="presentRate" 
                      name="Present %"
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      dot={{ r: 4, strokeWidth: 2 }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">No data available</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Recent Announcements
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            {dashboard.recentAnnouncements && dashboard.recentAnnouncements.length > 0 ? (
              <div className="space-y-4">
                {dashboard.recentAnnouncements.map((announcement) => (
                  <div key={announcement.id} className="pb-4 border-b last:border-0 last:pb-0">
                    <h4 className="font-semibold text-sm line-clamp-1">{announcement.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{announcement.content}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] bg-secondary px-2 py-0.5 rounded-full capitalize">
                        {announcement.targetRole}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(announcement.createdAt), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground py-8">
                No recent announcements
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  icon, 
  trend, 
  trendUp, 
  className = "", 
  valueClassName = "" 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode; 
  trend?: string; 
  trendUp?: boolean;
  className?: string;
  valueClassName?: string;
}) {
  return (
    <Card className={`shadow-sm ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="p-2 bg-background/50 rounded-lg backdrop-blur-sm shadow-sm border">
            {icon}
          </div>
          {trend && (
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
              trendUp ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            }`}>
              {trend}
            </span>
          )}
        </div>
        <div className="mt-4">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className={`text-3xl font-bold tracking-tight mt-1 ${valueClassName}`}>{value}</h3>
        </div>
      </CardContent>
    </Card>
  );
}