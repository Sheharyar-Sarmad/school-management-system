import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListAssignments, useCreateAssignment, useUpdateAssignment, useDeleteAssignment,
  useListSubjects, getListAssignmentsQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, FileText, Calendar } from "lucide-react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  closed: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  draft: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
};

export default function TeacherAssignments() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ title: "", description: "", subjectId: "", dueDate: "", totalMarks: "100", status: "active" });

  const { data: assignments, isLoading } = useListAssignments(user ? { teacherId: user.id } : undefined);
  const { data: subjects } = useListSubjects();
  const createMutation = useCreateAssignment();
  const updateMutation = useUpdateAssignment();
  const deleteMutation = useDeleteAssignment();

  const mySubjects = user ? (subjects ?? []).filter(s => s.teacherId === user.id) : (subjects ?? []);

  function openCreate() {
    setEditingId(null);
    setForm({ title: "", description: "", subjectId: "", dueDate: "", totalMarks: "100", status: "active" });
    setOpen(true);
  }

  function openEdit(a: NonNullable<typeof assignments>[0]) {
    setEditingId(a.id);
    setForm({ title: a.title, description: a.description ?? "", subjectId: a.subjectId.toString(), dueDate: a.dueDate, totalMarks: (a.totalMarks ?? 100).toString(), status: a.status });
    setOpen(true);
  }

  async function handleSave() {
    if (!user) return;
    try {
      const selectedSubject = mySubjects.find(s => s.id === parseInt(form.subjectId));
      const data = { title: form.title, description: form.description || undefined, classId: selectedSubject?.classId ?? 0, subjectId: parseInt(form.subjectId), teacherId: user.id, dueDate: form.dueDate, totalMarks: parseInt(form.totalMarks) };
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data });
        toast.success("Assignment updated");
      } else {
        await createMutation.mutateAsync({ data });
        toast.success("Assignment created");
      }
      qc.invalidateQueries({ queryKey: getListAssignmentsQueryKey() });
      setOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync({ id: deleteId });
      toast.success("Assignment deleted");
      qc.invalidateQueries({ queryKey: getListAssignmentsQueryKey() });
    } catch (e: any) {
      toast.error(e.message || "Failed to delete");
    } finally {
      setDeleteId(null);
    }
  }

  return (
    <div className="p-8 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assignments</h1>
          <p className="text-muted-foreground mt-1">Create and manage assignments for your classes</p>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" /> New Assignment</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : (assignments ?? []).length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">No assignments yet</div>
          ) : (
            <div className="divide-y">
              {(assignments ?? []).map(a => (
                <div key={a.id} className="flex items-center justify-between px-6 py-4 hover:bg-muted/30" data-testid={`row-assignment-${a.id}`}>
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-full bg-sky-100 dark:bg-sky-950 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    </div>
                    <div>
                      <div className="font-medium">{a.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {a.subjectName} · <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" />Due {a.dueDate}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {a.totalMarks != null && <span className="text-sm text-muted-foreground">{a.totalMarks} pts</span>}
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[a.status]}`}>{a.status}</span>
                    <Button size="icon" variant="ghost" onClick={() => openEdit(a)}><Pencil className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleteId(a.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? "Edit Assignment" : "New Assignment"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label>Title</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Assignment title" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Description</Label>
                <textarea className="w-full min-h-20 rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Assignment instructions..." />
              </div>
              <div className="space-y-1.5">
                <Label>Subject</Label>
                <select className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm" value={form.subjectId} onChange={e => setForm(f => ({ ...f, subjectId: e.target.value }))}>
                  <option value="">Select subject</option>
                  {mySubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Due Date</Label>
                <Input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Total Marks</Label>
                <Input type="number" value={form.totalMarks} onChange={e => setForm(f => ({ ...f, totalMarks: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <select className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
              {editingId ? "Save Changes" : "Create Assignment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={o => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Assignment</AlertDialogTitle><AlertDialogDescription>This will permanently delete this assignment.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
