import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListAnnouncements, useCreateAnnouncement, useDeleteAnnouncement,
  getListAnnouncementsQueryKey,
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
import { Plus, Trash2, Bell, Clock } from "lucide-react";
import { toast } from "sonner";

const roleColors: Record<string, string> = {
  all: "bg-primary/10 text-primary",
  student: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  teacher: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400",
  admin: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400",
};

export default function AdminAnnouncements() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState({ title: "", content: "", targetRole: "all" as const });

  const { data: announcements, isLoading } = useListAnnouncements();
  const createMutation = useCreateAnnouncement();
  const deleteMutation = useDeleteAnnouncement();

  async function handleCreate() {
    if (!user) return;
    try {
      await createMutation.mutateAsync({ data: { title: form.title, content: form.content, authorId: user.id, targetRole: form.targetRole } });
      toast.success("Announcement posted");
      qc.invalidateQueries({ queryKey: getListAnnouncementsQueryKey() });
      setOpen(false);
      setForm({ title: "", content: "", targetRole: "all" });
    } catch (e: any) {
      toast.error(e.message || "Failed to post");
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync({ id: deleteId });
      toast.success("Announcement deleted");
      qc.invalidateQueries({ queryKey: getListAnnouncementsQueryKey() });
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
          <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
          <p className="text-muted-foreground mt-1">Post and manage school-wide announcements</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-2" /> Post Announcement</Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}</div>
      ) : (announcements ?? []).length === 0 ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground">No announcements yet</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {[...(announcements ?? [])].reverse().map(a => (
            <Card key={a.id} className="hover:shadow-md transition-shadow" data-testid={`card-announcement-${a.id}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-950 flex items-center justify-center flex-shrink-0">
                      <Bell className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">{a.title}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleColors[a.targetRole]}`}>
                          {a.targetRole === "all" ? "Everyone" : a.targetRole}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-sm leading-relaxed">{a.content}</p>
                      <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(a.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}</span>
                        <span>by {a.authorName}</span>
                      </div>
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive flex-shrink-0" onClick={() => setDeleteId(a.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Post Announcement</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Announcement title" />
            </div>
            <div className="space-y-1.5">
              <Label>Content</Label>
              <textarea
                className="w-full min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                placeholder="Write your announcement..."
              />
            </div>
            <div className="space-y-1.5">
              <Label>Target Audience</Label>
              <select className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm" value={form.targetRole} onChange={e => setForm(f => ({ ...f, targetRole: e.target.value as "all" }))}>
                <option value="all">Everyone</option>
                <option value="student">Students only</option>
                <option value="teacher">Teachers only</option>
                <option value="admin">Admin only</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>Post</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={o => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Announcement</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove this announcement.</AlertDialogDescription>
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
