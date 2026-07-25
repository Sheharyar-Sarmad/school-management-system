import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListFees, useCreateFee, useUpdateFee, useGetFeeSummary,
  useListUsers, getListFeesQueryKey, getGetFeeSummaryQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, CreditCard, TrendingUp } from "lucide-react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  unpaid: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  partial: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  overdue: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
};

export default function AdminFees() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [payingId, setPayingId] = useState<number | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [form, setForm] = useState({ studentId: "", amount: "", dueDate: "", feeType: "tuition" as const, description: "" });

  const { data: fees, isLoading } = useListFees(statusFilter ? { status: statusFilter as "paid" | "unpaid" | "partial" | "overdue" } : undefined);
  const { data: summary } = useGetFeeSummary();
  const { data: students } = useListUsers({ role: "student" });
  const createMutation = useCreateFee();
  const updateMutation = useUpdateFee();

  async function handleCreate() {
    try {
      await createMutation.mutateAsync({ data: { studentId: parseInt(form.studentId), amount: parseFloat(form.amount), dueDate: form.dueDate, feeType: form.feeType, description: form.description || undefined } });
      toast.success("Fee record created");
      qc.invalidateQueries({ queryKey: getListFeesQueryKey() });
      qc.invalidateQueries({ queryKey: getGetFeeSummaryQueryKey() });
      setOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to create");
    }
  }

  async function handlePay() {
    if (!payingId) return;
    const fee = fees?.find(f => f.id === payingId);
    if (!fee) return;
    try {
      const paidAmount = parseFloat(payAmount);
      const newPaid = (fee.paidAmount ?? 0) + paidAmount;
      const status = newPaid >= fee.amount ? "paid" : "partial";
      await updateMutation.mutateAsync({ id: payingId, data: { paidAmount: newPaid, status, paidDate: new Date().toISOString().split("T")[0] } });
      toast.success("Payment recorded");
      qc.invalidateQueries({ queryKey: getListFeesQueryKey() });
      qc.invalidateQueries({ queryKey: getGetFeeSummaryQueryKey() });
      setPayingId(null);
    } catch (e: any) {
      toast.error(e.message || "Failed to record payment");
    }
  }

  return (
    <div className="p-8 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fee Management</h1>
          <p className="text-muted-foreground mt-1">Track and collect student fees</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-2" /> Add Fee Record</Button>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Collected", value: `$${summary.totalCollected.toLocaleString()}`, color: "text-emerald-600" },
            { label: "Pending", value: `$${summary.totalPending.toLocaleString()}`, color: "text-amber-600" },
            { label: "Overdue", value: `$${summary.totalOverdue.toLocaleString()}`, color: "text-red-600" },
            { label: "Collection Rate", value: `${summary.collectionRate}%`, color: "text-blue-600" },
          ].map(stat => (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">{stat.label}</div>
                <div className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        {["", "unpaid", "partial", "overdue", "paid"].map(s => (
          <Button key={s} size="sm" variant={statusFilter === s ? "default" : "outline"} onClick={() => setStatusFilter(s)}>
            {s === "" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (fees ?? []).length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">No fee records</div>
          ) : (
            <div className="divide-y">
              {(fees ?? []).map(f => (
                <div key={f.id} className="flex items-center justify-between px-6 py-4 hover:bg-muted/30" data-testid={`row-fee-${f.id}`}>
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-full bg-violet-100 dark:bg-violet-950 flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div>
                      <div className="font-medium">{f.studentName}</div>
                      <div className="text-sm text-muted-foreground capitalize">{f.feeType} · Due {f.dueDate}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-semibold">${f.amount.toLocaleString()}</div>
                      {(f.paidAmount ?? 0) > 0 && <div className="text-xs text-muted-foreground">${f.paidAmount} paid</div>}
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[f.status]}`}>{f.status}</span>
                    {f.status !== "paid" && (
                      <Button size="sm" variant="outline" onClick={() => { setPayingId(f.id); setPayAmount(""); }}>
                        Record Payment
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Fee Record</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label>Student</Label>
                <select className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm" value={form.studentId} onChange={e => setForm(f => ({ ...f, studentId: e.target.value }))}>
                  <option value="">Select student</option>
                  {students?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Amount ($)</Label>
                <Input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="1500" />
              </div>
              <div className="space-y-1.5">
                <Label>Due Date</Label>
                <Input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Fee Type</Label>
                <select className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm" value={form.feeType} onChange={e => setForm(f => ({ ...f, feeType: e.target.value as "tuition" }))}>
                  {["tuition", "transport", "library", "sports", "examination", "other"].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>Create Fee Record</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={payingId !== null} onOpenChange={o => !o && setPayingId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <Label>Payment Amount ($)</Label>
            <Input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} placeholder="Enter amount paid" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayingId(null)}>Cancel</Button>
            <Button onClick={handlePay} disabled={updateMutation.isPending}>Record Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
