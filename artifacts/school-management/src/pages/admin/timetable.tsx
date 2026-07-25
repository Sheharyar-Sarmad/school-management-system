import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListTimetable, useCreateTimetableEntry, useUpdateTimetableEntry, useDeleteTimetableEntry,
  useListClasses, useListSubjects, useListUsers, getListTimetableQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

export default function AdminTimetable() {
  const qc = useQueryClient();
  const [classFilter, setClassFilter] = useState<number | undefined>();
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ classId: "", subjectId: "", teacherId: "", dayOfWeek: "Monday" as const, startTime: "", endTime: "", room: "" });

  const { data: classes } = useListClasses();
  const { data: subjects } = useListSubjects();
  const { data: teachers } = useListUsers({ role: "teacher" });
  const { data: entries, isLoading } = useListTimetable(classFilter ? { classId: classFilter } : undefined);
  const createMutation = useCreateTimetableEntry();
  const updateMutation = useUpdateTimetableEntry();
  const deleteMutation = useDeleteTimetableEntry();

  const filteredSubjects = form.classId ? (subjects ?? []).filter(s => s.classId === parseInt(form.classId)) : subjects ?? [];

  function openCreate() {
    setEditingId(null);
    setForm({ classId: "", subjectId: "", teacherId: "", dayOfWeek: "Monday", startTime: "", endTime: "", room: "" });
    setOpen(true);
  }

  function openEdit(e: NonNullable<typeof entries>[0]) {
    setEditingId(e.id);
    setForm({ classId: e.classId.toString(), subjectId: e.subjectId.toString(), teacherId: e.teacherId.toString(), dayOfWeek: e.dayOfWeek as typeof form.dayOfWeek, startTime: e.startTime, endTime: e.endTime, room: e.room ?? "" });
    setOpen(true);
  }

  async function handleSave() {
    try {
      const data = { classId: parseInt(form.classId), subjectId: parseInt(form.subjectId), teacherId: parseInt(form.teacherId), dayOfWeek: form.dayOfWeek, startTime: form.startTime, endTime: form.endTime, room: form.room || undefined };
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data });
        toast.success("Entry updated");
      } else {
        await createMutation.mutateAsync({ data });
        toast.success("Entry added");
      }
      qc.invalidateQueries({ queryKey: getListTimetableQueryKey() });
      setOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync({ id: deleteId });
      toast.success("Entry deleted");
      qc.invalidateQueries({ queryKey: getListTimetableQueryKey() });
    } catch (e: any) {
      toast.error(e.message || "Failed to delete");
    } finally {
      setDeleteId(null);
    }
  }

  const grouped = DAYS.reduce((acc, day) => {
    acc[day] = (entries ?? []).filter(e => e.dayOfWeek === day).sort((a, b) => a.startTime.localeCompare(b.startTime));
    return acc;
  }, {} as Record<string, NonNullable<typeof entries>>);

  return (
    <div className="p-8 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Timetable</h1>
          <p className="text-muted-foreground mt-1">Manage class schedules</p>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" /> Add Entry</Button>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Filter by Class</label>
        <select className="block h-9 rounded-md border border-input bg-background px-3 py-1 text-sm" value={classFilter ?? ""} onChange={e => setClassFilter(e.target.value ? parseInt(e.target.value) : undefined)}>
          <option value="">All Classes</option>
          {classes?.map(c => <option key={c.id} value={c.id}>{c.name} {c.section}</option>)}
        </select>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (entries ?? []).length === 0 ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground">No timetable entries</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {DAYS.filter(day => grouped[day].length > 0).map(day => (
            <Card key={day}>
              <CardHeader className="pb-2 pt-4 px-6">
                <CardTitle className="text-base font-semibold">{day}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {grouped[day].map(e => (
                    <div key={e.id} className="flex items-center justify-between px-6 py-3 hover:bg-muted/30">
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-mono text-muted-foreground w-28">{e.startTime} — {e.endTime}</span>
                        <div>
                          <span className="font-medium text-sm">{e.subjectName}</span>
                          {e.className && <Badge variant="secondary" className="ml-2 text-xs">{e.className}</Badge>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">{e.teacherName}</span>
                        {e.room && <Badge variant="outline" className="text-xs">{e.room}</Badge>}
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(e)}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(e.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? "Edit Entry" : "Add Timetable Entry"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
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
              <div className="space-y-1.5">
                <Label>Teacher</Label>
                <select className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm" value={form.teacherId} onChange={e => setForm(f => ({ ...f, teacherId: e.target.value }))}>
                  <option value="">Select teacher</option>
                  {teachers?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Day</Label>
                <select className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm" value={form.dayOfWeek} onChange={e => setForm(f => ({ ...f, dayOfWeek: e.target.value as typeof form.dayOfWeek }))}>
                  {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Start Time</Label>
                <Input type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>End Time</Label>
                <Input type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Room</Label>
                <Input value={form.room} onChange={e => setForm(f => ({ ...f, room: e.target.value }))} placeholder="e.g. Room 101" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
              {editingId ? "Save Changes" : "Add Entry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={o => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Entry</AlertDialogTitle><AlertDialogDescription>Remove this timetable entry?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
