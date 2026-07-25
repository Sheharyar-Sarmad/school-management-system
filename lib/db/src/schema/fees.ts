import { pgTable, text, serial, timestamp, integer, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const feesTable = pgTable("fees", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  amount: doublePrecision("amount").notNull(),
  paidAmount: doublePrecision("paid_amount").notNull().default(0),
  dueDate: text("due_date").notNull(),
  paidDate: text("paid_date"),
  status: text("status", { enum: ["paid", "unpaid", "partial", "overdue"] }).notNull().default("unpaid"),
  feeType: text("fee_type", { enum: ["tuition", "transport", "library", "sports", "examination", "other"] }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertFeeSchema = createInsertSchema(feesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFee = z.infer<typeof insertFeeSchema>;
export type Fee = typeof feesTable.$inferSelect;
