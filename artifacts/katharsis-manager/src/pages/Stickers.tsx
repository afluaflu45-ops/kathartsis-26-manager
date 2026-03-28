import { useState } from "react";
import { useStickers, useCreateNewSticker, useDeleteExistingSticker } from "@/hooks/use-stickers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer, Trash2, Download } from "lucide-react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Sticker } from "@workspace/api-client-react";

const formSchema = z.object({
  programName: z.string().min(1, "Program Name is required"),
  position: z.enum(["1st", "2nd", "3rd"]),
  name: z.string().min(1, "Recipient Name is required"),
});

export default function Stickers() {
  const { data: stickers } = useStickers();
  const createSticker = useCreateNewSticker();
  const deleteSticker = useDeleteExistingSticker();
  const [printingSticker, setPrintingSticker] = useState<Sticker | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { position: "1st" },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    createSticker.mutate({ data }, {
      onSuccess: (newSticker) => {
        form.reset({ programName: data.programName, position: "1st", name: "" });
        setPrintingSticker(newSticker);
      },
    });
  };

  const printAllA3 = () => {
    if (!stickers || stickers.length === 0) {
      alert("No stickers to print. Please create some first.");
      return;
    }
    const printContent = stickers.map(s => buildStickerHTML(s)).join("");
    const html = `
      <html>
        <head>
          <style>
            @page { size: A3; margin: 10mm; }
            * { box-sizing: border-box; print-color-adjust: exact !important; -webkit-print-color-adjust: exact !important; }
            body { margin: 0; padding: 0; }
            .grid {
              display: grid;
              grid-template-columns: repeat(auto-fill, 6cm);
              gap: 4mm;
              width: 100%;
            }
          </style>
        </head>
        <body><div class="grid">${printContent}</div></body>
      </html>`;
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) { alert("Please allow popups for this site."); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 600);
  };

  const printSingle = () => {
    if (!printingSticker) return;
    const html = `
      <html>
        <head>
          <style>
            @page { size: A3; margin: 10mm; }
            * { box-sizing: border-box; print-color-adjust: exact !important; -webkit-print-color-adjust: exact !important; }
            body { margin: 0; padding: 0; }
            .grid {
              display: grid;
              grid-template-columns: repeat(auto-fill, 6cm);
              gap: 4mm;
            }
          </style>
        </head>
        <body><div class="grid">${Array.from({ length: 20 }).map(() => buildStickerHTML(printingSticker)).join("")}</div></body>
      </html>`;
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) { alert("Please allow popups for this site."); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 600);
  };

  return (
    <div className="space-y-8">
      <div className="print-hide space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Award Stickers</h2>
            <p className="text-muted-foreground mt-2">Generate position badges. Each sticker: 6cm × 2.5cm. Prints on A3.</p>
          </div>
          {(stickers?.length ?? 0) > 0 && (
            <Button onClick={printAllA3} variant="default" className="gap-2">
              <Download className="w-4 h-4" /> Download A3 Stickers (PDF)
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-1 shadow-md">
            <CardHeader>
              <CardTitle>Create Sticker</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Program Name</label>
                  <input
                    type="text"
                    {...form.register("programName")}
                    className="w-full h-10 px-3 rounded-md border bg-background"
                    placeholder="e.g. Annual Art Contest"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Position</label>
                  <select
                    {...form.register("position")}
                    className="w-full h-10 px-3 rounded-md border bg-background"
                  >
                    <option value="1st">1st Place</option>
                    <option value="2nd">2nd Place</option>
                    <option value="3rd">3rd Place</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Recipient Name</label>
                  <input
                    type="text"
                    {...form.register("name")}
                    className="w-full h-10 px-3 rounded-md border bg-background"
                    placeholder="Participant Name"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={createSticker.isPending}>
                  {createSticker.isPending ? "Generating..." : "Generate Sticker"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Generated Stickers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {stickers?.map((sticker) => (
                  <div
                    key={sticker.id}
                    className={`relative p-4 rounded-xl border hover:shadow-md transition-shadow group overflow-hidden ${
                      sticker.position === "1st" ? "border-amber-300 bg-amber-50" :
                      sticker.position === "2nd" ? "border-slate-300 bg-slate-50" :
                      "border-orange-300 bg-orange-50"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold ${
                        sticker.position === "1st" ? "bg-amber-200 text-amber-800" :
                        sticker.position === "2nd" ? "bg-slate-200 text-slate-700" :
                        "bg-orange-200 text-orange-900"
                      }`}>
                        {sticker.position} Place
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Print single on A3" onClick={() => setPrintingSticker(sticker)}>
                          <Printer className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                          if (confirm("Delete sticker?")) deleteSticker.mutate({ id: sticker.id });
                        }}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <p className="font-bold text-lg truncate">{sticker.name}</p>
                    <p className="text-sm text-muted-foreground truncate">{sticker.programName}</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">{format(new Date(sticker.createdAt), "PP")}</p>
                  </div>
                ))}
                {stickers?.length === 0 && (
                  <div className="col-span-full py-12 text-center text-muted-foreground">No stickers created yet.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {printingSticker && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 print-hide">
          <div className="bg-background rounded-xl p-6 max-w-sm w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Preview (6cm × 2.5cm)</h3>
              <Button variant="ghost" size="sm" onClick={() => setPrintingSticker(null)}>✕</Button>
            </div>
            <div className="flex justify-center bg-gray-100 p-6 rounded-lg mb-4">
              <PrintableSticker sticker={printingSticker} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setPrintingSticker(null)}>Close</Button>
              <Button onClick={printSingle} className="gap-2">
                <Download className="w-4 h-4" /> Print A3 Sheet (PDF)
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function buildStickerHTML(sticker: Sticker): string {
  const isGold = sticker.position === "1st";
  const isSilver = sticker.position === "2nd";

  const bgGradient = isGold
    ? "linear-gradient(135deg, #fbbf24, #f59e0b, #d97706)"
    : isSilver
    ? "linear-gradient(135deg, #e2e8f0, #cbd5e1, #94a3b8)"
    : "linear-gradient(135deg, #fb923c, #f97316, #ea580c)";

  const borderColor = isGold ? "#b45309" : isSilver ? "#475569" : "#9a3412";
  const textColor = isGold ? "#78350f" : isSilver ? "#1e293b" : "#431407";

  const logoUrl = `${window.location.origin}/kathartsis-logo.png`;

  return `
    <div style="
      width: 6cm; height: 2.5cm;
      background: ${bgGradient};
      border: 3px solid ${borderColor};
      border-radius: 6px;
      display: flex; flex-direction: row; align-items: center;
      overflow: hidden; box-sizing: border-box; flex-shrink: 0;
    ">
      <div style="
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        width: 1.8cm; min-width: 1.8cm; height: 100%;
        border-right: 2px solid ${borderColor};
        background: rgba(0,0,0,0.08); padding: 3px; gap: 2px;
      ">
        <img src="${logoUrl}" alt="K" style="height: 16px; object-fit: contain;" />
        <span style="font-size: 14px; font-weight: 900; color: ${textColor}; font-family: Georgia, serif; line-height: 1;">
          ${sticker.position === "1st" ? "🥇" : sticker.position === "2nd" ? "🥈" : "🥉"}
        </span>
        <span style="font-size: 9px; font-weight: 900; color: ${textColor}; font-family: Georgia, serif; line-height: 1;">${sticker.position}</span>
      </div>
      <div style="
        flex: 1; display: flex; flex-direction: column; justify-content: center;
        padding: 4px 8px; color: ${textColor}; overflow: hidden;
      ">
        <div style="font-size: 7px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; opacity: 0.75; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          ${sticker.position} Place — ${sticker.programName}
        </div>
        <div style="font-size: 13px; font-weight: 900; font-family: Georgia, serif; line-height: 1.1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          ${sticker.name}
        </div>
        <div style="font-size: 6px; opacity: 0.65; margin-top: 2px; font-weight: 600; letter-spacing: 0.05em;">
          KathArtsis — The Ultimate Talent Fiesta
        </div>
      </div>
    </div>`;
}

function PrintableSticker({ sticker }: { sticker: Sticker }) {
  const isGold = sticker.position === "1st";
  const isSilver = sticker.position === "2nd";

  const bgGradient = isGold
    ? "linear-gradient(135deg, #fbbf24, #f59e0b, #d97706)"
    : isSilver
    ? "linear-gradient(135deg, #e2e8f0, #cbd5e1, #94a3b8)"
    : "linear-gradient(135deg, #fb923c, #f97316, #ea580c)";

  const borderColor = isGold ? "#b45309" : isSilver ? "#475569" : "#9a3412";
  const textColor = isGold ? "#78350f" : isSilver ? "#1e293b" : "#431407";

  return (
    <div
      style={{
        width: "6cm",
        height: "2.5cm",
        background: bgGradient,
        border: `3px solid ${borderColor}`,
        borderRadius: "6px",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        overflow: "hidden",
        boxSizing: "border-box",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "1.8cm",
          minWidth: "1.8cm",
          height: "100%",
          borderRight: `2px solid ${borderColor}`,
          background: "rgba(0,0,0,0.08)",
          padding: "3px",
          gap: "2px",
        }}
      >
        <img src="/kathartsis-logo.png" alt="KathArtsis" style={{ height: "16px", objectFit: "contain", opacity: 0.9 }} />
        <span style={{ fontSize: "14px" }}>
          {sticker.position === "1st" ? "🥇" : sticker.position === "2nd" ? "🥈" : "🥉"}
        </span>
        <span style={{ fontSize: "9px", fontWeight: 900, color: textColor, fontFamily: "Georgia, serif", lineHeight: 1 }}>
          {sticker.position}
        </span>
      </div>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "4px 8px",
          color: textColor,
          overflow: "hidden",
        }}
      >
        <div style={{ fontSize: "7px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.75, marginBottom: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {sticker.position} Place — {sticker.programName}
        </div>
        <div style={{ fontSize: "13px", fontWeight: 900, fontFamily: "Georgia, serif", lineHeight: 1.1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {sticker.name}
        </div>
        <div style={{ fontSize: "6px", opacity: 0.65, marginTop: "2px", fontWeight: 600, letterSpacing: "0.05em" }}>
          KathArtsis — The Ultimate Talent Fiesta
        </div>
      </div>
    </div>
  );
}
