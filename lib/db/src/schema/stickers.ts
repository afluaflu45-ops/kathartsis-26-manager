import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const stickersTable = pgTable("stickers", {
  id: serial("id").primaryKey(),
  programName: text("program_name").notNull(),
  position: text("position").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertStickerSchema = createInsertSchema(stickersTable).omit({ id: true, createdAt: true });
export type InsertSticker = z.infer<typeof insertStickerSchema>;
export type Sticker = typeof stickersTable.$inferSelect;
