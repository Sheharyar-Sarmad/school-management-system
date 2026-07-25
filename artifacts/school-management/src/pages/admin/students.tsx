import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  getListUsersQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Search, Plus, Pencil, Trash2, User } from "lucide-react";
import { toast } from "sonner";
import { useListClasses } from "@workspace/api-client-react";

export default function AdminStudents() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", address: "", classId: "", rollNumber: "" });

  const { data: students, isLoading } = useListUsers({ role: "student" });
  const { data: classes } = useListClasses();
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();

  const filtered = students?.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    (s.rollNumber ?? "").toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  function openCreate() {
    setEditingId(null);
    setForm({ name: "", email: "", password: "", phone: "", address: "", classId: "", rollNumber: "" });
    setOpen(true);
  }

  function openEdit(s: typeof filtered[0]) {
    setEditingId(s.id);
    setForm({ name: s.name, email: s.email, password: "", phone: s.phone ?? "", address: s.address ?? "", classId: s.classId?.toString() ?? "", rollNumber: s.rollNumber ?? "" });
    setOpen(true);
  }

  async function handleSave() {
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: { name: form.name, phone: form.phone, address: form.address, classId: form.classId ? parseInt(form.classId) : null } });
        toast.success("Student updated");
      } else {
        await createMutation.mutateAsync({ data: { name: form.name, email: form.email, password: form.password, role: "student", phone: form.phone, address: form.address, classId: form.classId ? parseInt(form.classId) : null, rollNumber: form.rollNumber } });
        toast.success("Student created");
      }
      qc.invalidateQueries({ queryKey: getListUsersQueryKey({ role: "student" }) });
      setOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to save student");
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync({ id: deleteId });
      toast.success("Student deleted");
      qc.invalidateQueries({ queryKey: getListUsersQueryKey({ role: "student" }) });

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
          <h1 className="text-3xl font-bold tracking-tight">Students</h1>
          <p className="text-muted-foreground mt-1">Manage student enrollment and profiles</p>
        </div>
        <Button onClick={openCreate} data-testid="button-add-student">
          <Plus className="w-4 h-4 mr-2" /> Add Student
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, or roll number..."
          className="pl-9"
          value={search}
          onChange={e => setSearch(e.target.value)}
          data-testid="input-search-students"
        />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium text-muted-foreground">
            {isLoading ? "Loading..." : `${filtered.length} student${filtered.length !== 1 ? "s" : ""}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">No students found</div>
          ) : (
            <div className="divide-y">
              {filtered.map(s => {
                const cls = classes?.find(c => c.id === s.classId);
                return (
                  <div key={s.id} className="flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors" data-testid={`row-student-${s.id}`}>
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{s.name}</div>
                        <div className="text-sm text-muted-foreground">{s.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {s.rollNumber && <span className="text-sm text-muted-foreground font-mono">{s.rollNumber}</span>}
                      {cls && <Badge variant="secondary">{cls.name} {cls.section}</Badge>}
                      <Button size="icon" variant="ghost" onClick={() => openEdit(s)} data-testid={`button-edit-student-${s.id}`}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleteId(s.id)} data-testid={`button-delete-student-${s.id}`}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Student" : "Add Student"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label>Name</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" />
              </div>
              {!editingId && (
                <>
                  <div className="space-y-1.5">
                    <Label>Email</Label>
                    <Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@school.com" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Password</Label>
                    <Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Set password" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Roll Number</Label>
                    <Input value={form.rollNumber} onChange={e => setForm(f => ({ ...f, rollNumber: e.target.value }))} placeholder="e.g. 10A001" />
                  </div>
                </>
              )}
              <div className="space-y-1.5">
                <Label>Class</Label>
                <select className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm" value={form.classId} onChange={e => setForm(f => ({ ...f, classId: e.target.value }))}>
                  <option value="">No class</option>
                  {classes?.map(c => <option key={c.id} value={c.id}>{c.name} {c.section}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+1-555-0100" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Address</Label>
                <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Home address" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-student">
              {editingId ? "Save Changes" : "Add Student"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={o => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Student</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove the student. This cannot be undone.</AlertDialogDescription>
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
