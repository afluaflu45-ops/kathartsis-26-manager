import { Router, type IRouter } from "express";
import { db, stickersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateStickerBody, DeleteStickerParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  try {
    const rows = await db.select().from(stickersTable).orderBy(stickersTable.createdAt);
    res.json(rows.map(r => ({
      ...r,
      createdAt: r.createdAt?.toISOString() ?? new Date().toISOString(),
    })));
  } catch (err) {
    req.log.error({ err }, "Failed to list stickers");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const body = CreateStickerBody.parse(req.body);
    const [row] = await db.insert(stickersTable).values({
      programName: body.programName,
      position: body.position,
      name: body.name,
    }).returning();
    res.status(201).json({
      ...row,
      createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create sticker");
    res.status(400).json({ error: "Invalid request" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = DeleteStickerParams.parse({ id: req.params.id });
    await db.delete(stickersTable).where(eq(stickersTable.id, id));
    res.json({ success: true, message: "Sticker deleted" });
  } catch (err) {
    req.log.error({ err }, "Failed to delete sticker");
    res.status(400).json({ error: "Invalid request" });
  }
});

export default router;
