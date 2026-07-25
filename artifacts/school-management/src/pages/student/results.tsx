import { useListResults } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, TrendingUp } from "lucide-react";

const gradeColors: Record<string, string> = {
  A: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400",
  B: "text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400",
  C: "text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-400",
  D: "text-orange-600 bg-orange-50 dark:bg-orange-950 dark:text-orange-400",
  F: "text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400",
};

export default function StudentResults() {
  const { user } = useAuth();
  const { data: results, isLoading } = useListResults(user ? { studentId: user.id } : undefined);

  const totalResults = (results ?? []).length;
  const passed = (results ?? []).filter(r => r.isPassed).length;
  const avgScore = totalResults > 0
    ? Math.round((results ?? []).reduce((sum, r) => sum + Math.round(r.marksObtained / r.totalMarks * 100), 0) / totalResults)
    : 0;

  if (isLoading) {
    return (
      <div className="p-8 space-y-6 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight">My Results</h1>
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Results</h1>
        <p className="text-muted-foreground mt-1">View your exam results and grades</p>
      </div>

      {totalResults > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Total Exams</div>
              <div className="text-2xl font-bold mt-1">{totalResults}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Passed</div>
              <div className="text-2xl font-bold mt-1 text-emerald-600">{passed}/{totalResults}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Average Score</div>
              <div className="text-2xl font-bold mt-1 text-blue-600">{avgScore}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">All Results</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {(results ?? []).length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">No results yet</div>
          ) : (
            <div className="divide-y">
              {(results ?? []).map(r => (
                <div key={r.id} className="flex items-center justify-between px-6 py-4 hover:bg-muted/30" data-testid={`row-result-${r.id}`}>
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <Award className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{r.examTitle}</div>
                      <div className="text-sm text-muted-foreground">{r.createdAt?.slice(0, 10)}</div>
                      {r.remarks && <div className="text-xs text-muted-foreground mt-0.5 italic">{r.remarks}</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-semibold">{r.marksObtained}/{r.totalMarks}</div>
                      <div className="text-sm text-muted-foreground">{Math.round(r.marksObtained / r.totalMarks * 100)}%</div>
                    </div>
                    {r.grade && (
                      <span className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${gradeColors[r.grade[0]] ?? ""}`}>
                        {r.grade}
                      </span>
                    )}
                    <span className={`text-xs font-medium ${r.isPassed ? "text-emerald-600" : "text-red-600"}`}>
                      {r.isPassed ? "Pass" : "Fail"}
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
