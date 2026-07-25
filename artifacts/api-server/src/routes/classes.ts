import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, classesTable, usersTable } from "@workspace/db";
import {
  CreateClassBody,
  GetClassParams,
  UpdateClassParams,
  UpdateClassBody,
  DeleteClassParams,
} from "@workspace/api-zod";
import { sql } from "drizzle-orm";

const router = Router();

router.get("/classes", async (_req, res): Promise<void> => {
  const classes = await db.select().from(classesTable).orderBy(classesTable.name);

  const result = await Promise.all(
    classes.map(async (cls) => {
      let teacherName: string | null = null;
      if (cls.teacherId) {
        const [teacher] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, cls.teacherId));
        teacherName = teacher?.name ?? null;
      }
      const [countRow] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(usersTable)
        .where(eq(usersTable.classId, cls.id));

      return {
        id: cls.id,
        name: cls.name,
        section: cls.section,
        grade: cls.grade ?? null,
        teacherId: cls.teacherId ?? null,
        teacherName,
        studentCount: countRow?.count ?? 0,
        createdAt: cls.createdAt.toISOString(),
      };
    })
  );

  res.json(result);
});

router.post("/classes", async (req, res): Promise<void> => {
  const parsed = CreateClassBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [cls] = await db.insert(classesTable).values(parsed.data).returning();
  res.status(201).json({
    id: cls.id,
    name: cls.name,
    section: cls.section,
    grade: cls.grade ?? null,
    teacherId: cls.teacherId ?? null,
    teacherName: null,
    studentCount: 0,
    createdAt: cls.createdAt.toISOString(),
  });
});

router.get("/classes/:id", async (req, res): Promise<void> => {
  const params = GetClassParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [cls] = await db.select().from(classesTable).where(eq(classesTable.id, params.data.id));
  if (!cls) {
    res.status(404).json({ error: "Class not found" });
    return;
  }

  let teacherName: string | null = null;
  if (cls.teacherId) {
    const [teacher] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, cls.teacherId));
    teacherName = teacher?.name ?? null;
  }

  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(usersTable)
    .where(eq(usersTable.classId, cls.id));

  res.json({
    id: cls.id,
    name: cls.name,
    section: cls.section,
    grade: cls.grade ?? null,
    teacherId: cls.teacherId ?? null,
    teacherName,
    studentCount: countRow?.count ?? 0,
    createdAt: cls.createdAt.toISOString(),
  });
});

router.patch("/classes/:id", async (req, res): Promise<void> => {
  const params = UpdateClassParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateClassBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [cls] = await db
    .update(classesTable)
    .set(parsed.data)
    .where(eq(classesTable.id, params.data.id))
    .returning();

  if (!cls) {
    res.status(404).json({ error: "Class not found" });
    return;
  }

  res.json({
    id: cls.id,
    name: cls.name,
    section: cls.section,
    grade: cls.grade ?? null,
    teacherId: cls.teacherId ?? null,
    teacherName: null,
    studentCount: 0,
    createdAt: cls.createdAt.toISOString(),
  });
});

router.delete("/classes/:id", async (req, res): Promise<void> => {
  const params = DeleteClassParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [cls] = await db.delete(classesTable).where(eq(classesTable.id, params.data.id)).returning();
  if (!cls) {
    res.status(404).json({ error: "Class not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
