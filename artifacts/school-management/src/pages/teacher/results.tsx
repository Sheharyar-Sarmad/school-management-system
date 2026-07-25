import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListExams, useListResults, useCreateResult, useUpdateResult,
  useListSubjects, useListUsers, getListResultsQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Award } from "lucide-react";
import { toast } from "sonner";

const gradeColors: Record<string, string> = {
  A: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400",
  B: "text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400",
  C: "text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-400",
  D: "text-orange-600 bg-orange-50 dark:bg-orange-950 dark:text-orange-400",
  F: "text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400",
};

export default function TeacherResults() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [examId, setExamId] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ studentId: "", marksObtained: "", remarks: "" });

  const { data: exams } = useListExams();
  const { data: subjects } = useListSubjects();
  const { data: results, isLoading } = useListResults(examId ? { examId } : undefined);
  const { data: students } = useListUsers({ role: "student" });
  const createMutation = useCreateResult();
  const updateMutation = useUpdateResult();

  const mySubjectIds = user ? (subjects ?? []).filter(s => s.teacherId === user.id).map(s => s.id) : [];
  const myExams = user ? (exams ?? []).filter(e => mySubjectIds.includes(e.subjectId)) : (exams ?? []);
  const selectedExam = myExams.find(e => e.id === examId);

  function openEntry(studentId?: number, existingResult?: NonNullable<typeof results>[0]) {
    if (existingResult) {
      setEditingId(existingResult.id);
      setForm({ studentId: existingResult.studentId.toString(), marksObtained: existingResult.marksObtained.toString(), remarks: existingResult.remarks ?? "" });
    } else {
      setEditingId(null);
      setForm({ studentId: studentId?.toString() ?? "", marksObtained: "", remarks: "" });
    }
    setOpen(true);
  }

  async function handleSave() {
    if (!examId || !selectedExam) return;
    try {
      const data = { examId, studentId: parseInt(form.studentId), marksObtained: parseFloat(form.marksObtained), remarks: form.remarks || undefined };
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data });
        toast.success("Result updated");
      } else {
        await createMutation.mutateAsync({ data });
        toast.success("Result entered");
      }
      qc.invalidateQueries({ queryKey: getListResultsQueryKey() });
      setOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    }
  }

  const resultMap = Object.fromEntries((results ?? []).map(r => [r.studentId, r]));

  return (
    <div className="p-8 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Results</h1>
        <p className="text-muted-foreground mt-1">Enter and manage exam results</p>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Select Exam</label>
        <select className="block h-9 rounded-md border border-input bg-background px-3 py-1 text-sm" value={examId ?? ""} onChange={e => setExamId(e.target.value ? parseInt(e.target.value) : null)}>
          <option value="">Choose an exam...</option>
          {myExams.map(e => <option key={e.id} value={e.id}>{e.title} ({e.subjectName}, {e.examDate})</option>)}
        </select>
      </div>

      {!examId ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground">Select an exam to manage results</CardContent></Card>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              <span>Results — {selectedExam?.title}</span>
              <Button size="sm" onClick={() => openEntry()}><Plus className="w-3.5 h-3.5 mr-1" /> Add Result</Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : (results ?? []).length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No results entered yet</div>
            ) : (
              <div className="divide-y">
                {(results ?? []).map(r => (
                  <div key={r.id} className="flex items-center justify-between px-6 py-3 hover:bg-muted/30">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Award className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{r.studentName}</div>
                        {r.remarks && <div className="text-xs text-muted-foreground">{r.remarks}</div>}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-semibold">{r.marksObtained}/{selectedExam?.totalMarks}</span>
                      {r.grade && (
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${gradeColors[r.grade[0]] ?? ""}`}>{r.grade}</span>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => openEntry(undefined, r)}>Edit</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? "Edit Result" : "Enter Result"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Student</Label>
              <select className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm" value={form.studentId} onChange={e => setForm(f => ({ ...f, studentId: e.target.value }))}>
                <option value="">Select student</option>
                {students?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Marks Obtained {selectedExam && `(out of ${selectedExam.totalMarks})`}</Label>
              <Input type="number" value={form.marksObtained} onChange={e => setForm(f => ({ ...f, marksObtained: e.target.value }))} placeholder="0" max={selectedExam?.totalMarks} />
            </div>
            <div className="space-y-1.5">
              <Label>Remarks</Label>
              <Input value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} placeholder="Optional remarks" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
              {editingId ? "Update" : "Save Result"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
