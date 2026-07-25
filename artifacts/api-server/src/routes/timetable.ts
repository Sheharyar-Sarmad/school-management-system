import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, timetableTable, classesTable, subjectsTable, usersTable } from "@workspace/db";
import {
  ListTimetableQueryParams,
  CreateTimetableEntryBody,
  UpdateTimetableEntryParams,
  UpdateTimetableEntryBody,
  DeleteTimetableEntryParams,
} from "@workspace/api-zod";

const router = Router();

async function formatEntry(t: typeof timetableTable.$inferSelect) {
  const [cls] = await db.select({ name: classesTable.name }).from(classesTable).where(eq(classesTable.id, t.classId));
  const [subj] = await db.select({ name: subjectsTable.name }).from(subjectsTable).where(eq(subjectsTable.id, t.subjectId));
  const [teacher] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, t.teacherId));
  return {
    id: t.id,
    classId: t.classId,
    className: cls?.name ?? null,
    subjectId: t.subjectId,
    subjectName: subj?.name ?? null,
    teacherId: t.teacherId,
    teacherName: teacher?.name ?? null,
    dayOfWeek: t.dayOfWeek,
    startTime: t.startTime,
    endTime: t.endTime,
    room: t.room ?? null,
    createdAt: t.createdAt.toISOString(),
  };
}

router.get("/timetable", async (req, res): Promise<void> => {
  const params = ListTimetableQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { classId, teacherId } = params.data;
  const conditions = [];
  if (classId != null) conditions.push(eq(timetableTable.classId, classId));
  if (teacherId != null) conditions.push(eq(timetableTable.teacherId, teacherId));

  const entries = await db
    .select()
    .from(timetableTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(timetableTable.dayOfWeek);

  res.json(await Promise.all(entries.map(formatEntry)));
});

router.post("/timetable", async (req, res): Promise<void> => {
  const parsed = CreateTimetableEntryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [t] = await db.insert(timetableTable).values(parsed.data).returning();
  res.status(201).json(await formatEntry(t));
});

router.patch("/timetable/:id", async (req, res): Promise<void> => {
  const params = UpdateTimetableEntryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateTimetableEntryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [t] = await db
    .update(timetableTable)
    .set(parsed.data)
    .where(eq(timetableTable.id, params.data.id))
    .returning();

  if (!t) {
    res.status(404).json({ error: "Timetable entry not found" });
    return;
  }

  res.json(await formatEntry(t));
});

router.delete("/timetable/:id", async (req, res): Promise<void> => {
  const params = DeleteTimetableEntryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [t] = await db.delete(timetableTable).where(eq(timetableTable.id, params.data.id)).returning();
  if (!t) {
    res.status(404).json({ error: "Timetable entry not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
