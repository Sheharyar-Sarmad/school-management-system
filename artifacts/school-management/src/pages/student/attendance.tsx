import { useListAttendance, useGetAttendanceSummary } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const statusConfig: Record<string, { cls: string; label: string }> = {
  present: { cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400", label: "Present" },
  absent: { cls: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400", label: "Absent" },
  late: { cls: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400", label: "Late" },
  excused: { cls: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400", label: "Excused" },
};

export default function StudentAttendance() {
  const { user } = useAuth();
  const { data: attendance, isLoading } = useListAttendance(user ? { studentId: user.id } : undefined);
  const { data: summary } = useGetAttendanceSummary(user ? { studentId: user.id } : undefined);

  const sorted = [...(attendance ?? [])].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="p-8 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Attendance</h1>
        <p className="text-muted-foreground mt-1">Track your daily attendance record</p>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "Total Days", value: summary.totalDays },
            { label: "Present", value: summary.presentDays, cls: "text-emerald-600" },
            { label: "Absent", value: summary.absentDays, cls: "text-red-600" },
            { label: "Late", value: summary.lateDays, cls: "text-amber-600" },
            { label: "Attendance Rate", value: `${summary.attendanceRate}%`, cls: "text-blue-600" },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">{s.label}</div>
                <div className={`text-2xl font-bold mt-1 ${s.cls ?? ""}`}>{s.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Recent Attendance</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : sorted.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No attendance records</div>
          ) : (
            <div className="divide-y max-h-96 overflow-y-auto">
              {sorted.map(a => (
                <div key={a.id} className="flex items-center justify-between px-6 py-3 hover:bg-muted/30">
                  <div>
                    <div className="font-medium text-sm">{a.date}</div>
                    {a.notes && <div className="text-xs text-muted-foreground">{a.notes}</div>}
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[a.status]?.cls}`}>
                    {statusConfig[a.status]?.label ?? a.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
