import { useListExams, useListClasses } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardList, Calendar, Clock, MapPin } from "lucide-react";

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  ongoing: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  completed: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
};

export default function StudentExams() {
  const { user } = useAuth();
  const { data: classes } = useListClasses();
  const { data: exams, isLoading } = useListExams();

  const myClass = user ? classes?.find(c => c.id === user.classId) : undefined;
  const myExams = myClass
    ? (exams ?? []).filter(e => e.classId === myClass.id)
    : (exams ?? []);

  const today = new Date().toISOString().split("T")[0];
  const upcoming = myExams.filter(e => e.examDate >= today && e.status !== "cancelled" && e.status !== "completed");
  const past = myExams.filter(e => e.examDate < today || e.status === "completed");

  const ExamCard = ({ e }: { e: NonNullable<typeof exams>[0] }) => (
    <Card className="hover:shadow-md transition-shadow" data-testid={`card-exam-${e.id}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-950 flex items-center justify-center flex-shrink-0">
              <ClipboardList className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <div className="font-semibold text-base">{e.title}</div>
              <div className="text-sm text-muted-foreground mt-0.5">{e.subjectName}</div>
              <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{e.examDate}</span>
                {e.startTime && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{e.startTime}{e.endTime ? ` — ${e.endTime}` : ""}</span>}
                {e.venue && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{e.venue}</span>}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[e.status]}`}>{e.status}</span>
            <div className="text-xs text-muted-foreground">{e.totalMarks} marks · Pass: {e.passingMarks}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="p-8 space-y-6 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight">My Exams</h1>
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}</div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Exams</h1>
        <p className="text-muted-foreground mt-1">View your upcoming and past examinations</p>
      </div>

      {upcoming.length > 0 && (
        <div>
          <h2 className="text-base font-semibold mb-3 text-muted-foreground">Upcoming ({upcoming.length})</h2>
          <div className="space-y-3">{upcoming.map(e => <ExamCard key={e.id} e={e} />)}</div>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <h2 className="text-base font-semibold mb-3 text-muted-foreground">Past Exams ({past.length})</h2>
          <div className="space-y-3">{past.map(e => <ExamCard key={e.id} e={e} />)}</div>
        </div>
      )}

      {myExams.length === 0 && (
        <Card><CardContent className="p-12 text-center text-muted-foreground">No exams scheduled for your class</CardContent></Card>
      )}
    </div>
  );
}
