import { Router } from "express";
import { eq, and, gte } from "drizzle-orm";
import {
  db,
  usersTable,
  classesTable,
  subjectsTable,
  attendanceTable,
  assignmentsTable,
  submissionsTable,
  examsTable,
  resultsTable,
  feesTable,
  notificationsTable,
  announcementsTable,
  timetableTable,
  leavesTable,
} from "@workspace/db";
import { sql } from "drizzle-orm";

const router = Router();

// Admin dashboard
router.get("/dashboard/admin", async (_req, res): Promise<void> => {
  const [studentCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(usersTable)
    .where(eq(usersTable.role, "student"));

  const [teacherCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(usersTable)
    .where(eq(usersTable.role, "teacher"));

  const [classCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(classesTable);

  const [subjectCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(subjectsTable);

  const today = new Date().toISOString().split("T")[0];
  const todayAttendance = await db
    .select()
    .from(attendanceTable)
    .where(eq(attendanceTable.date, today));

  const todayAttendanceRate =
    todayAttendance.length > 0
      ? Math.round(
          (todayAttendance.filter((r) => r.status === "present" || r.status === "late").length /
            todayAttendance.length) *
            100
        )
      : 0;

  const [pendingLeaves] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(leavesTable)
    .where(eq(leavesTable.status, "pending"));

  const unpaidFees = await db
    .select()
    .from(feesTable)
    .where(sql`status IN ('unpaid', 'partial', 'overdue')`);

  const pendingFees = unpaidFees.reduce(
    (sum, f) => sum + (f.amount - f.paidAmount),
    0
  );

  const allFees = await db.select().from(feesTable);
  const totalRevenue = allFees.reduce((sum, f) => sum + f.paidAmount, 0);

  // Recent announcements (last 5)
  const recentAnnouncementsRaw = await db
    .select()
    .from(announcementsTable)
    .orderBy(sql`created_at DESC`)
    .limit(5);

  const recentAnnouncements = await Promise.all(
    recentAnnouncementsRaw.map(async (a) => {
      const [author] = await db
        .select({ name: usersTable.name })
        .from(usersTable)
        .where(eq(usersTable.id, a.authorId));
      return {
        id: a.id,
        title: a.title,
        content: a.content,
        authorId: a.authorId,
        authorName: author?.name ?? "Unknown",
        targetRole: a.targetRole,
        classId: a.classId ?? null,
        className: null,
        createdAt: a.createdAt.toISOString(),
      };
    })
  );

  // Upcoming exams (next 5)
  const upcomingExamsRaw = await db
    .select()
    .from(examsTable)
    .where(
      and(
        gte(examsTable.examDate, today),
        eq(examsTable.status, "scheduled")
      )
    )
    .orderBy(examsTable.examDate)
    .limit(5);

  const upcomingExams = await Promise.all(
    upcomingExamsRaw.map(async (e) => {
      const [cls] = await db
        .select({ name: classesTable.name })
        .from(classesTable)
        .where(eq(classesTable.id, e.classId));
      const [subj] = await db
        .select({ name: subjectsTable.name })
        .from(subjectsTable)
        .where(eq(subjectsTable.id, e.subjectId));
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
    })
  );

  res.json({
    totalStudents: studentCount?.count ?? 0,
    totalTeachers: teacherCount?.count ?? 0,
    totalClasses: classCount?.count ?? 0,
    totalSubjects: subjectCount?.count ?? 0,
    todayAttendanceRate,
    pendingLeaves: pendingLeaves?.count ?? 0,
    pendingFees,
    totalRevenue,
    recentAnnouncements,
    upcomingExams,
  });
});

// Student dashboard
router.get("/dashboard/student/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [student] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, id));

  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }

  // Attendance rate
  const attendanceRecords = await db
    .select()
    .from(attendanceTable)
    .where(eq(attendanceTable.studentId, id));
  const attendanceRate =
    attendanceRecords.length > 0
      ? Math.round(
          (attendanceRecords.filter(
            (r) => r.status === "present" || r.status === "late"
          ).length /
            attendanceRecords.length) *
            100
        )
      : 0;

  // Pending assignments (active, not submitted by this student)
  const assignments = await db
    .select()
    .from(assignmentsTable)
    .where(
      and(
        eq(assignmentsTable.classId, student.classId ?? 0),
        eq(assignmentsTable.status, "active")
      )
    );
  const submissions = await db
    .select()
    .from(submissionsTable)
    .where(eq(submissionsTable.studentId, id));
  const submittedIds = new Set(submissions.map((s) => s.assignmentId));
  const pendingAssignments = assignments.filter(
    (a) => !submittedIds.has(a.id)
  ).length;

  // Upcoming exams
  const today = new Date().toISOString().split("T")[0];
  const upcomingExamsRaw = await db
    .select()
    .from(examsTable)
    .where(
      and(
        gte(examsTable.examDate, today),
        eq(examsTable.classId, student.classId ?? 0)
      )
    )
    .orderBy(examsTable.examDate)
    .limit(5);

  const upcomingExams = await Promise.all(
    upcomingExamsRaw.map(async (e) => {
      const [subj] = await db
        .select({ name: subjectsTable.name })
        .from(subjectsTable)
        .where(eq(subjectsTable.id, e.subjectId));
      return {
        id: e.id,
        title: e.title,
        classId: e.classId,
        className: null,
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
    })
  );

  // Recent results (last 5)
  const recentResultsRaw = await db
    .select()
    .from(resultsTable)
    .where(eq(resultsTable.studentId, id))
    .orderBy(sql`created_at DESC`)
    .limit(5);

  const recentResults = await Promise.all(
    recentResultsRaw.map(async (r) => {
      const [exam] = await db
        .select()
        .from(examsTable)
        .where(eq(examsTable.id, r.examId));
      const marks = parseFloat(r.marksObtained);
      return {
        id: r.id,
        examId: r.examId,
        examTitle: exam?.title ?? null,
        studentId: r.studentId,
        studentName: student.name,
        marksObtained: marks,
        totalMarks: exam?.totalMarks ?? 100,
        grade: getGrade(exam ? (marks / exam.totalMarks) * 100 : 0),
        remarks: r.remarks ?? null,
        isPassed: exam ? marks >= exam.passingMarks : false,
        createdAt: r.createdAt.toISOString(),
      };
    })
  );

  // Fee status
  const fees = await db
    .select()
    .from(feesTable)
    .where(eq(feesTable.studentId, id));
  const hasOverdue = fees.some((f) => f.status === "overdue");
  const hasPending = fees.some(
    (f) => f.status === "unpaid" || f.status === "partial"
  );
  const feeStatus = hasOverdue ? "overdue" : hasPending ? "pending" : "clear";

  // Notifications
  const notifications = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.userId, id))
    .orderBy(sql`created_at DESC`)
    .limit(10);

  // Timetable
  const timetableRaw = student.classId
    ? await db
        .select()
        .from(timetableTable)
        .where(eq(timetableTable.classId, student.classId))
        .orderBy(timetableTable.dayOfWeek)
    : [];

  const timetable = await Promise.all(
    timetableRaw.map(async (t) => {
      const [subj] = await db
        .select({ name: subjectsTable.name })
        .from(subjectsTable)
        .where(eq(subjectsTable.id, t.subjectId));
      const [teacher] = await db
        .select({ name: usersTable.name })
        .from(usersTable)
        .where(eq(usersTable.id, t.teacherId));
      return {
        id: t.id,
        classId: t.classId,
        className: null,
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
    })
  );

  res.json({
    student: {
      id: student.id,
      name: student.name,
      email: student.email,
      role: student.role,
      phone: student.phone ?? null,
      address: student.address ?? null,
      classId: student.classId ?? null,
      subjectIds: [],
      avatarUrl: student.avatarUrl ?? null,
      rollNumber: student.rollNumber ?? null,
      employeeId: student.employeeId ?? null,
      dateOfBirth: student.dateOfBirth ?? null,
      createdAt: student.createdAt.toISOString(),
    },
    attendanceRate,
    pendingAssignments,
    upcomingExams,
    recentResults,
    notifications: notifications.map((n) => ({
      id: n.id,
      userId: n.userId,
      title: n.title,
      message: n.message,
      type: n.type,
      isRead: n.isRead,
      createdAt: n.createdAt.toISOString(),
    })),
    feeStatus,
    timetable,
  });
});

// Teacher dashboard
router.get("/dashboard/teacher/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [teacher] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, id));

  if (!teacher) {
    res.status(404).json({ error: "Teacher not found" });
    return;
  }

  // Classes and students taught
  const teacherSubjects = await db
    .select()
    .from(subjectsTable)
    .where(eq(subjectsTable.teacherId, id));

  const teacherClasses = await db
    .select()
    .from(classesTable)
    .where(eq(classesTable.teacherId, id));

  const classIds = [
    ...new Set([
      ...teacherSubjects.map((s) => s.classId).filter(Boolean) as number[],
      ...teacherClasses.map((c) => c.id),
    ]),
  ];

  const [studentCount] = classIds.length > 0
    ? await db
        .select({ count: sql<number>`count(*)::int` })
        .from(usersTable)
        .where(
          and(
            eq(usersTable.role, "student"),
            sql`class_id = ANY(${classIds})`
          )
        )
    : [{ count: 0 }];

  const classesCount = classIds.length;

  // Pending submissions
  const teacherAssignments = await db
    .select()
    .from(assignmentsTable)
    .where(eq(assignmentsTable.teacherId, id));

  let pendingSubmissions = 0;
  for (const assignment of teacherAssignments) {
    const subs = await db
      .select()
      .from(submissionsTable)
      .where(
        and(
          eq(submissionsTable.assignmentId, assignment.id),
          eq(submissionsTable.status, "submitted")
        )
      );
    pendingSubmissions += subs.length;
  }

  // Upcoming exams
  const today = new Date().toISOString().split("T")[0];
  const upcomingExamsRaw =
    classIds.length > 0
      ? await db
          .select()
          .from(examsTable)
          .where(
            and(
              gte(examsTable.examDate, today),
              sql`class_id = ANY(${classIds})`
            )
          )
          .orderBy(examsTable.examDate)
          .limit(5)
      : [];

  const upcomingExams = await Promise.all(
    upcomingExamsRaw.map(async (e) => {
      const [subj] = await db
        .select({ name: subjectsTable.name })
        .from(subjectsTable)
        .where(eq(subjectsTable.id, e.subjectId));
      return {
        id: e.id,
        title: e.title,
        classId: e.classId,
        className: null,
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
    })
  );

  // Recent announcements
  const recentAnnouncementsRaw = await db
    .select()
    .from(announcementsTable)
    .orderBy(sql`created_at DESC`)
    .limit(5);

  const recentAnnouncements = await Promise.all(
    recentAnnouncementsRaw.map(async (a) => {
      const [author] = await db
        .select({ name: usersTable.name })
        .from(usersTable)
        .where(eq(usersTable.id, a.authorId));
      return {
        id: a.id,
        title: a.title,
        content: a.content,
        authorId: a.authorId,
        authorName: author?.name ?? "Unknown",
        targetRole: a.targetRole,
        classId: a.classId ?? null,
        className: null,
        createdAt: a.createdAt.toISOString(),
      };
    })
  );

  // Timetable
  const timetableRaw = await db
    .select()
    .from(timetableTable)
    .where(eq(timetableTable.teacherId, id))
    .orderBy(timetableTable.dayOfWeek);

  const timetable = await Promise.all(
    timetableRaw.map(async (t) => {
      const [subj] = await db
        .select({ name: subjectsTable.name })
        .from(subjectsTable)
        .where(eq(subjectsTable.id, t.subjectId));
      const [cls] = await db
        .select({ name: classesTable.name })
        .from(classesTable)
        .where(eq(classesTable.id, t.classId));
      return {
        id: t.id,
        classId: t.classId,
        className: cls?.name ?? null,
        subjectId: t.subjectId,
        subjectName: subj?.name ?? null,
        teacherId: t.teacherId,
        teacherName: teacher.name,
        dayOfWeek: t.dayOfWeek,
        startTime: t.startTime,
        endTime: t.endTime,
        room: t.room ?? null,
        createdAt: t.createdAt.toISOString(),
      };
    })
  );

  res.json({
    teacher: {
      id: teacher.id,
      name: teacher.name,
      email: teacher.email,
      role: teacher.role,
      phone: teacher.phone ?? null,
      address: teacher.address ?? null,
      classId: teacher.classId ?? null,
      subjectIds: [],
      avatarUrl: teacher.avatarUrl ?? null,
      rollNumber: teacher.rollNumber ?? null,
      employeeId: teacher.employeeId ?? null,
      dateOfBirth: teacher.dateOfBirth ?? null,
      createdAt: teacher.createdAt.toISOString(),
    },
    totalStudents: studentCount?.count ?? 0,
    classesCount,
    pendingSubmissions,
    upcomingExams,
    recentAnnouncements,
    timetable,
  });
});

// Attendance analytics
router.get("/analytics/attendance", async (req, res): Promise<void> => {
  const months = parseInt(String(req.query.months ?? "6"), 10) || 6;
  const classId = req.query.classId ? parseInt(String(req.query.classId), 10) : null;

  const result = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const month = d.toISOString().substring(0, 7);

    const conditions = [sql`date LIKE ${month + "%"}`];
    if (classId) conditions.push(eq(attendanceTable.classId, classId));

    const records = await db
      .select()
      .from(attendanceTable)
      .where(and(...conditions));

    const total = records.length;
    if (total === 0) {
      result.push({ month, presentRate: 0, absentRate: 0, lateRate: 0, totalStudents: 0 });
    } else {
      const present = records.filter((r) => r.status === "present").length;
      const absent = records.filter((r) => r.status === "absent").length;
      const late = records.filter((r) => r.status === "late").length;
      const uniqueStudents = new Set(records.map((r) => r.studentId)).size;
      result.push({
        month,
        presentRate: Math.round((present / total) * 100),
        absentRate: Math.round((absent / total) * 100),
        lateRate: Math.round((late / total) * 100),
        totalStudents: uniqueStudents,
      });
    }
  }

  res.json(result);
});

// Performance analytics
router.get("/analytics/performance", async (req, res): Promise<void> => {
  const classId = req.query.classId ? parseInt(String(req.query.classId), 10) : null;
  const subjectIdFilter = req.query.subjectId ? parseInt(String(req.query.subjectId), 10) : null;

  const examConditions = [];
  if (classId) examConditions.push(eq(examsTable.classId, classId));
  if (subjectIdFilter) examConditions.push(eq(examsTable.subjectId, subjectIdFilter));

  const exams = await db
    .select()
    .from(examsTable)
    .where(examConditions.length > 0 ? and(...examConditions) : undefined);

  const subjectMap: Record<
    number,
    { name: string; scores: number[]; passingMarks: number[]; totalMarks: number[] }
  > = {};

  for (const exam of exams) {
    const results = await db
      .select()
      .from(resultsTable)
      .where(eq(resultsTable.examId, exam.id));

    if (results.length === 0) continue;

    const [subj] = await db
      .select({ name: subjectsTable.name })
      .from(subjectsTable)
      .where(eq(subjectsTable.id, exam.subjectId));

    if (!subjectMap[exam.subjectId]) {
      subjectMap[exam.subjectId] = {
        name: subj?.name ?? "Unknown",
        scores: [],
        passingMarks: [],
        totalMarks: [],
      };
    }

    for (const r of results) {
      subjectMap[exam.subjectId].scores.push(parseFloat(r.marksObtained));
      subjectMap[exam.subjectId].passingMarks.push(exam.passingMarks);
      subjectMap[exam.subjectId].totalMarks.push(exam.totalMarks);
    }
  }

  const result = Object.values(subjectMap).map((s) => {
    const avg = s.scores.reduce((a, b) => a + b, 0) / s.scores.length;
    const passes = s.scores.filter((score, i) => score >= s.passingMarks[i]).length;
    return {
      subjectName: s.name,
      averageScore: Math.round(avg * 10) / 10,
      passRate: Math.round((passes / s.scores.length) * 100),
      highestScore: Math.max(...s.scores),
      lowestScore: Math.min(...s.scores),
    };
  });

  res.json(result);
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
