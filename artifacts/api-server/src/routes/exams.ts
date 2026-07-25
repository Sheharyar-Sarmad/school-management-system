import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, examsTable, resultsTable, usersTable, classesTable, subjectsTable } from "@workspace/db";
import {
  ListExamsQueryParams,
  CreateExamBody,
  GetExamParams,
  UpdateExamParams,
  UpdateExamBody,
  DeleteExamParams,
  ListResultsQueryParams,
  CreateResultBody,
  UpdateResultParams,
  UpdateResultBody,
} from "@workspace/api-zod";

const router = Router();

async function formatExam(e: typeof examsTable.$inferSelect) {
  const [cls] = await db.select({ name: classesTable.name }).from(classesTable).where(eq(classesTable.id, e.classId));
  const [subj] = await db.select({ name: subjectsTable.name }).from(subjectsTable).where(eq(subjectsTable.id, e.subjectId));
  return {
    id: e.id,
    title: e.title,
    classId: e.classId,
    className: cls?.name ?? null,
    subjectId: e.subjectId,
    subjectName: subj?.name ?? null,
    examDate: e.examDate,
    startTime: e.startTime ?? null,
    endTime: e.endTime ?? null,
    totalMarks: e.totalMarks,
    passingMarks: e.passingMarks,
    status: e.status,
    venue: e.venue ?? null,
    createdAt: e.createdAt.toISOString(),
  };
}

router.get("/exams", async (req, res): Promise<void> => {
  const params = ListExamsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { classId, subjectId } = params.data;
  const conditions = [];
  if (classId != null) conditions.push(eq(examsTable.classId, classId));
  if (subjectId != null) conditions.push(eq(examsTable.subjectId, subjectId));

  const exams = await db
    .select()
    .from(examsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(examsTable.examDate);

  res.json(await Promise.all(exams.map(formatExam)));
});

router.post("/exams", async (req, res): Promise<void> => {
  const parsed = CreateExamBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [e] = await db.insert(examsTable).values(parsed.data).returning();
  res.status(201).json(await formatExam(e));
});

router.get("/exams/:id", async (req, res): Promise<void> => {
  const params = GetExamParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [e] = await db.select().from(examsTable).where(eq(examsTable.id, params.data.id));
  if (!e) {
    res.status(404).json({ error: "Exam not found" });
    return;
  }

  res.json(await formatExam(e));
});

router.patch("/exams/:id", async (req, res): Promise<void> => {
  const params = UpdateExamParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateExamBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [e] = await db
    .update(examsTable)
    .set(parsed.data)
    .where(eq(examsTable.id, params.data.id))
    .returning();

  if (!e) {
    res.status(404).json({ error: "Exam not found" });
    return;
  }

  res.json(await formatExam(e));
});

router.delete("/exams/:id", async (req, res): Promise<void> => {
  const params = DeleteExamParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [e] = await db.delete(examsTable).where(eq(examsTable.id, params.data.id)).returning();
  if (!e) {
    res.status(404).json({ error: "Exam not found" });
    return;
  }

  res.sendStatus(204);
});

// Results routes
router.get("/results", async (req, res): Promise<void> => {
  const params = ListResultsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { studentId, examId, classId } = params.data;
  const conditions = [];
  if (studentId != null) conditions.push(eq(resultsTable.studentId, studentId));
  if (examId != null) conditions.push(eq(resultsTable.examId, examId));

  let results = await db
    .select()
    .from(resultsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  if (classId != null) {
    const classExams = await db.select({ id: examsTable.id }).from(examsTable).where(eq(examsTable.classId, classId));
    const classExamIds = classExams.map((e) => e.id);
    results = results.filter((r) => classExamIds.includes(r.examId));
  }

  const formatted = await Promise.all(
    results.map(async (r) => {
      const [student] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, r.studentId));
      const [exam] = await db.select().from(examsTable).where(eq(examsTable.id, r.examId));
      const marks = parseFloat(r.marksObtained);
      const isPassed = exam ? marks >= exam.passingMarks : false;
      const grade = getGrade(exam ? (marks / exam.totalMarks) * 100 : 0);

      return {
        id: r.id,
        examId: r.examId,
        examTitle: exam?.title ?? null,
        studentId: r.studentId,
        studentName: student?.name ?? "Unknown",
        marksObtained: marks,
        totalMarks: exam?.totalMarks ?? 100,
        grade,
        remarks: r.remarks ?? null,
        isPassed,
        createdAt: r.createdAt.toISOString(),
      };
    })
  );

  res.json(formatted);
});

router.post("/results", async (req, res): Promise<void> => {
  const parsed = CreateResultBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [r] = await db
    .insert(resultsTable)
    .values({ ...parsed.data, marksObtained: String(parsed.data.marksObtained) })
    .returning();

  const [student] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, r.studentId));
  const [exam] = await db.select().from(examsTable).where(eq(examsTable.id, r.examId));
  const marks = parseFloat(r.marksObtained);
  const isPassed = exam ? marks >= exam.passingMarks : false;

  res.status(201).json({
    id: r.id,
    examId: r.examId,
    examTitle: exam?.title ?? null,
    studentId: r.studentId,
    studentName: student?.name ?? "Unknown",
    marksObtained: marks,
    totalMarks: exam?.totalMarks ?? 100,
    grade: getGrade(exam ? (marks / exam.totalMarks) * 100 : 0),
    remarks: r.remarks ?? null,
    isPassed,
    createdAt: r.createdAt.toISOString(),
  });
});

router.patch("/results/:id", async (req, res): Promise<void> => {
  const params = UpdateResultParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateResultBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.marksObtained != null) updateData.marksObtained = String(parsed.data.marksObtained);
  if (parsed.data.remarks != null) updateData.remarks = parsed.data.remarks;

  const [r] = await db
    .update(resultsTable)
    .set(updateData)
    .where(eq(resultsTable.id, params.data.id))
    .returning();

  if (!r) {
    res.status(404).json({ error: "Result not found" });
    return;
  }

  const [student] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, r.studentId));
  const [exam] = await db.select().from(examsTable).where(eq(examsTable.id, r.examId));
  const marks = parseFloat(r.marksObtained);

  res.json({
    id: r.id,
    examId: r.examId,
    examTitle: exam?.title ?? null,
    studentId: r.studentId,
    studentName: student?.name ?? "Unknown",
    marksObtained: marks,
    totalMarks: exam?.totalMarks ?? 100,
    grade: getGrade(exam ? (marks / exam.totalMarks) * 100 : 0),
    remarks: r.remarks ?? null,
    isPassed: exam ? marks >= exam.passingMarks : false,
    createdAt: r.createdAt.toISOString(),
  });
});

function getGrade(percentage: number): string {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B+";
  if (percentage >= 60) return "B";
  if (percentage >= 50) return "C";
  if (percentage >= 40) return "D";
  return "F";
}

export default router;
