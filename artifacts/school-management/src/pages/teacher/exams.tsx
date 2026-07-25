import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListExams, useCreateExam, useUpdateExam,
  useListClasses, useListSubjects, getListExamsQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, ClipboardList, Calendar } from "lucide-react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  ongoing: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
};

export default function TeacherExams() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ title: "", classId: "", subjectId: "", examDate: "", startTime: "", endTime: "", totalMarks: "100", passingMarks: "40", venue: "" });

  const { data: exams, isLoading } = useListExams();
  const { data: classes } = useListClasses();
  const { data: subjects } = useListSubjects();
  const createMutation = useCreateExam();
  const updateMutation = useUpdateExam();

  const mySubjects = user ? (subjects ?? []).filter(s => s.teacherId === user.id) : (subjects ?? []);
  const filteredSubjects = form.classId ? mySubjects.filter(s => s.classId === parseInt(form.classId)) : mySubjects;
  const myExams = user ? (exams ?? []).filter(e => {
    const subjectIds = mySubjects.map(s => s.id);
    return subjectIds.includes(e.subjectId);
  }) : (exams ?? []);

  function openCreate() {
    setEditingId(null);
    setForm({ title: "", classId: "", subjectId: "", examDate: "", startTime: "", endTime: "", totalMarks: "100", passingMarks: "40", venue: "" });
    setOpen(true);
  }

  function openEdit(e: NonNullable<typeof exams>[0]) {
    setEditingId(e.id);
    setForm({ title: e.title, classId: e.classId.toString(), subjectId: e.subjectId.toString(), examDate: e.examDate, startTime: e.startTime ?? "", endTime: e.endTime ?? "", totalMarks: (e.totalMarks ?? 100).toString(), passingMarks: (e.passingMarks ?? 40).toString(), venue: e.venue ?? "" });
    setOpen(true);
  }

  async function handleSave() {
    try {
      const data = { title: form.title, classId: parseInt(form.classId), subjectId: parseInt(form.subjectId), examDate: form.examDate, startTime: form.startTime || undefined, endTime: form.endTime || undefined, totalMarks: parseInt(form.totalMarks), passingMarks: parseInt(form.passingMarks), venue: form.venue || undefined };
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data });
        toast.success("Exam updated");
      } else {
        await createMutation.mutateAsync({ data });
        toast.success("Exam scheduled");
      }
      qc.invalidateQueries({ queryKey: getListExamsQueryKey() });
      setOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    }
  }

  return (
    <div className="p-8 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Exams</h1>
          <p className="text-muted-foreground mt-1">View and schedule exams for your subjects</p>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" /> Schedule Exam</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : myExams.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">No exams scheduled</div>
          ) : (
            <div className="divide-y">
              {myExams.map(e => (
                <div key={e.id} className="flex items-center justify-between px-6 py-4 hover:bg-muted/30">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-full bg-orange-100 dark:bg-orange-950 flex items-center justify-center">
                      <ClipboardList className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <div className="font-medium">{e.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {e.subjectName} · <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" />{e.examDate}</span>
                        {e.venue && ` · ${e.venue}`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">{e.totalMarks} marks</span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[e.status]}`}>{e.status}</span>
                    <Button size="icon" variant="ghost" onClick={() => openEdit(e)}><Pencil className="w-4 h-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? "Edit Exam" : "Schedule Exam"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label>Title</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Mid-Term Test" />
              </div>
              <div className="space-y-1.5">
                <Label>Class</Label>
                <select className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm" value={form.classId} onChange={e => setForm(f => ({ ...f, classId: e.target.value, subjectId: "" }))}>
                  <option value="">Select class</option>
                  {classes?.map(c => <option key={c.id} value={c.id}>{c.name} {c.section}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Subject</Label>
                <select className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm" value={form.subjectId} onChange={e => setForm(f => ({ ...f, subjectId: e.target.value }))}>
                  <option value="">Select subject</option>
                  {filteredSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5"><Label>Exam Date</Label><Input type="date" value={form.examDate} onChange={e => setForm(f => ({ ...f, examDate: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Venue</Label><Input value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))} placeholder="e.g. Hall A" /></div>
              <div className="space-y-1.5"><Label>Start Time</Label><Input type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>End Time</Label><Input type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Total Marks</Label><Input type="number" value={form.totalMarks} onChange={e => setForm(f => ({ ...f, totalMarks: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Passing Marks</Label><Input type="number" value={form.passingMarks} onChange={e => setForm(f => ({ ...f, passingMarks: e.target.value }))} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
              {editingId ? "Save Changes" : "Schedule Exam"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
