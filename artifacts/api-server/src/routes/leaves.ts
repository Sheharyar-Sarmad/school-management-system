import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, leavesTable, usersTable } from "@workspace/db";
import {
  ListLeavesQueryParams,
  CreateLeaveBody,
  UpdateLeaveParams,
  UpdateLeaveBody,
} from "@workspace/api-zod";

const router = Router();

async function formatLeave(l: typeof leavesTable.$inferSelect) {
  const [user] = await db
    .select({ name: usersTable.name, role: usersTable.role })
    .from(usersTable)
    .where(eq(usersTable.id, l.userId));
  return {
    id: l.id,
    userId: l.userId,
    userName: user?.name ?? "Unknown",
    userRole: (user?.role ?? "student") as "student" | "teacher",
    fromDate: l.fromDate,
    toDate: l.toDate,
    reason: l.reason,
    status: l.status,
    adminRemarks: l.adminRemarks ?? null,
    createdAt: l.createdAt.toISOString(),
  };
}

router.get("/leaves", async (req, res): Promise<void> => {
  const params = ListLeavesQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { userId, status } = params.data;
  const conditions = [];
  if (userId != null) conditions.push(eq(leavesTable.userId, userId));
  if (status) conditions.push(eq(leavesTable.status, status));

  const leaves = await db
    .select()
    .from(leavesTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(leavesTable.createdAt);

  res.json(await Promise.all(leaves.map(formatLeave)));
});

router.post("/leaves", async (req, res): Promise<void> => {
  const parsed = CreateLeaveBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [l] = await db.insert(leavesTable).values(parsed.data).returning();
  res.status(201).json(await formatLeave(l));
});

router.patch("/leaves/:id", async (req, res): Promise<void> => {
  const params = UpdateLeaveParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateLeaveBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [l] = await db
    .update(leavesTable)
    .set(parsed.data)
    .where(eq(leavesTable.id, params.data.id))
    .returning();

  if (!l) {
    res.status(404).json({ error: "Leave not found" });
    return;
  }

  res.json(await formatLeave(l));
});

export default router;
