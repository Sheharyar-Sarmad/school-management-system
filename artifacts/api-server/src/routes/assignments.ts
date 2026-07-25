import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, assignmentsTable, submissionsTable, usersTable, classesTable, subjectsTable } from "@workspace/db";
import {
  ListAssignmentsQueryParams,
  CreateAssignmentBody,
  GetAssignmentParams,
  UpdateAssignmentParams,
  UpdateAssignmentBody,
  DeleteAssignmentParams,
  GetSubmissionsParams,
  SubmitAssignmentParams,
  SubmitAssignmentBody,
} from "@workspace/api-zod";
import { sql } from "drizzle-orm";

const router = Router();

async function formatAssignment(a: typeof assignmentsTable.$inferSelect) {
  const [cls] = await db.select({ name: classesTable.name }).from(classesTable).where(eq(classesTable.id, a.classId));
  const [subj] = await db.select({ name: subjectsTable.name }).from(subjectsTable).where(eq(subjectsTable.id, a.subjectId));
  const [teacher] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, a.teacherId));
  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(submissionsTable)
    .where(eq(submissionsTable.assignmentId, a.id));

  return {
    id: a.id,
    title: a.title,
    description: a.description ?? null,
    classId: a.classId,
    className: cls?.name ?? null,
    subjectId: a.subjectId,
    subjectName: subj?.name ?? null,
    teacherId: a.teacherId,
    teacherName: teacher?.name ?? null,
    dueDate: a.dueDate,
    status: a.status,
    totalMarks: a.totalMarks ?? null,
    submissionCount: countRow?.count ?? 0,
    createdAt: a.createdAt.toISOString(),
  };
}

router.get("/assignments", async (req, res): Promise<void> => {
  const params = ListAssignmentsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { classId, subjectId, teacherId } = params.data;
  const conditions = [];
  if (classId != null) conditions.push(eq(assignmentsTable.classId, classId));
  if (subjectId != null) conditions.push(eq(assignmentsTable.subjectId, subjectId));
  if (teacherId != null) conditions.push(eq(assignmentsTable.teacherId, teacherId));

  const assignments = await db
    .select()
    .from(assignmentsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(assignmentsTable.dueDate);

  res.json(await Promise.all(assignments.map(formatAssignment)));
});

router.post("/assignments", async (req, res): Promise<void> => {
  const parsed = CreateAssignmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [a] = await db.insert(assignmentsTable).values(parsed.data).returning();
  res.status(201).json(await formatAssignment(a));
});

router.get("/assignments/:id", async (req, res): Promise<void> => {
  const params = GetAssignmentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [a] = await db.select().from(assignmentsTable).where(eq(assignmentsTable.id, params.data.id));
  if (!a) {
    res.status(404).json({ error: "Assignment not found" });
    return;
  }

  res.json(await formatAssignment(a));
});

router.patch("/assignments/:id", async (req, res): Promise<void> => {
  const params = UpdateAssignmentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateAssignmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [a] = await db
    .update(assignmentsTable)
    .set(parsed.data)
    .where(eq(assignmentsTable.id, params.data.id))
    .returning();

  if (!a) {
    res.status(404).json({ error: "Assignment not found" });
    return;
  }

  res.json(await formatAssignment(a));
});

router.delete("/assignments/:id", async (req, res): Promise<void> => {
  const params = DeleteAssignmentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [a] = await db.delete(assignmentsTable).where(eq(assignmentsTable.id, params.data.id)).returning();
  if (!a) {
    res.status(404).json({ error: "Assignment not found" });
    return;
  }

  res.sendStatus(204);
});

router.get("/assignments/:id/submissions", async (req, res): Promise<void> => {
  const params = GetSubmissionsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const submissions = await db
    .select()
    .from(submissionsTable)
    .where(eq(submissionsTable.assignmentId, params.data.id))
    .orderBy(submissionsTable.submittedAt);

  const result = await Promise.all(
    submissions.map(async (s) => {
      const [student] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, s.studentId));
      return {
        id: s.id,
        assignmentId: s.assignmentId,
        studentId: s.studentId,
        studentName: student?.name ?? "Unknown",
        fileUrl: s.fileUrl ?? null,
        notes: s.notes ?? null,
        marksObtained: s.marksObtained ?? null,
        feedback: s.feedback ?? null,
        status: s.status,
        submittedAt: s.submittedAt.toISOString(),
      };
    })
  );

  res.json(result);
});

router.post("/assignments/:id/submissions", async (req, res): Promise<void> => {
  const params = SubmitAssignmentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = SubmitAssignmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [s] = await db
    .insert(submissionsTable)
    .values({ assignmentId: params.data.id, ...parsed.data })
    .returning();

  const [student] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, s.studentId));

  res.status(201).json({
    id: s.id,
    assignmentId: s.assignmentId,
    studentId: s.studentId,
    studentName: student?.name ?? "Unknown",
    fileUrl: s.fileUrl ?? null,
    notes: s.notes ?? null,
    marksObtained: s.marksObtained ?? null,
    feedback: s.feedback ?? null,
    status: s.status,
    submittedAt: s.submittedAt.toISOString(),
  });
});

export default router;
