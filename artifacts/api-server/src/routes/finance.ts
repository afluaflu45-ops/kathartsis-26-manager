import { Router, type IRouter } from "express";
import { db, transactionsTable } from "@workspace/db";
import { eq, sum } from "drizzle-orm";
import { CreateTransactionBody, DeleteTransactionParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/transactions", async (req, res) => {
  try {
    const rows = await db.select().from(transactionsTable).orderBy(transactionsTable.createdAt);
    res.json(rows.map(r => ({
      ...r,
      amount: parseFloat(r.amount),
      notes: r.notes ?? "",
      createdAt: r.createdAt?.toISOString() ?? null,
    })));
  } catch (err) {
    req.log.error({ err }, "Failed to list transactions");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/transactions", async (req, res) => {
  try {
    const body = CreateTransactionBody.parse(req.body);
    const [row] = await db.insert(transactionsTable).values({
      date: body.date,
      type: body.type,
      category: body.category,
      name: body.name,
      amount: String(body.amount),
      paymentMethod: body.paymentMethod,
      notes: body.notes ?? "",
    }).returning();
    res.status(201).json({
      ...row,
      amount: parseFloat(row.amount),
      notes: row.notes ?? "",
      createdAt: row.createdAt?.toISOString() ?? null,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create transaction");
    res.status(400).json({ error: "Invalid request" });
  }
});

router.delete("/transactions/:id", async (req, res) => {
  try {
    const { id } = DeleteTransactionParams.parse({ id: req.params.id });
    await db.delete(transactionsTable).where(eq(transactionsTable.id, id));
    res.json({ success: true, message: "Transaction deleted" });
  } catch (err) {
    req.log.error({ err }, "Failed to delete transaction");
    res.status(400).json({ error: "Invalid request" });
  }
});

router.get("/summary", async (_req, res) => {
  try {
    const rows = await db.select().from(transactionsTable);
    let totalIncome = 0;
    let totalExpense = 0;
    for (const row of rows) {
      const amt = parseFloat(row.amount);
      if (row.type === "income") totalIncome += amt;
      else totalExpense += amt;
    }
    const balance = totalIncome - totalExpense;
    res.json({ totalIncome, totalExpense, balance });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
