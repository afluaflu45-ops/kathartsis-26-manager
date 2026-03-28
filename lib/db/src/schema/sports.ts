import { pgTable, serial, text, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const sportsParticipantsTable = pgTable("sports_participants", {
  id: serial("id").primaryKey(),
  studentName: text("student_name").notNull(),
  team: text("team").notNull(),
  sportsItem: text("sports_item").notNull(),
  codeLetter: text("code_letter").notNull(),
  score: numeric("score", { precision: 10, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSportsParticipantSchema = createInsertSchema(sportsParticipantsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertSportsParticipant = z.infer<typeof insertSportsParticipantSchema>;
export type SportsParticipant = typeof sportsParticipantsTable.$inferSelect;
