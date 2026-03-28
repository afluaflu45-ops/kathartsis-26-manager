import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Trophy, Medal, Users, Download } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";

const TEAMS = ["Cira Cimarron", "Maze Mocambo", "Aza Azania"] as const;
const TEAM_COLORS = {
  "Cira Cimarron": { bg: "#fef3c7", border: "#f59e0b", text: "#92400e", badge: "#fbbf24" },
  "Maze Mocambo": { bg: "#dbeafe", border: "#3b82f6", text: "#1e3a8a", badge: "#60a5fa" },
  "Aza Azania": { bg: "#dcfce7", border: "#22c55e", text: "#14532d", badge: "#4ade80" },
};

type SportsParticipant = {
  id: number;
  studentName: string;
  team: string;
  sportsItem: string;
  codeLetter: string;
  score: number;
  createdAt: string;
};

type Scoreboard = {
  teamScoreboard: { team: string; total: number }[];
  studentScoreboard: { name: string; team: string; total: number; events: string[] }[];
};

const formSchema = z.object({
  studentName: z.string().min(1, "Student name is required"),
  team: z.enum(["Cira Cimarron", "Maze Mocambo", "Aza Azania"]),
  sportsItem: z.string().min(1, "Sports item is required"),
  codeLetter: z.string().min(1, "Code letter is required"),
  score: z.coerce.number().min(0, "Score must be 0 or more"),
});

type FormValues = z.infer<typeof formSchema>;

async function fetchParticipants(): Promise<SportsParticipant[]> {
  const res = await fetch("/api/sports/participants");
  if (!res.ok) throw new Error("Failed to fetch participants");
  return res.json();
}

async function fetchScoreboard(): Promise<Scoreboard> {
  const res = await fetch("/api/sports/scoreboard");
  if (!res.ok) throw new Error("Failed to fetch scoreboard");
  return res.json();
}

async function createParticipant(data: FormValues): Promise<SportsParticipant> {
  const res = await fetch("/api/sports/participants", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create participant");
  return res.json();
}

async function deleteParticipant(id: number): Promise<void> {
  const res = await fetch(`/api/sports/participants/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete participant");
}

function rankMedal(i: number) {
  if (i === 0) return "🥇";
  if (i === 1) return "🥈";
  if (i === 2) return "🥉";
  return `${i + 1}.`;
}

export default function Sports() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"participants" | "scoreboard">("participants");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const { data: participants = [], isLoading } = useQuery({
    queryKey: ["sports-participants"],
    queryFn: fetchParticipants,
  });

  const { data: scoreboard } = useQuery({
    queryKey: ["sports-scoreboard"],
    queryFn: fetchScoreboard,
  });

  const createMutation = useMutation({
    mutationFn: createParticipant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sports-participants"] });
      queryClient.invalidateQueries({ queryKey: ["sports-scoreboard"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteParticipant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sports-participants"] });
      queryClient.invalidateQueries({ queryKey: ["sports-scoreboard"] });
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { team: "Cira Cimarron", score: 0 },
  });

  const onSubmit = (data: FormValues) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        form.reset({ team: "Cira Cimarron", score: 0 });
        setIsFormOpen(false);
      },
    });
  };

  const downloadCSV = () => {
    const headers = ["Student Name", "Team", "Sports Item", "Code Letter", "Score", "Date"];
    const rows = participants.map(p => [
      p.studentName,
      p.team,
      p.sportsItem,
      p.codeLetter,
      p.score,
      new Date(p.createdAt).toLocaleDateString("en-IN"),
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sports-data.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const printScoreboard = (type: "team" | "student") => {
    const printEl = document.getElementById(`print-${type}-scoreboard`);
    if (!printEl) return;
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printEl.innerHTML;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  const teamColors = TEAM_COLORS;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Sports Management</h2>
          <p className="text-muted-foreground mt-1">Manage participants, scores, and leaderboards.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={downloadCSV} className="gap-2">
            <Download className="w-4 h-4" /> Export CSV
          </Button>
          <Button onClick={() => setIsFormOpen(!isFormOpen)} className="gap-2">
            <Plus className="w-4 h-4" /> Add Participant
          </Button>
        </div>
      </div>

      {isFormOpen && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
          <Card className="border-primary/20 shadow-md">
            <CardHeader>
              <CardTitle>New Participant Entry</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Student Name</label>
                    <input
                      type="text"
                      {...form.register("studentName")}
                      className="w-full h-10 px-3 rounded-md border bg-background"
                      placeholder="Full Name"
                    />
                    {form.formState.errors.studentName && (
                      <p className="text-xs text-red-500">{form.formState.errors.studentName.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Team</label>
                    <select
                      {...form.register("team")}
                      className="w-full h-10 px-3 rounded-md border bg-background"
                    >
                      {TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Sports Item / Event</label>
                    <input
                      type="text"
                      {...form.register("sportsItem")}
                      className="w-full h-10 px-3 rounded-md border bg-background"
                      placeholder="e.g. Football, Cricket"
                    />
                    {form.formState.errors.sportsItem && (
                      <p className="text-xs text-red-500">{form.formState.errors.sportsItem.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Code Letter</label>
                    <input
                      type="text"
                      {...form.register("codeLetter")}
                      className="w-full h-10 px-3 rounded-md border bg-background"
                      placeholder="e.g. A1, B2"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Score / Marks</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      {...form.register("score")}
                      className="w-full h-10 px-3 rounded-md border bg-background"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)} disabled={createMutation.isPending}>Cancel</Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Saving..." : "Save Participant"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="flex gap-2 border-b">
        {(["participants", "scoreboard"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
              tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "participants" ? <><Users className="w-4 h-4 inline mr-1" />Participants</> : <><Trophy className="w-4 h-4 inline mr-1" />Scoreboard</>}
          </button>
        ))}
      </div>

      {tab === "participants" && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-secondary/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">#</th>
                  <th className="px-4 py-3 font-medium">Student Name</th>
                  <th className="px-4 py-3 font-medium">Team</th>
                  <th className="px-4 py-3 font-medium">Sports Item</th>
                  <th className="px-4 py-3 font-medium">Code</th>
                  <th className="px-4 py-3 font-medium text-right">Score</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr><td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">Loading...</td></tr>
                ) : participants.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">No participants yet. Add one above.</td></tr>
                ) : (
                  participants.map((p, idx) => {
                    const tc = teamColors[p.team as keyof typeof teamColors];
                    return (
                      <tr key={p.id} className="hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                        <td className="px-4 py-3 font-semibold">{p.studentName}</td>
                        <td className="px-4 py-3">
                          <span
                            className="px-2.5 py-1 rounded-full text-xs font-bold"
                            style={tc ? { backgroundColor: tc.badge, color: tc.text } : {}}
                          >
                            {p.team}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{p.sportsItem}</td>
                        <td className="px-4 py-3 font-mono font-bold text-primary">{p.codeLetter}</td>
                        <td className="px-4 py-3 text-right font-bold text-green-700">{p.score}</td>
                        <td className="px-4 py-3">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => { if (confirm("Delete this participant?")) deleteMutation.mutate(p.id); }}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === "scoreboard" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2"><Trophy className="w-5 h-5 text-amber-500" /> Team Scoreboard</CardTitle>
              <Button variant="outline" size="sm" onClick={() => printScoreboard("team")} className="gap-1">
                <Download className="w-4 h-4" /> Download PDF
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {scoreboard?.teamScoreboard.map((item, i) => {
                const tc = teamColors[item.team as keyof typeof teamColors];
                const maxScore = scoreboard.teamScoreboard[0]?.total || 1;
                const pct = Math.max((item.total / maxScore) * 100, 4);
                return (
                  <div key={item.team} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold flex items-center gap-2">
                        <span className="text-lg">{rankMedal(i)}</span>
                        {item.team}
                      </span>
                      <span className="text-lg font-bold" style={tc ? { color: tc.text } : {}}>{item.total}</span>
                    </div>
                    <div className="h-3 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: tc?.badge ?? "#94a3b8" }}
                      />
                    </div>
                  </div>
                );
              })}
              {(!scoreboard || scoreboard.teamScoreboard.every(t => t.total === 0)) && (
                <p className="text-center text-muted-foreground py-4">No scores recorded yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2"><Medal className="w-5 h-5 text-slate-500" /> Student Scoreboard</CardTitle>
              <Button variant="outline" size="sm" onClick={() => printScoreboard("student")} className="gap-1">
                <Download className="w-4 h-4" /> Download PDF
              </Button>
            </CardHeader>
            <CardContent>
              {scoreboard?.studentScoreboard.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No scores yet.</p>
              ) : (
                <div className="space-y-1">
                  {scoreboard?.studentScoreboard.map((s, i) => {
                    const tc = teamColors[s.team as keyof typeof teamColors];
                    return (
                      <div key={s.name} className="flex items-center gap-3 py-2 border-b last:border-0">
                        <span className="text-base w-8 text-center font-bold text-muted-foreground">{rankMedal(i)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{s.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{s.events.join(", ")}</p>
                        </div>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-bold shrink-0"
                          style={tc ? { backgroundColor: tc.badge, color: tc.text } : {}}
                        >
                          {s.team}
                        </span>
                        <span className="font-bold text-green-700 w-12 text-right">{s.total}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <div id="print-team-scoreboard" className="hidden">
        <div style={{ fontFamily: "Georgia, serif", padding: "20mm", maxWidth: "200mm" }}>
          <div style={{ textAlign: "center", marginBottom: "10mm" }}>
            <img src="/kathartsis-logo.png" alt="KathArtsis" style={{ height: "40px", margin: "0 auto 8px" }} />
            <h1 style={{ fontSize: "20pt", fontWeight: "bold", color: "#15803d" }}>Team Scoreboard</h1>
            <p style={{ fontSize: "10pt", color: "#666" }}>KathArtsis — The Ultimate Talent Fiesta</p>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12pt" }}>
            <thead>
              <tr style={{ backgroundColor: "#15803d", color: "white" }}>
                <th style={{ padding: "8px 12px", textAlign: "left" }}>Rank</th>
                <th style={{ padding: "8px 12px", textAlign: "left" }}>Team</th>
                <th style={{ padding: "8px 12px", textAlign: "right" }}>Total Score</th>
              </tr>
            </thead>
            <tbody>
              {scoreboard?.teamScoreboard.map((item, i) => (
                <tr key={item.team} style={{ backgroundColor: i % 2 === 0 ? "#f0fdf4" : "white", borderBottom: "1px solid #d1fae5" }}>
                  <td style={{ padding: "8px 12px", fontWeight: "bold" }}>{rankMedal(i)}</td>
                  <td style={{ padding: "8px 12px", fontWeight: "bold" }}>{item.team}</td>
                  <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: "bold", color: "#15803d" }}>{item.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div id="print-student-scoreboard" className="hidden">
        <div style={{ fontFamily: "Georgia, serif", padding: "20mm", maxWidth: "200mm" }}>
          <div style={{ textAlign: "center", marginBottom: "10mm" }}>
            <img src="/kathartsis-logo.png" alt="KathArtsis" style={{ height: "40px", margin: "0 auto 8px" }} />
            <h1 style={{ fontSize: "20pt", fontWeight: "bold", color: "#15803d" }}>Student Scoreboard</h1>
            <p style={{ fontSize: "10pt", color: "#666" }}>KathArtsis — The Ultimate Talent Fiesta</p>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11pt" }}>
            <thead>
              <tr style={{ backgroundColor: "#15803d", color: "white" }}>
                <th style={{ padding: "6px 10px", textAlign: "left" }}>Rank</th>
                <th style={{ padding: "6px 10px", textAlign: "left" }}>Student</th>
                <th style={{ padding: "6px 10px", textAlign: "left" }}>Team</th>
                <th style={{ padding: "6px 10px", textAlign: "left" }}>Events</th>
                <th style={{ padding: "6px 10px", textAlign: "right" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {scoreboard?.studentScoreboard.map((s, i) => (
                <tr key={s.name} style={{ backgroundColor: i % 2 === 0 ? "#f0fdf4" : "white", borderBottom: "1px solid #d1fae5" }}>
                  <td style={{ padding: "6px 10px", fontWeight: "bold" }}>{rankMedal(i)}</td>
                  <td style={{ padding: "6px 10px", fontWeight: "bold" }}>{s.name}</td>
                  <td style={{ padding: "6px 10px" }}>{s.team}</td>
                  <td style={{ padding: "6px 10px", color: "#555", fontSize: "9pt" }}>{s.events.join(", ")}</td>
                  <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: "bold", color: "#15803d" }}>{s.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
