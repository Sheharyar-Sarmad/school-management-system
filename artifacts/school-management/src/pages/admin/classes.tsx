import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListClasses, useCreateClass, useUpdateClass, useDeleteClass,
  useListUsers, getListClassesQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, Building, Users } from "lucide-react";
import { toast } from "sonner";

export default function AdminClasses() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", section: "", grade: "", teacherId: "" });

  const { data: classes, isLoading } = useListClasses();
  const { data: teachers } = useListUsers({ role: "teacher" });
  const createMutation = useCreateClass();
  const updateMutation = useUpdateClass();
  const deleteMutation = useDeleteClass();

  function openCreate() {
    setEditingId(null);
    setForm({ name: "", section: "", grade: "", teacherId: "" });
    setOpen(true);
  }

  function openEdit(c: NonNullable<typeof classes>[0]) {
    setEditingId(c.id);
    setForm({ name: c.name, section: c.section, grade: c.grade ?? "", teacherId: c.teacherId?.toString() ?? "" });
    setOpen(true);
  }

  async function handleSave() {
    try {
      const data = { name: form.name, section: form.section, grade: form.grade || undefined, teacherId: form.teacherId ? parseInt(form.teacherId) : null };
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data });
        toast.success("Class updated");
      } else {
        await createMutation.mutateAsync({ data });
        toast.success("Class created");
      }
      qc.invalidateQueries({ queryKey: getListClassesQueryKey() });
      setOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync({ id: deleteId });
      toast.success("Class deleted");
      qc.invalidateQueries({ queryKey: getListClassesQueryKey() });
    } catch (e: any) {
      toast.error(e.message || "Failed to delete");
    } finally {
      setDeleteId(null);
    }
  }

  return (
    <div className="p-8 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Classes</h1>
          <p className="text-muted-foreground mt-1">Manage class sections and homeroom teachers</p>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" /> Add Class</Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
        </div>
      ) : (classes ?? []).length === 0 ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground">No classes yet</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(classes ?? []).map(c => (
            <Card key={c.id} className="hover:shadow-md transition-shadow" data-testid={`card-class-${c.id}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(c)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(c.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
                <h3 className="text-lg font-bold">{c.name} — Section {c.section}</h3>
                {c.grade && <p className="text-sm text-muted-foreground">Grade {c.grade}</p>}
                <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {c.studentCount} students</span>
                </div>
                {c.teacherName && <Badge variant="secondary" className="mt-3">{c.teacherName}</Badge>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? "Edit Class" : "Add Class"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Class Name</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Class 10" />
              </div>
              <div className="space-y-1.5">
                <Label>Section</Label>
                <Input value={form.section} onChange={e => setForm(f => ({ ...f, section: e.target.value }))} placeholder="e.g. A" />
              </div>
              <div className="space-y-1.5">
                <Label>Grade</Label>
                <Input value={form.grade} onChange={e => setForm(f => ({ ...f, grade: e.target.value }))} placeholder="e.g. 10" />
              </div>
              <div className="space-y-1.5">
                <Label>Homeroom Teacher</Label>
                <select className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm" value={form.teacherId} onChange={e => setForm(f => ({ ...f, teacherId: e.target.value }))}>
                  <option value="">None</option>
                  {teachers?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
              {editingId ? "Save Changes" : "Create Class"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={o => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Class</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this class section.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
