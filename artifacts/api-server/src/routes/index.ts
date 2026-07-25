import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import classesRouter from "./classes";
import subjectsRouter from "./subjects";
import attendanceRouter from "./attendance";
import assignmentsRouter from "./assignments";
import examsRouter from "./exams";
import feesRouter from "./fees";
import notificationsRouter from "./notifications";
import timetableRouter from "./timetable";
import leavesRouter from "./leaves";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(classesRouter);
router.use(subjectsRouter);
router.use(attendanceRouter);
router.use(assignmentsRouter);
router.use(examsRouter);
router.use(feesRouter);
router.use(notificationsRouter);
router.use(timetableRouter);
router.use(leavesRouter);
router.use(dashboardRouter);

export default router;
