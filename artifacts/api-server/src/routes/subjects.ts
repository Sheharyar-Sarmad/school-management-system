import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, subjectsTable, classesTable, usersTable } from "@workspace/db";
import {
  ListSubjectsQueryParams,
  CreateSubjectBody,
  GetSubjectParams,
  UpdateSubjectParams,
  UpdateSubjectBody,
  DeleteSubjectParams,
} from "@workspace/api-zod";

const router = Router();

async function formatSubject(subj: typeof subjectsTable.$inferSelect) {
  let className: string | null = null;
  let teacherName: string | null = null;
  if (subj.classId) {
    const [cls] = await db.select({ name: classesTable.name }).from(classesTable).where(eq(classesTable.id, subj.classId));
    className = cls?.name ?? null;
  }
  if (subj.teacherId) {
    const [teacher] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, subj.teacherId));
    teacherName = teacher?.name ?? null;
  }
  return {
    id: subj.id,
    name: subj.name,
    code: subj.code,
    description: subj.description ?? null,
    classId: subj.classId ?? null,
    className,
    teacherId: subj.teacherId ?? null,
    teacherName,
    createdAt: subj.createdAt.toISOString(),
  };
}

router.get("/subjects", async (req, res): Promise<void> => {
  const params = ListSubjectsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const conditions = [];
  if (params.data.classId != null) conditions.push(eq(subjectsTable.classId, params.data.classId));

  const subjects = await db
    .select()
    .from(subjectsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(subjectsTable.name);

  const result = await Promise.all(subjects.map(formatSubject));
  res.json(result);
});

router.post("/subjects", async (req, res): Promise<void> => {
  const parsed = CreateSubjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [subj] = await db.insert(subjectsTable).values(parsed.data).returning();
  res.status(201).json(await formatSubject(subj));
});

router.get("/subjects/:id", async (req, res): Promise<void> => {
  const params = GetSubjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [subj] = await db.select().from(subjectsTable).where(eq(subjectsTable.id, params.data.id));
  if (!subj) {
    res.status(404).json({ error: "Subject not found" });
    return;
  }

  res.json(await formatSubject(subj));
});

router.patch("/subjects/:id", async (req, res): Promise<void> => {
  const params = UpdateSubjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateSubjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [subj] = await db
    .update(subjectsTable)
    .set(parsed.data)
    .where(eq(subjectsTable.id, params.data.id))
    .returning();

  if (!subj) {
    res.status(404).json({ error: "Subject not found" });
    return;
  }

  res.json(await formatSubject(subj));
});

router.delete("/subjects/:id", async (req, res): Promise<void> => {
  const params = DeleteSubjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [subj] = await db.delete(subjectsTable).where(eq(subjectsTable.id, params.data.id)).returning();
  if (!subj) {
    res.status(404).json({ error: "Subject not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
