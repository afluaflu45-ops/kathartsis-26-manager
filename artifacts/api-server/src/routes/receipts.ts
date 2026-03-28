import { Router, type IRouter } from "express";
import { db, receiptsTable, transactionsTable } from "@workspace/db";
import { CreateReceiptBody } from "@workspace/api-zod";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

async function generateReceiptNumber(): Promise<string> {
  const result = await db.select({ count: sql<number>`count(*)` }).from(receiptsTable);
  const count = Number(result[0]?.count ?? 0) + 1;
  return `#${String(count).padStart(6, "0")}`;
}

router.get("/", async (req, res) => {
  try {
    const rows = await db.select().from(receiptsTable).orderBy(receiptsTable.createdAt);
    res.json(rows.map(r => ({
      ...r,
      amount: parseFloat(r.amount),
      createdAt: r.createdAt?.toISOString() ?? new Date().toISOString(),
    })));
  } catch (err) {
    req.log.error({ err }, "Failed to list receipts");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const body = CreateReceiptBody.parse(req.body);
    const receiptNumber = await generateReceiptNumber();

    const [row] = await db.insert(receiptsTable).values({
      receiptNumber,
      donorName: body.donorName,
      amount: String(body.amount),
      paymentMethod: body.paymentMethod,
    }).returning();

    await db.insert(transactionsTable).values({
      date: new Date().toISOString().split("T")[0],
      type: "income",
      category: "Donation",
      name: body.donorName,
      amount: String(body.amount),
      paymentMethod: body.paymentMethod,
      notes: `Auto-entry from Receipt ${receiptNumber}`,
    });

    res.status(201).json({
      ...row,
      amount: parseFloat(row.amount),
      createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create receipt");
    res.status(400).json({ error: "Invalid request" });
  }
});

export default router;
