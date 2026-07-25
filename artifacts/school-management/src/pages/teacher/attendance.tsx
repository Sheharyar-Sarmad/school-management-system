import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListAttendance, useMarkAttendance,
  useListClasses, useListUsers, getListAttendanceQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, XCircle, Clock, MinusCircle, Check } from "lucide-react";
import { toast } from "sonner";

type AttendanceStatus = "present" | "absent" | "late" | "excused";

const statusConfig: Record<AttendanceStatus, { icon: React.ReactNode; label: string; cls: string }> = {
  present: { icon: <CheckCircle2 className="w-4 h-4" />, label: "Present", cls: "text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400" },
  absent: { icon: <XCircle className="w-4 h-4" />, label: "Absent", cls: "text-red-600 border-red-300 bg-red-50 dark:bg-red-950 dark:text-red-400" },
  late: { icon: <Clock className="w-4 h-4" />, label: "Late", cls: "text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950 dark:text-amber-400" },
  excused: { icon: <MinusCircle className="w-4 h-4" />, label: "Excused", cls: "text-blue-600 border-blue-300 bg-blue-50 dark:bg-blue-950 dark:text-blue-400" },
};

export default function TeacherAttendance() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [classId, setClassId] = useState<number | null>(null);
  const [marks, setMarks] = useState<Record<number, AttendanceStatus>>({});
  const [saving, setSaving] = useState(false);

  const { data: classes } = useListClasses();
  const myClasses = user ? (classes ?? []).filter(c => c.teacherId === user.id) : (classes ?? []);
  const { data: students } = useListUsers({ role: "student", ...(classId ? { classId } : {}) });
  const { data: existingAttendance } = useListAttendance({ date, ...(classId ? { classId } : {}) });
  const markMutation = useMarkAttendance();

  const existingMap = Object.fromEntries((existingAttendance ?? []).map(a => [a.studentId, a.status as AttendanceStatus]));

  function getStatus(studentId: number): AttendanceStatus {
    return marks[studentId] ?? existingMap[studentId] ?? "present";
  }

  function setStatus(studentId: number, status: AttendanceStatus) {
    setMarks(m => ({ ...m, [studentId]: status }));
  }

  async function handleSave() {
    if (!classId || !students?.length) return;
    setSaving(true);
    try {
      for (const s of students) {
        await markMutation.mutateAsync({ data: { studentId: s.id, classId: classId!, date, status: getStatus(s.id) } });
      }
      toast.success("Attendance saved");
      qc.invalidateQueries({ queryKey: getListAttendanceQueryKey() });
      setMarks({});
    } catch (e: any) {
      toast.error(e.message || "Failed to save attendance");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-8 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mark Attendance</h1>
        <p className="text-muted-foreground mt-1">Record daily student attendance</p>
      </div>

      <div className="flex gap-4 flex-wrap">
        <div className="space-y-1">
          <label className="text-sm font-medium">Date</label>
          <input type="date" className="block h-9 rounded-md border border-input bg-background px-3 py-1 text-sm" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Class</label>
          <select className="block h-9 rounded-md border border-input bg-background px-3 py-1 text-sm" value={classId ?? ""} onChange={e => { setClassId(e.target.value ? parseInt(e.target.value) : null); setMarks({}); }}>
            <option value="">Select class</option>
            {myClasses.map(c => <option key={c.id} value={c.id}>{c.name} {c.section}</option>)}
            {myClasses.length === 0 && (classes ?? []).map(c => <option key={c.id} value={c.id}>{c.name} {c.section}</option>)}
          </select>
        </div>
      </div>

      {!classId ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground">Select a class to mark attendance</CardContent></Card>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{(students ?? []).length} students</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {(students ?? []).length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No students in this class</div>
            ) : (
              <div className="divide-y">
                {(students ?? []).map(s => {
                  const current = getStatus(s.id);
                  return (
                    <div key={s.id} className="flex items-center justify-between px-6 py-3">
                      <div className="font-medium text-sm">{s.name}</div>
                      <div className="flex gap-1">
                        {(Object.keys(statusConfig) as AttendanceStatus[]).map(status => (
                          <button
                            key={status}
                            onClick={() => setStatus(s.id, status)}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${current === status ? statusConfig[status].cls + " ring-2 ring-offset-1 ring-current" : "border-border text-muted-foreground hover:bg-muted"}`}
                          >
                            {statusConfig[status].icon}
                            {statusConfig[status].label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {classId && (students ?? []).length > 0 && (
        <Button onClick={handleSave} disabled={saving} className="w-full" size="lg">
          <Check className="w-4 h-4 mr-2" />
          {saving ? "Saving..." : "Save Attendance"}
        </Button>
      )}
    </div>
  );
}
