import { useListTimetable } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock } from "lucide-react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

const dayColors: Record<string, string> = {
  Monday: "bg-blue-100 dark:bg-blue-950",
  Tuesday: "bg-violet-100 dark:bg-violet-950",
  Wednesday: "bg-emerald-100 dark:bg-emerald-950",
  Thursday: "bg-amber-100 dark:bg-amber-950",
  Friday: "bg-rose-100 dark:bg-rose-950",
  Saturday: "bg-slate-100 dark:bg-slate-800",
};

export default function TeacherTimetable() {
  const { user } = useAuth();
  const { data: entries, isLoading } = useListTimetable(user ? { teacherId: user.id } : undefined);

  const grouped = DAYS.reduce((acc, day) => {
    acc[day] = (entries ?? []).filter(e => e.dayOfWeek === day).sort((a, b) => a.startTime.localeCompare(b.startTime));
    return acc;
  }, {} as Record<string, NonNullable<typeof entries>>);

  if (isLoading) {
    return (
      <div className="p-8 space-y-6 max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight">My Timetable</h1>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const activeDays = DAYS.filter(d => grouped[d].length > 0);

  return (
    <div className="p-8 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Timetable</h1>
        <p className="text-muted-foreground mt-1">Your weekly teaching schedule</p>
      </div>

      {activeDays.length === 0 ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground">No timetable entries assigned to you</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {activeDays.map(day => (
            <Card key={day} className="overflow-hidden">
              <CardHeader className={`py-3 px-6 ${dayColors[day]}`}>
                <CardTitle className="text-base font-semibold">{day}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {grouped[day].map(e => (
                    <div key={e.id} className="flex items-center gap-6 px-6 py-3">
                      <div className="flex items-center gap-2 text-sm font-mono text-muted-foreground w-32 flex-shrink-0">
                        <Clock className="w-3.5 h-3.5" />
                        {e.startTime} — {e.endTime}
                      </div>
                      <div className="flex-1">
                        <span className="font-medium">{e.subjectName}</span>
                        {e.className && <Badge variant="secondary" className="ml-2 text-xs">{e.className}</Badge>}
                      </div>
                      {e.room && <Badge variant="outline" className="text-xs">{e.room}</Badge>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
