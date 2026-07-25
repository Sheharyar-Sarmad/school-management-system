import { useGetTeacherDashboard } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, FileText, ClipboardList, Calendar } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function TeacherDashboard() {
  const { user } = useAuth();
  const { data: dashboard, isLoading } = useGetTeacherDashboard(user?.id ?? 0);

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-10 w-1/3 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[400px] w-full rounded-xl" />
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!dashboard) return null;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome, {dashboard.teacher.name}</h1>
        <p className="text-muted-foreground mt-1">Here is your teaching overview for today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-primary/10 text-primary rounded-lg"><Users className="w-5 h-5" /></div>
            </div>
            <p className="text-sm font-medium text-muted-foreground">My Students</p>
            <h3 className="text-3xl font-bold tracking-tight mt-1">{dashboard.totalStudents}</h3>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg"><Calendar className="w-5 h-5" /></div>
            </div>
            <p className="text-sm font-medium text-muted-foreground">My Classes</p>
            <h3 className="text-3xl font-bold tracking-tight mt-1">{dashboard.classesCount}</h3>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg"><FileText className="w-5 h-5" /></div>
            </div>
            <p className="text-sm font-medium text-muted-foreground">Pending Submissions</p>
            <h3 className="text-3xl font-bold tracking-tight mt-1">{dashboard.pendingSubmissions}</h3>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg"><ClipboardList className="w-5 h-5" /></div>
            </div>
            <p className="text-sm font-medium text-muted-foreground">Upcoming Exams</p>
            <h3 className="text-3xl font-bold tracking-tight mt-1">{dashboard.upcomingExams?.length || 0}</h3>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Today's Timetable</CardTitle>
            <CardDescription>Your schedule for the day</CardDescription>
          </CardHeader>
          <CardContent>
            {dashboard.timetable && dashboard.timetable.length > 0 ? (
              <div className="space-y-4">
                {dashboard.timetable.map((entry) => (
                  <div key={entry.id} className="flex items-center gap-4 p-3 rounded-lg border bg-card">
                    <div className="flex flex-col items-center justify-center min-w-20 px-3 py-2 bg-secondary rounded-md text-sm font-medium">
                      <span>{entry.startTime}</span>
                      <span className="text-xs text-muted-foreground">to</span>
                      <span>{entry.endTime}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold">{entry.subjectName}</h4>
                      <p className="text-sm text-muted-foreground">Class: {entry.className} {entry.room ? `• Room: ${entry.room}` : ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
                No classes scheduled for today
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Upcoming Exams</CardTitle>
            <CardDescription>Exams scheduled for your classes</CardDescription>
          </CardHeader>
          <CardContent>
            {dashboard.upcomingExams && dashboard.upcomingExams.length > 0 ? (
              <div className="space-y-4">
                {dashboard.upcomingExams.map((exam) => (
                  <div key={exam.id} className="flex justify-between items-center p-3 rounded-lg border">
                    <div>
                      <h4 className="font-semibold">{exam.title}</h4>
                      <p className="text-sm text-muted-foreground">{exam.className} • {exam.subjectName}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{format(new Date(exam.examDate), 'MMM d, yyyy')}</div>
                      <Badge variant="outline" className="mt-1 capitalize">
                        {exam.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
                No upcoming exams
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}