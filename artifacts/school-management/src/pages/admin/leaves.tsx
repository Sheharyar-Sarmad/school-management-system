import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useListLeaves, useUpdateLeave, getListLeavesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FileText, Calendar, User } from "lucide-react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  rejected: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
};

export default function AdminLeaves() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [actionLeave, setActionLeave] = useState<{ id: number; action: "approved" | "rejected" } | null>(null);
  const [remarks, setRemarks] = useState("");

  const { data: leaves, isLoading } = useListLeaves(statusFilter ? { status: statusFilter as "pending" } : undefined);
  const updateMutation = useUpdateLeave();

  const filtered = (leaves ?? []).filter(l => statusFilter ? l.status === statusFilter : true);

  async function handleAction() {
    if (!actionLeave) return;
    try {
      await updateMutation.mutateAsync({ id: actionLeave.id, data: { status: actionLeave.action, adminRemarks: remarks || undefined } });
      toast.success(`Leave ${actionLeave.action}`);
      qc.invalidateQueries({ queryKey: getListLeavesQueryKey() });
      setActionLeave(null);
      setRemarks("");
    } catch (e: any) {
      toast.error(e.message || "Failed to update leave");
    }
  }

  const pendingCount = (leaves ?? []).filter(l => l.status === "pending").length;

  return (
    <div className="p-8 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leave Requests</h1>
          <p className="text-muted-foreground mt-1">Review and approve student and teacher leaves</p>
        </div>
        {pendingCount > 0 && (
          <div className="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 px-3 py-1.5 rounded-full text-sm font-medium">
            {pendingCount} pending
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {["", "pending", "approved", "rejected"].map(s => (
          <Button key={s} size="sm" variant={statusFilter === s ? "default" : "outline"} onClick={() => setStatusFilter(s)}>
            {s === "" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">No leave requests</div>
          ) : (
            <div className="divide-y">
              {filtered.map(l => (
                <div key={l.id} className="flex items-start justify-between px-6 py-4 gap-4 hover:bg-muted/30" data-testid={`row-leave-${l.id}`}>
                  <div className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div>
                      <div className="font-medium">{l.userName} <span className="text-sm text-muted-foreground capitalize">({l.userRole})</span></div>
                      <div className="text-sm text-muted-foreground mt-0.5">{l.reason}</div>
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>{l.fromDate} — {l.toDate}</span>
                      </div>
                      {l.adminRemarks && (
                        <div className="mt-1.5 text-xs italic text-muted-foreground">Remarks: {l.adminRemarks}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[l.status]}`}>{l.status}</span>
                    {l.status === "pending" && (
                      <>
                        <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950" onClick={() => { setActionLeave({ id: l.id, action: "approved" }); setRemarks(""); }}>
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-950" onClick={() => { setActionLeave({ id: l.id, action: "rejected" }); setRemarks(""); }}>
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={actionLeave !== null} onOpenChange={o => !o && setActionLeave(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{actionLeave?.action === "approved" ? "Approve" : "Reject"} Leave Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label>Remarks (optional)</Label>
            <Input value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Add a note for the applicant" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionLeave(null)}>Cancel</Button>
            <Button
              onClick={handleAction}
              disabled={updateMutation.isPending}
              className={actionLeave?.action === "approved" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-destructive hover:bg-destructive/90"}
            >
              {actionLeave?.action === "approved" ? "Approve" : "Reject"} Leave
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
