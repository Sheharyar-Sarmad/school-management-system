import crypto from "crypto";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "school_salt_2024").digest("hex");
}

async function seed() {
  console.log("Seeding database...");

  // Clear existing data in order
  await db.delete(schema.leavesTable);
  await db.delete(schema.timetableTable);
  await db.delete(schema.announcementsTable);
  await db.delete(schema.notificationsTable);
  await db.delete(schema.feesTable);
  await db.delete(schema.resultsTable);
  await db.delete(schema.submissionsTable);
  await db.delete(schema.assignmentsTable);
  await db.delete(schema.examsTable);
  await db.delete(schema.attendanceTable);
  await db.delete(schema.subjectsTable);
  await db.delete(schema.usersTable);
  await db.delete(schema.classesTable);

  // Classes
  const [classA] = await db.insert(schema.classesTable).values({ name: "Class 10", section: "A", grade: "10" }).returning();
  const [classB] = await db.insert(schema.classesTable).values({ name: "Class 10", section: "B", grade: "10" }).returning();
  const [classC] = await db.insert(schema.classesTable).values({ name: "Class 9", section: "A", grade: "9" }).returning();
  console.log("Classes created:", classA.id, classB.id, classC.id);

  // Admin
  const [admin] = await db.insert(schema.usersTable).values({
    name: "Sarah Mitchell",
    email: "admin@school.com",
    passwordHash: hashPassword("password123"),
    role: "admin",
    employeeId: "ADM001",
    phone: "+1-555-0100",
  }).returning();

  // Teachers
  const [teacher1] = await db.insert(schema.usersTable).values({
    name: "James Wilson",
    email: "teacher1@school.com",
    passwordHash: hashPassword("password123"),
    role: "teacher",
    employeeId: "TCH001",
    phone: "+1-555-0101",
  }).returning();

  const [teacher2] = await db.insert(schema.usersTable).values({
    name: "Emily Chen",
    email: "teacher2@school.com",
    passwordHash: hashPassword("password123"),
    role: "teacher",
    employeeId: "TCH002",
    phone: "+1-555-0102",
  }).returning();

  const [teacher3] = await db.insert(schema.usersTable).values({
    name: "Robert Davis",
    email: "teacher3@school.com",
    passwordHash: hashPassword("password123"),
    role: "teacher",
    employeeId: "TCH003",
    phone: "+1-555-0103",
  }).returning();
  console.log("Teachers created:", teacher1.id, teacher2.id, teacher3.id);

  // Update classes with homeroom teachers
  await db.update(schema.classesTable).set({ teacherId: teacher1.id }).where(eq(schema.classesTable.id, classA.id));
  await db.update(schema.classesTable).set({ teacherId: teacher2.id }).where(eq(schema.classesTable.id, classB.id));

  // Students
  const studentData = [
    { name: "Alex Thompson", email: "student1@school.com", rollNumber: "10A001", classId: classA.id },
    { name: "Maria Garcia", email: "student2@school.com", rollNumber: "10A002", classId: classA.id },
    { name: "Kevin Park", email: "student3@school.com", rollNumber: "10A003", classId: classA.id },
    { name: "Jessica Brown", email: "student4@school.com", rollNumber: "10A004", classId: classA.id },
    { name: "Marcus Johnson", email: "student5@school.com", rollNumber: "10A005", classId: classA.id },
    { name: "Priya Patel", email: "student6@school.com", rollNumber: "10B001", classId: classB.id },
    { name: "Tyler Lee", email: "student7@school.com", rollNumber: "10B002", classId: classB.id },
    { name: "Sofia Rodriguez", email: "student8@school.com", rollNumber: "10B003", classId: classB.id },
  ];

  const students = await Promise.all(
    studentData.map((s) =>
      db.insert(schema.usersTable).values({
        ...s,
        passwordHash: hashPassword("password123"),
        role: "student",
      }).returning().then(([u]) => u)
    )
  );
  console.log("Students created:", students.length);

  // Subjects
  const [mathSubj] = await db.insert(schema.subjectsTable).values({
    name: "Mathematics", code: "MATH10", classId: classA.id, teacherId: teacher1.id,
    description: "Advanced Mathematics for Grade 10"
  }).returning();

  const [sciSubj] = await db.insert(schema.subjectsTable).values({
    name: "Science", code: "SCI10", classId: classA.id, teacherId: teacher2.id,
    description: "Physics, Chemistry, Biology"
  }).returning();

  const [engSubj] = await db.insert(schema.subjectsTable).values({
    name: "English", code: "ENG10", classId: classA.id, teacherId: teacher3.id,
    description: "English Language and Literature"
  }).returning();

  const [histSubj] = await db.insert(schema.subjectsTable).values({
    name: "History", code: "HIST10", classId: classB.id, teacherId: teacher1.id,
    description: "World History"
  }).returning();

  const [mathSubjB] = await db.insert(schema.subjectsTable).values({
    name: "Mathematics", code: "MATH10B", classId: classB.id, teacherId: teacher1.id,
    description: "Advanced Mathematics for Grade 10B"
  }).returning();

  const [sciSubjB] = await db.insert(schema.subjectsTable).values({
    name: "Science", code: "SCI10B", classId: classB.id, teacherId: teacher2.id,
    description: "Science for Grade 10B"
  }).returning();
  console.log("Subjects created");

  // Attendance (last 30 days)
  const classAStudents = students.filter((s) => s.classId === classA.id);
  const classBStudents = students.filter((s) => s.classId === classB.id);
  const statuses: Array<"present" | "absent" | "late" | "excused"> = ["present", "present", "present", "present", "late", "absent"];
  const today = new Date();

  for (let day = 29; day >= 0; day--) {
    const d = new Date(today);
    d.setDate(d.getDate() - day);
    if (d.getDay() === 0 || d.getDay() === 6) continue; // Skip weekends
    const dateStr = d.toISOString().split("T")[0];

    for (const student of classAStudents) {
      await db.insert(schema.attendanceTable).values({
        studentId: student.id,
        classId: classA.id,
        date: dateStr,
        status: statuses[Math.floor(Math.random() * statuses.length)],
      });
    }
    for (const student of classBStudents) {
      await db.insert(schema.attendanceTable).values({
        studentId: student.id,
        classId: classB.id,
        date: dateStr,
        status: statuses[Math.floor(Math.random() * statuses.length)],
      });
    }
  }
  console.log("Attendance created");

  // Assignments
  const futureDate = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split("T")[0];
  };
  const pastDate = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().split("T")[0];
  };

  const [assign1] = await db.insert(schema.assignmentsTable).values({
    title: "Quadratic Equations Problem Set",
    description: "Solve 20 problems on quadratic equations",
    classId: classA.id, subjectId: mathSubj.id, teacherId: teacher1.id,
    dueDate: futureDate(5), totalMarks: 20,
  }).returning();

  const [assign2] = await db.insert(schema.assignmentsTable).values({
    title: "Newton's Laws Lab Report",
    description: "Write a lab report on the experiment",
    classId: classA.id, subjectId: sciSubj.id, teacherId: teacher2.id,
    dueDate: futureDate(3), totalMarks: 30,
  }).returning();

  const [assign3] = await db.insert(schema.assignmentsTable).values({
    title: "Essay: Modern Literature",
    description: "500-word essay on a modern novel",
    classId: classA.id, subjectId: engSubj.id, teacherId: teacher3.id,
    dueDate: pastDate(2), status: "closed", totalMarks: 25,
  }).returning();

  // Submissions for past assignment
  for (const student of classAStudents.slice(0, 4)) {
    await db.insert(schema.submissionsTable).values({
      assignmentId: assign3.id,
      studentId: student.id,
      notes: "Submitted on time",
      status: "graded",
      marksObtained: Math.floor(Math.random() * 8) + 17, // 17-24
    });
  }

  // One submission for active assignment
  await db.insert(schema.submissionsTable).values({
    assignmentId: assign1.id,
    studentId: classAStudents[0].id,
    notes: "Completed all problems",
    status: "submitted",
  });
  console.log("Assignments created");

  // Exams
  const [exam1] = await db.insert(schema.examsTable).values({
    title: "Mid-Term Mathematics",
    classId: classA.id, subjectId: mathSubj.id,
    examDate: futureDate(10), startTime: "09:00", endTime: "11:00",
    totalMarks: 100, passingMarks: 40,
    venue: "Hall A", status: "scheduled",
  }).returning();

  const [exam2] = await db.insert(schema.examsTable).values({
    title: "Science Unit Test",
    classId: classA.id, subjectId: sciSubj.id,
    examDate: futureDate(15), startTime: "10:00", endTime: "12:00",
    totalMarks: 50, passingMarks: 20,
    venue: "Lab 2", status: "scheduled",
  }).returning();

  const [exam3] = await db.insert(schema.examsTable).values({
    title: "English Mid-Term",
    classId: classA.id, subjectId: engSubj.id,
    examDate: pastDate(10), startTime: "09:00", endTime: "11:00",
    totalMarks: 80, passingMarks: 32,
    venue: "Hall B", status: "completed",
  }).returning();

  const [exam4] = await db.insert(schema.examsTable).values({
    title: "Mid-Term Mathematics",
    classId: classB.id, subjectId: mathSubjB.id,
    examDate: futureDate(12), startTime: "09:00", endTime: "11:00",
    totalMarks: 100, passingMarks: 40,
    venue: "Hall C", status: "scheduled",
  }).returning();

  // Results for completed exam
  const engScores = [72, 58, 68, 75];
  for (let i = 0; i < classAStudents.length; i++) {
    const score = engScores[i % engScores.length] + Math.floor(Math.random() * 6 - 3);
    await db.insert(schema.resultsTable).values({
      examId: exam3.id,
      studentId: classAStudents[i].id,
      marksObtained: String(Math.min(80, Math.max(0, score))),
      remarks: score >= 64 ? "Good performance" : "Needs improvement",
    });
  }
  console.log("Exams and results created");

  // Fees
  const feeMonths = [pastDate(60), pastDate(30), futureDate(1)];
  const feeTypes: Array<"tuition" | "transport" | "library"> = ["tuition", "transport", "library"];
  for (const student of students) {
    for (let i = 0; i < feeMonths.length; i++) {
      const isPast = i < 2;
      const isFirst = i === 0;
      await db.insert(schema.feesTable).values({
        studentId: student.id,
        amount: i === 0 ? 1500 : i === 1 ? 1500 : 1500,
        paidAmount: isPast ? (isFirst ? 1500 : 1500) : 0,
        dueDate: feeMonths[i],
        paidDate: isPast ? feeMonths[i] : null,
        status: isPast ? "paid" : "unpaid",
        feeType: "tuition",
        description: `Tuition Fee - Month ${i + 1}`,
      });
    }
    // Transport fee (some unpaid)
    await db.insert(schema.feesTable).values({
      studentId: student.id,
      amount: 200,
      paidAmount: student.id % 3 === 0 ? 0 : 200,
      dueDate: futureDate(5),
      paidDate: student.id % 3 === 0 ? null : pastDate(5),
      status: student.id % 3 === 0 ? "overdue" : "paid",
      feeType: "transport",
      description: "Monthly Transport Fee",
    });
  }
  console.log("Fees created");

  // Timetable for Class A
  const timetableData: Array<{
    classId: number; subjectId: number; teacherId: number;
    dayOfWeek: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";
    startTime: string; endTime: string; room: string;
  }> = [
    { classId: classA.id, subjectId: mathSubj.id, teacherId: teacher1.id, dayOfWeek: "Monday", startTime: "08:00", endTime: "09:00", room: "Room 101" },
    { classId: classA.id, subjectId: sciSubj.id, teacherId: teacher2.id, dayOfWeek: "Monday", startTime: "09:00", endTime: "10:00", room: "Lab 1" },
    { classId: classA.id, subjectId: engSubj.id, teacherId: teacher3.id, dayOfWeek: "Monday", startTime: "10:00", endTime: "11:00", room: "Room 102" },
    { classId: classA.id, subjectId: mathSubj.id, teacherId: teacher1.id, dayOfWeek: "Tuesday", startTime: "08:00", endTime: "09:00", room: "Room 101" },
    { classId: classA.id, subjectId: histSubj.id, teacherId: teacher1.id, dayOfWeek: "Tuesday", startTime: "09:00", endTime: "10:00", room: "Room 103" },
    { classId: classA.id, subjectId: sciSubj.id, teacherId: teacher2.id, dayOfWeek: "Wednesday", startTime: "08:00", endTime: "09:00", room: "Lab 1" },
    { classId: classA.id, subjectId: engSubj.id, teacherId: teacher3.id, dayOfWeek: "Wednesday", startTime: "09:00", endTime: "10:00", room: "Room 102" },
    { classId: classA.id, subjectId: mathSubj.id, teacherId: teacher1.id, dayOfWeek: "Thursday", startTime: "08:00", endTime: "09:00", room: "Room 101" },
    { classId: classA.id, subjectId: sciSubj.id, teacherId: teacher2.id, dayOfWeek: "Friday", startTime: "08:00", endTime: "09:00", room: "Lab 1" },
    { classId: classA.id, subjectId: engSubj.id, teacherId: teacher3.id, dayOfWeek: "Friday", startTime: "09:00", endTime: "10:00", room: "Room 102" },
    // Class B
    { classId: classB.id, subjectId: mathSubjB.id, teacherId: teacher1.id, dayOfWeek: "Monday", startTime: "11:00", endTime: "12:00", room: "Room 201" },
    { classId: classB.id, subjectId: sciSubjB.id, teacherId: teacher2.id, dayOfWeek: "Tuesday", startTime: "11:00", endTime: "12:00", room: "Lab 2" },
  ];

  for (const entry of timetableData) {
    await db.insert(schema.timetableTable).values(entry);
  }
  console.log("Timetable created");

  // Announcements
  await db.insert(schema.announcementsTable).values({
    title: "Annual Sports Day - Registration Open",
    content: "The annual sports day will be held on the 15th of next month. All students are encouraged to participate. Registration forms are available at the front office.",
    authorId: admin.id, targetRole: "all",
  });

  await db.insert(schema.announcementsTable).values({
    title: "Parent-Teacher Meeting - Schedule Released",
    content: "Parent-teacher meetings are scheduled for next Friday. Please ensure all grade books are updated before the meeting. Slot timings will be communicated via email.",
    authorId: admin.id, targetRole: "teacher",
  });

  await db.insert(schema.announcementsTable).values({
    title: "Mid-Term Exam Schedule Published",
    content: "The mid-term examination schedule has been published. Students are advised to review their timetables and prepare accordingly. Hall tickets will be distributed Monday.",
    authorId: admin.id, targetRole: "student",
  });

  await db.insert(schema.announcementsTable).values({
    title: "Library Hours Extended",
    content: "The school library will now remain open until 6 PM on weekdays. Students can use the study rooms for group study sessions. Please carry your student ID.",
    authorId: teacher1.id, targetRole: "student", classId: classA.id,
  });
  console.log("Announcements created");

  // Notifications for students
  for (const student of students) {
    await db.insert(schema.notificationsTable).values({
      userId: student.id, title: "Mid-Term Schedule Published",
      message: "Your mid-term examination schedule is now available. Check the exams section.",
      type: "exam", isRead: false,
    });
    await db.insert(schema.notificationsTable).values({
      userId: student.id, title: "Upcoming Assignment Deadline",
      message: "You have 2 assignments due this week. Please submit on time.",
      type: "assignment", isRead: Math.random() > 0.5,
    });
  }

  // Notifications for teachers
  for (const teacher of [teacher1, teacher2, teacher3]) {
    await db.insert(schema.notificationsTable).values({
      userId: teacher.id, title: "Parent-Teacher Meeting",
      message: "Parent-teacher meeting is scheduled for next Friday. Please prepare grade summaries.",
      type: "announcement", isRead: false,
    });
  }
  console.log("Notifications created");

  // Leave requests
  await db.insert(schema.leavesTable).values({
    userId: students[0].id, fromDate: futureDate(3), toDate: futureDate(4),
    reason: "Family function attendance required", status: "pending",
  });

  await db.insert(schema.leavesTable).values({
    userId: students[1].id, fromDate: pastDate(5), toDate: pastDate(3),
    reason: "Medical appointment", status: "approved",
    adminRemarks: "Approved. Please submit medical certificate.",
  });

  await db.insert(schema.leavesTable).values({
    userId: teacher1.id, fromDate: futureDate(7), toDate: futureDate(7),
    reason: "Personal appointment", status: "pending",
  });

  await db.insert(schema.leavesTable).values({
    userId: students[2].id, fromDate: pastDate(10), toDate: pastDate(8),
    reason: "Fever and flu symptoms", status: "approved",
    adminRemarks: "Approved with medical certificate.",
  });
  console.log("Leaves created");

  console.log("\nSeed complete! Demo credentials:");
  console.log("  Admin:   admin@school.com / password123");
  console.log("  Teacher: teacher1@school.com / password123");
  console.log("  Student: student1@school.com / password123");

  await pool.end();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
