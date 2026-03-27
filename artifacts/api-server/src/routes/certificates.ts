import { Router, type IRouter } from "express";
import { db, certificatesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateCertificateBody, DeleteCertificateParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  try {
    const rows = await db.select().from(certificatesTable).orderBy(certificatesTable.createdAt);
    res.json(rows.map(r => ({
      ...r,
      createdAt: r.createdAt?.toISOString() ?? new Date().toISOString(),
    })));
  } catch (err) {
    req.log.error({ err }, "Failed to list certificates");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const body = CreateCertificateBody.parse(req.body);
    const [row] = await db.insert(certificatesTable).values({
      name: body.name,
      programName: body.programName,
      position: body.position,
    }).returning();
    res.status(201).json({
      ...row,
      createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create certificate");
    res.status(400).json({ error: "Invalid request" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = DeleteCertificateParams.parse({ id: req.params.id });
    await db.delete(certificatesTable).where(eq(certificatesTable.id, id));
    res.json({ success: true, message: "Certificate deleted" });
  } catch (err) {
    req.log.error({ err }, "Failed to delete certificate");
    res.status(400).json({ error: "Invalid request" });
  }
});

export default router;
