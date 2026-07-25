import { useListAssignments } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Calendar, AlertCircle } from "lucide-react";

const statusConfig: Record<string, { cls: string }> = {
  active: { cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" },
  closed: { cls: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
  draft: { cls: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400" },
};

export default function StudentAssignments() {
  const { user } = useAuth();
  const { data: assignments, isLoading } = useListAssignments(user?.classId ? { classId: user.classId } : undefined);

  const today = new Date().toISOString().split("T")[0];
  const overdue = (assignments ?? []).filter(a => a.status === "active" && a.dueDate < today);
  const upcoming = (assignments ?? []).filter(a => a.status === "active" && a.dueDate >= today);
  const closed = (assignments ?? []).filter(a => a.status === "closed");

  const Section = ({ title, items, emptyMsg }: { title: string; items: NonNullable<typeof assignments>; emptyMsg: string }) => (
    <div>
      <h2 className="text-base font-semibold mb-3 text-muted-foreground">{title} ({items.length})</h2>
      {items.length === 0 ? (
        <div className="text-sm text-muted-foreground py-2">{emptyMsg}</div>
      ) : (
        <div className="space-y-2">
          {items.map(a => (
            <Card key={a.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-950 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <FileText className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    </div>
                    <div>
                      <div className="font-medium">{a.title}</div>
                      <div className="text-sm text-muted-foreground mt-0.5">{a.subjectName}</div>
                      {a.description && <div className="text-sm text-muted-foreground mt-1 line-clamp-2">{a.description}</div>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[a.status]?.cls}`}>{a.status}</span>
                    <div className={`flex items-center gap-1 text-xs ${a.dueDate < today && a.status === "active" ? "text-red-500 font-medium" : "text-muted-foreground"}`}>
                      {a.dueDate < today && a.status === "active" && <AlertCircle className="w-3 h-3" />}
                      <Calendar className="w-3 h-3" />
                      Due {a.dueDate}
                    </div>
                    {a.totalMarks != null && <div className="text-xs text-muted-foreground">{a.totalMarks} pts</div>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="p-8 space-y-6 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight">My Assignments</h1>
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Assignments</h1>
        <p className="text-muted-foreground mt-1">View all your assignments and due dates</p>
      </div>
      {overdue.length > 0 && (
        <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div className="text-sm text-red-700 dark:text-red-400 font-medium">
            You have {overdue.length} overdue assignment{overdue.length > 1 ? "s" : ""}!
          </div>
        </div>
      )}
      <Section title="Active" items={[...overdue, ...upcoming]} emptyMsg="No active assignments" />
      <Section title="Completed" items={closed} emptyMsg="No completed assignments" />
    </div>
  );
}
