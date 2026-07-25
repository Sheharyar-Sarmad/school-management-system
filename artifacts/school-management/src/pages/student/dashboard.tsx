import { useGetStudentDashboard } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, FileText, ClipboardList, CreditCard, Bell } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function StudentDashboard() {
  const { user } = useAuth();
  const { data: dashboard, isLoading } = useGetStudentDashboard(user?.id ?? 0);

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-10 w-1/3 mb-6" />
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
        <h1 className="text-3xl font-bold tracking-tight">Welcome, {dashboard.student.name}</h1>
        <p className="text-muted-foreground mt-1">Here is your academic overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm border-l-4 border-l-primary">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-primary/10 text-primary rounded-lg"><Clock className="w-5 h-5" /></div>
            </div>
            <p className="text-sm font-medium text-muted-foreground">Attendance Rate</p>
            <h3 className="text-3xl font-bold tracking-tight mt-1">{dashboard.attendanceRate}%</h3>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-l-4 border-l-amber-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg"><FileText className="w-5 h-5" /></div>
            </div>
            <p className="text-sm font-medium text-muted-foreground">Pending Assignments</p>
            <h3 className="text-3xl font-bold tracking-tight mt-1">{dashboard.pendingAssignments}</h3>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg"><ClipboardList className="w-5 h-5" /></div>
            </div>
            <p className="text-sm font-medium text-muted-foreground">Upcoming Exams</p>
            <h3 className="text-3xl font-bold tracking-tight mt-1">{dashboard.upcomingExams?.length || 0}</h3>
          </CardContent>
        </Card>

        <Card className={`shadow-sm border-l-4 ${
          dashboard.feeStatus === 'clear' ? 'border-l-emerald-500' : 
          dashboard.feeStatus === 'pending' ? 'border-l-amber-500' : 'border-l-red-500'
        }`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg ${
                dashboard.feeStatus === 'clear' ? 'bg-emerald-500/10 text-emerald-500' : 
                dashboard.feeStatus === 'pending' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'
              }`}><CreditCard className="w-5 h-5" /></div>
            </div>
            <p className="text-sm font-medium text-muted-foreground">Fee Status</p>
            <h3 className="text-2xl font-bold tracking-tight mt-1 capitalize">{dashboard.feeStatus || 'Clear'}</h3>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle>Recent Results</CardTitle>
            <CardDescription>Your latest academic performance</CardDescription>
          </CardHeader>
          <CardContent>
            {dashboard.recentResults && dashboard.recentResults.length > 0 ? (
              <div className="space-y-4">
                {dashboard.recentResults.map((result) => (
                  <div key={result.id} className="flex justify-between items-center p-4 rounded-lg border">
                    <div>
                      <h4 className="font-semibold text-lg">{result.examTitle}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {format(new Date(result.createdAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-bold text-2xl">
                          {result.marksObtained} <span className="text-sm font-normal text-muted-foreground">/ {result.totalMarks}</span>
                        </div>
                      </div>
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                        result.isPassed 
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {result.grade || (result.isPassed ? 'P' : 'F')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground border rounded-lg border-dashed">
                No recent results available
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            {dashboard.notifications && dashboard.notifications.length > 0 ? (
              <div className="space-y-4">
                {dashboard.notifications.map((notification) => (
                  <div key={notification.id} className={`p-3 rounded-lg border ${!notification.isRead ? 'bg-primary/5 border-primary/20' : ''}`}>
                    <div className="flex justify-between items-start mb-1">
                      <h4 className={`font-medium text-sm ${!notification.isRead ? 'text-primary' : ''}`}>
                        {notification.title}
                      </h4>
                      {!notification.isRead && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                    <div className="mt-2 text-[10px] text-muted-foreground">
                      {format(new Date(notification.createdAt), 'MMM d, h:mm a')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground py-8">
                No new notifications
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}