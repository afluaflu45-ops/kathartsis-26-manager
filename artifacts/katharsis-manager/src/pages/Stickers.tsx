import { useState } from "react";
import { useStickers, useCreateNewSticker, useDeleteExistingSticker } from "@/hooks/use-stickers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer, Trash2, Trophy } from "lucide-react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Sticker, CreateStickerBodyPosition } from "@workspace/api-client-react";

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

  return (
    <div className="space-y-8">
      <div className="print-hide space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Award Stickers</h2>
          <p className="text-muted-foreground mt-2">Generate position badges and stickers for programs.</p>
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
                        <Trophy className="w-3 h-3 mr-1" />
                        {sticker.position} Place
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPrintingSticker(sticker)}>
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
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Print Sticker</h3>
              <div className="space-x-2">
                <Button variant="outline" onClick={() => setPrintingSticker(null)}>Close</Button>
                <Button onClick={() => window.print()}><Printer className="w-4 h-4 mr-2" />Print</Button>
              </div>
            </div>
            <div className="flex justify-center bg-gray-100 p-8 rounded-lg">
              <PrintableSticker sticker={printingSticker} />
            </div>
          </div>
        </div>
      )}

      <div className="hidden print-fullscreen print-only">
        {printingSticker && <PrintableSticker sticker={printingSticker} />}
      </div>
    </div>
  );
}

function PrintableSticker({ sticker }: { sticker: Sticker }) {
  const isGold = sticker.position === "1st";
  const isSilver = sticker.position === "2nd";

  const gradientColors = isGold
    ? "from-amber-300 via-yellow-400 to-amber-500"
    : isSilver
    ? "from-slate-200 via-slate-300 to-slate-400"
    : "from-orange-300 via-orange-400 to-orange-500";

  const borderColor = isGold ? "#b45309" : isSilver ? "#64748b" : "#9a3412";
  const textColor = isGold ? "#78350f" : isSilver ? "#1e293b" : "#431407";

  return (
    <div
      className={`w-[85mm] rounded-2xl bg-gradient-to-br ${gradientColors} shadow-2xl overflow-hidden`}
      style={{ border: `4px solid ${borderColor}` }}
    >
      <div className="flex flex-col items-center px-6 pt-5 pb-2">
        <img src="/kathartsis-logo.png" alt="KathArtsis" className="h-8 object-contain mb-3 opacity-90" />
        <div className="w-full border-t border-current opacity-20 mb-3"></div>
      </div>

      <div className="flex flex-col items-center px-6 pb-6 text-center" style={{ color: textColor }}>
        <div className="mb-2">
          <Trophy
            className="w-14 h-14 mx-auto drop-shadow-md mb-1"
            style={{ color: isGold ? "#92400e" : isSilver ? "#334155" : "#7c2d12" }}
          />
        </div>
        <div
          className="text-5xl font-black tracking-tight leading-none mb-1"
          style={{ fontFamily: "Georgia, serif" }}
        >
          {sticker.position}
        </div>
        <div className="text-base font-bold uppercase tracking-widest opacity-70 mb-3">PLACE</div>

        <div className="w-12 border-t-2 border-current opacity-30 mb-3"></div>

        <p
          className="text-xs font-bold uppercase tracking-widest opacity-75 mb-2 leading-tight px-2"
          style={{ maxWidth: "100%" }}
        >
          {sticker.programName}
        </p>
        <p
          className="text-2xl font-bold leading-tight"
          style={{ fontFamily: "Georgia, serif" }}
        >
          {sticker.name}
        </p>
      </div>
    </div>
  );
}
