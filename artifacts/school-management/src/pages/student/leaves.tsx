import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useListLeaves, useCreateLeave, getListLeavesQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, FileText, Calendar } from "lucide-react";
import { toast } from "sonner";

const statusConfig: Record<string, { cls: string; label: string }> = {
  pending: { cls: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400", label: "Pending" },
  approved: { cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400", label: "Approved" },
  rejected: { cls: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400", label: "Rejected" },
};

export default function StudentLeaves() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ fromDate: "", toDate: "", reason: "" });

  const { data: leaves, isLoading } = useListLeaves(user ? { userId: user.id } : undefined);
  const createMutation = useCreateLeave();

  async function handleCreate() {
    if (!user) return;
    try {
      await createMutation.mutateAsync({ data: { userId: user.id, fromDate: form.fromDate, toDate: form.toDate, reason: form.reason } });
      toast.success("Leave request submitted");
      qc.invalidateQueries({ queryKey: getListLeavesQueryKey() });
      setOpen(false);
      setForm({ fromDate: "", toDate: "", reason: "" });
    } catch (e: any) {
      toast.error(e.message || "Failed to submit");
    }
  }

  const pending = (leaves ?? []).filter(l => l.status === "pending");

  return (
    <div className="p-8 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leave Requests</h1>
          <p className="text-muted-foreground mt-1">Submit and track your leave applications</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-2" /> Request Leave</Button>
      </div>

      {pending.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900 rounded-xl p-4 text-sm text-amber-700 dark:text-amber-400">
          {pending.length} leave request{pending.length > 1 ? "s" : ""} pending approval
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>
          ) : (leaves ?? []).length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">No leave requests yet</div>
          ) : (
            <div className="divide-y">
              {[...(leaves ?? [])].reverse().map(l => (
                <div key={l.id} className="flex items-start justify-between px-6 py-4 hover:bg-muted/30 gap-4" data-testid={`row-leave-${l.id}`}>
                  <div className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div>
                      <div className="font-medium">{l.reason}</div>
                      <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        {l.fromDate} — {l.toDate}
                      </div>
                      {l.adminRemarks && (
                        <div className="text-xs text-muted-foreground mt-1 italic">
                          Admin: {l.adminRemarks}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${statusConfig[l.status]?.cls}`}>
                    {statusConfig[l.status]?.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Request Leave</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>From Date</Label>
                <Input type="date" value={form.fromDate} onChange={e => setForm(f => ({ ...f, fromDate: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>To Date</Label>
                <Input type="date" value={form.toDate} onChange={e => setForm(f => ({ ...f, toDate: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Reason</Label>
              <textarea
                className="w-full min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={form.reason}
                onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                placeholder="Describe the reason for your leave..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>Submit Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
