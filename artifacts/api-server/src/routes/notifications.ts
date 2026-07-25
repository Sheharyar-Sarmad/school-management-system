import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, notificationsTable, announcementsTable, usersTable, classesTable } from "@workspace/db";
import {
  ListNotificationsQueryParams,
  CreateNotificationBody,
  ListAnnouncementsQueryParams,
  CreateAnnouncementBody,
  DeleteAnnouncementParams,
} from "@workspace/api-zod";

const router = Router();

// Notifications
router.get("/notifications", async (req, res): Promise<void> => {
  const params = ListNotificationsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { userId, unread } = params.data;
  const conditions = [];
  if (userId != null) conditions.push(eq(notificationsTable.userId, userId));
  if (unread != null) conditions.push(eq(notificationsTable.isRead, !unread));

  const notifications = await db
    .select()
    .from(notificationsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(notificationsTable.createdAt);

  res.json(
    notifications.map((n) => ({
      id: n.id,
      userId: n.userId,
      title: n.title,
      message: n.message,
      type: n.type,
      isRead: n.isRead,
      createdAt: n.createdAt.toISOString(),
    }))
  );
});

router.post("/notifications", async (req, res): Promise<void> => {
  const parsed = CreateNotificationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [n] = await db.insert(notificationsTable).values(parsed.data).returning();
  res.status(201).json({
    id: n.id,
    userId: n.userId,
    title: n.title,
    message: n.message,
    type: n.type,
    isRead: n.isRead,
    createdAt: n.createdAt.toISOString(),
  });
});

router.patch("/notifications/:id/read", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [n] = await db
    .update(notificationsTable)
    .set({ isRead: true })
    .where(eq(notificationsTable.id, id))
    .returning();

  if (!n) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }

  res.json({
    id: n.id,
    userId: n.userId,
    title: n.title,
    message: n.message,
    type: n.type,
    isRead: n.isRead,
    createdAt: n.createdAt.toISOString(),
  });
});

// Announcements
router.get("/announcements", async (req, res): Promise<void> => {
  const params = ListAnnouncementsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { targetRole, classId } = params.data;
  const conditions = [];
  if (targetRole) conditions.push(eq(announcementsTable.targetRole, targetRole));
  if (classId != null) conditions.push(eq(announcementsTable.classId, classId));

  const announcements = await db
    .select()
    .from(announcementsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(announcementsTable.createdAt);

  const result = await Promise.all(
    announcements.map(async (a) => {
      const [author] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, a.authorId));
      let className: string | null = null;
      if (a.classId) {
        const [cls] = await db.select({ name: classesTable.name }).from(classesTable).where(eq(classesTable.id, a.classId));
        className = cls?.name ?? null;
      }
      return {
        id: a.id,
        title: a.title,
        content: a.content,
        authorId: a.authorId,
        authorName: author?.name ?? "Unknown",
        targetRole: a.targetRole,
        classId: a.classId ?? null,
        className,
        createdAt: a.createdAt.toISOString(),
      };
    })
  );

  res.json(result);
});

router.post("/announcements", async (req, res): Promise<void> => {
  const parsed = CreateAnnouncementBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [a] = await db.insert(announcementsTable).values(parsed.data).returning();
  const [author] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, a.authorId));

  res.status(201).json({
    id: a.id,
    title: a.title,
    content: a.content,
    authorId: a.authorId,
    authorName: author?.name ?? "Unknown",
    targetRole: a.targetRole,
    classId: a.classId ?? null,
    className: null,
    createdAt: a.createdAt.toISOString(),
  });
});

router.delete("/announcements/:id", async (req, res): Promise<void> => {
  const params = DeleteAnnouncementParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [a] = await db.delete(announcementsTable).where(eq(announcementsTable.id, params.data.id)).returning();
  if (!a) {
    res.status(404).json({ error: "Announcement not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
