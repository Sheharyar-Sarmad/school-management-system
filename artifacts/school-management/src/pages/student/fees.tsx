import { useListFees, useGetFeeSummary } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCard, AlertCircle, CheckCircle2 } from "lucide-react";

const statusConfig: Record<string, { cls: string; label: string }> = {
  paid: { cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400", label: "Paid" },
  unpaid: { cls: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400", label: "Unpaid" },
  partial: { cls: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400", label: "Partial" },
  overdue: { cls: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400", label: "Overdue" },
};

export default function StudentFees() {
  const { user } = useAuth();
  const { data: fees, isLoading } = useListFees(user ? { studentId: user.id } : undefined);
  const { data: summary } = useGetFeeSummary();

  const overdueFees = (fees ?? []).filter(f => f.status === "overdue");

  return (
    <div className="p-8 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Fees</h1>
        <p className="text-muted-foreground mt-1">View your fee records and payment status</p>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Fees", value: `$${summary.totalCollected + summary.totalPending}` },
            { label: "Paid", value: `$${summary.totalCollected}`, cls: "text-emerald-600" },
            { label: "Pending", value: `$${summary.totalPending}`, cls: "text-amber-600" },
            { label: "Overdue", value: `$${summary.totalOverdue}`, cls: "text-red-600" },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">{s.label}</div>
                <div className={`text-2xl font-bold mt-1 ${s.cls ?? ""}`}>{s.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {overdueFees.length > 0 && (
        <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div className="text-sm text-red-700 dark:text-red-400 font-medium">
            You have {overdueFees.length} overdue fee{overdueFees.length > 1 ? "s" : ""} totalling ${overdueFees.reduce((s, f) => s + f.amount - (f.paidAmount ?? 0), 0).toLocaleString()}. Please contact the admin.
          </div>
        </div>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Fee Records</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : (fees ?? []).length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">No fee records</div>
          ) : (
            <div className="divide-y">
              {(fees ?? []).map(f => (
                <div key={f.id} className="flex items-center justify-between px-6 py-4 hover:bg-muted/30" data-testid={`row-fee-${f.id}`}>
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-full bg-violet-100 dark:bg-violet-950 flex items-center justify-center">
                      {f.status === "paid" ? (
                        <CheckCircle2 className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                      ) : (
                        <CreditCard className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium capitalize">{f.feeType} Fee</div>
                      <div className="text-sm text-muted-foreground">Due {f.dueDate}</div>
                      {f.description && <div className="text-xs text-muted-foreground">{f.description}</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-semibold">${f.amount.toLocaleString()}</div>
                      {(f.paidAmount ?? 0) > 0 && (f.paidAmount ?? 0) < f.amount && (
                        <div className="text-xs text-muted-foreground">${f.paidAmount} paid</div>
                      )}
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[f.status]?.cls}`}>
                      {statusConfig[f.status]?.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
