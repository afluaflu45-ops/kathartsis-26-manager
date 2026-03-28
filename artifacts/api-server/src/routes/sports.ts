import { Router, type IRouter } from "express";
import { db, sportsParticipantsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/participants", async (_req, res) => {
  try {
    const rows = await db.select().from(sportsParticipantsTable).orderBy(sportsParticipantsTable.createdAt);
    res.json(rows.map(r => ({
      ...r,
      score: parseFloat(r.score),
      createdAt: r.createdAt?.toISOString() ?? null,
    })));
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/participants", async (req, res) => {
  try {
    const { studentName, team, sportsItem, codeLetter, score } = req.body;
    if (!studentName || !team || !sportsItem || !codeLetter) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }
    const [row] = await db.insert(sportsParticipantsTable).values({
      studentName: String(studentName),
      team: String(team),
      sportsItem: String(sportsItem),
      codeLetter: String(codeLetter),
      score: String(Number(score) || 0),
    }).returning();
    res.status(201).json({
      ...row,
      score: parseFloat(row.score),
      createdAt: row.createdAt?.toISOString() ?? null,
    });
  } catch (err) {
    res.status(400).json({ error: "Invalid request" });
  }
});

router.delete("/participants/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
    await db.delete(sportsParticipantsTable).where(eq(sportsParticipantsTable.id, id));
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: "Invalid request" });
  }
});

router.get("/scoreboard", async (_req, res) => {
  try {
    const rows = await db.select().from(sportsParticipantsTable);

    const TEAMS = ["Cira Cimarron", "Maze Mocambo", "Aza Azania"];
    const teamScores: Record<string, number> = {};
    TEAMS.forEach(t => { teamScores[t] = 0; });

    const studentMap: Record<string, { name: string; team: string; total: number; events: string[] }> = {};

    for (const row of rows) {
      const score = parseFloat(row.score);
      if (teamScores[row.team] !== undefined) teamScores[row.team] += score;
      else teamScores[row.team] = score;

      if (!studentMap[row.studentName]) {
        studentMap[row.studentName] = { name: row.studentName, team: row.team, total: 0, events: [] };
      }
      studentMap[row.studentName].total += score;
      if (!studentMap[row.studentName].events.includes(row.sportsItem)) {
        studentMap[row.studentName].events.push(row.sportsItem);
      }
    }

    const teamScoreboard = TEAMS.map(team => ({
      team,
      total: teamScores[team] ?? 0,
    })).sort((a, b) => b.total - a.total);

    const studentScoreboard = Object.values(studentMap)
      .sort((a, b) => b.total - a.total);

    res.json({ teamScoreboard, studentScoreboard });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
