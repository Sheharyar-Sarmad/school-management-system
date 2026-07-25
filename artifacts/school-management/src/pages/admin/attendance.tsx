import { useState } from "react";
import {
  useListAttendance, useGetAttendanceSummary, useGetAttendanceAnalytics,
  useListClasses,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const statusColors: Record<string, string> = {
  present: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  absent: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
  late: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  excused: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
};

export default function AdminAttendance() {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [classId, setClassId] = useState<number | undefined>();

  const { data: classes } = useListClasses();
  const { data: attendance, isLoading } = useListAttendance({ date, ...(classId ? { classId } : {}) });
  const { data: summary } = useGetAttendanceSummary(classId ? { classId } : undefined);
  const { data: analytics, isLoading: analyticsLoading } = useGetAttendanceAnalytics({ months: 6, ...(classId ? { classId } : {}) });

  return (
    <div className="p-8 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Attendance Overview</h1>
        <p className="text-muted-foreground mt-1">Monitor student attendance across all classes</p>
      </div>

      <div className="flex gap-4 flex-wrap">
        <div className="space-y-1">
          <label className="text-sm font-medium">Date</label>
          <input type="date" className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Class</label>
          <select className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm" value={classId ?? ""} onChange={e => setClassId(e.target.value ? parseInt(e.target.value) : undefined)}>
            <option value="">All Classes</option>
            {classes?.map(c => <option key={c.id} value={c.id}>{c.name} {c.section}</option>)}
          </select>
        </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daily Attendance — {date}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : (attendance ?? []).length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No attendance records for this date</div>
            ) : (
              <div className="divide-y max-h-80 overflow-y-auto">
                {(attendance ?? []).map(a => (
                  <div key={a.id} className="flex items-center justify-between px-6 py-3 hover:bg-muted/30">
                    <div className="font-medium text-sm">{a.studentName}</div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[a.status]}`}>{a.status}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">6-Month Attendance Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? <Skeleton className="h-48 w-full" /> : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={analytics ?? []} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="presentRate" name="Present %" fill="hsl(var(--chart-2))" radius={[4,4,0,0]} />
                  <Bar dataKey="absentRate" name="Absent %" fill="hsl(var(--chart-4))" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
