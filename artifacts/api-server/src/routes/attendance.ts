import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, attendanceTable, usersTable } from "@workspace/db";
import {
  ListAttendanceQueryParams,
  MarkAttendanceBody,
  GetAttendanceSummaryQueryParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/attendance", async (req, res): Promise<void> => {
  const params = ListAttendanceQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { studentId, classId, date, month } = params.data;
  const conditions = [];

  if (studentId != null) conditions.push(eq(attendanceTable.studentId, studentId));
  if (classId != null) conditions.push(eq(attendanceTable.classId, classId));
  if (date) conditions.push(eq(attendanceTable.date, date));

  const records = await db
    .select()
    .from(attendanceTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(attendanceTable.date);

  const filtered = month
    ? records.filter((r) => r.date.startsWith(month))
    : records;

  const result = await Promise.all(
    filtered.map(async (r) => {
      const [student] = await db
        .select({ name: usersTable.name })
        .from(usersTable)
        .where(eq(usersTable.id, r.studentId));
      return {
        id: r.id,
        studentId: r.studentId,
        studentName: student?.name ?? "Unknown",
        classId: r.classId,
        date: r.date,
        status: r.status,
        notes: r.notes ?? null,
        createdAt: r.createdAt.toISOString(),
      };
    })
  );

  res.json(result);
});

router.post("/attendance", async (req, res): Promise<void> => {
  const parsed = MarkAttendanceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [record] = await db.insert(attendanceTable).values(parsed.data).returning();
  const [student] = await db
    .select({ name: usersTable.name })
    .from(usersTable)
    .where(eq(usersTable.id, record.studentId));

  res.status(201).json({
    id: record.id,
    studentId: record.studentId,
    studentName: student?.name ?? "Unknown",
    classId: record.classId,
    date: record.date,
    status: record.status,
    notes: record.notes ?? null,
    createdAt: record.createdAt.toISOString(),
  });
});

router.get("/attendance/summary", async (req, res): Promise<void> => {
  const params = GetAttendanceSummaryQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { studentId, classId, month } = params.data;
  const conditions = [];

  if (studentId != null) conditions.push(eq(attendanceTable.studentId, studentId));
  if (classId != null) conditions.push(eq(attendanceTable.classId, classId));

  const records = await db
    .select()
    .from(attendanceTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  const filtered = month ? records.filter((r) => r.date.startsWith(month)) : records;

  const totalDays = filtered.length;
  const presentDays = filtered.filter((r) => r.status === "present").length;
  const absentDays = filtered.filter((r) => r.status === "absent").length;
  const lateDays = filtered.filter((r) => r.status === "late").length;
  const excusedDays = filtered.filter((r) => r.status === "excused").length;
  const attendanceRate = totalDays > 0 ? Math.round(((presentDays + lateDays) / totalDays) * 100) : 0;

  res.json({ totalDays, presentDays, absentDays, lateDays, excusedDays, attendanceRate });
});

export default router;
