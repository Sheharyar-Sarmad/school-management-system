import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, feesTable, usersTable } from "@workspace/db";
import {
  ListFeesQueryParams,
  CreateFeeBody,
  UpdateFeeParams,
  UpdateFeeBody,
} from "@workspace/api-zod";

const router = Router();

async function formatFee(f: typeof feesTable.$inferSelect) {
  const [student] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, f.studentId));
  return {
    id: f.id,
    studentId: f.studentId,
    studentName: student?.name ?? "Unknown",
    amount: f.amount,
    paidAmount: f.paidAmount,
    dueDate: f.dueDate,
    paidDate: f.paidDate ?? null,
    status: f.status,
    feeType: f.feeType,
    description: f.description ?? null,
    createdAt: f.createdAt.toISOString(),
  };
}

router.get("/fees", async (req, res): Promise<void> => {
  const params = ListFeesQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { studentId, status } = params.data;
  const conditions = [];
  if (studentId != null) conditions.push(eq(feesTable.studentId, studentId));
  if (status) conditions.push(eq(feesTable.status, status));

  const fees = await db
    .select()
    .from(feesTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(feesTable.dueDate);

  res.json(await Promise.all(fees.map(formatFee)));
});

router.post("/fees", async (req, res): Promise<void> => {
  const parsed = CreateFeeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [f] = await db.insert(feesTable).values(parsed.data).returning();
  res.status(201).json(await formatFee(f));
});

router.patch("/fees/:id", async (req, res): Promise<void> => {
  const params = UpdateFeeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateFeeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [f] = await db
    .update(feesTable)
    .set(parsed.data)
    .where(eq(feesTable.id, params.data.id))
    .returning();

  if (!f) {
    res.status(404).json({ error: "Fee not found" });
    return;
  }

  res.json(await formatFee(f));
});

router.get("/fees/summary", async (_req, res): Promise<void> => {
  const fees = await db.select().from(feesTable);

  const totalCollected = fees.reduce((sum, f) => sum + f.paidAmount, 0);
  const totalPending = fees
    .filter((f) => f.status !== "paid")
    .reduce((sum, f) => sum + (f.amount - f.paidAmount), 0);
  const totalOverdue = fees
    .filter((f) => f.status === "overdue")
    .reduce((sum, f) => sum + (f.amount - f.paidAmount), 0);
  const totalDue = fees.reduce((sum, f) => sum + f.amount, 0);
  const collectionRate = totalDue > 0 ? Math.round((totalCollected / totalDue) * 100) : 0;

  // Monthly revenue from paid fees
  const monthlyMap: Record<string, number> = {};
  fees
    .filter((f) => f.paidDate)
    .forEach((f) => {
      const month = f.paidDate!.substring(0, 7);
      monthlyMap[month] = (monthlyMap[month] ?? 0) + f.paidAmount;
    });

  const monthlyRevenue = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, amount]) => ({ month, amount }));

  res.json({ totalCollected, totalPending, totalOverdue, collectionRate, monthlyRevenue });
});

export default router;
