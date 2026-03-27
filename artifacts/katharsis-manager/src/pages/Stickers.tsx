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
    defaultValues: { position: "1st" }
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    createSticker.mutate({ data }, {
      onSuccess: (newSticker) => {
        form.reset({ programName: data.programName, position: "1st", name: "" }); // keep program name
        setPrintingSticker(newSticker);
      }
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
                  <div key={sticker.id} className="relative p-4 rounded-xl border bg-card hover:shadow-md transition-shadow group overflow-hidden">
                    <div className={`absolute top-0 right-0 w-16 h-16 -mr-8 -mt-8 rounded-full ${
                      sticker.position === '1st' ? 'bg-amber-400/20' : 
                      sticker.position === '2nd' ? 'bg-slate-400/20' : 'bg-orange-600/20'
                    }`} />
                    
                    <div className="flex justify-between items-start mb-2 relative z-10">
                      <div className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold ${
                        sticker.position === '1st' ? 'bg-amber-100 text-amber-700' : 
                        sticker.position === '2nd' ? 'bg-slate-100 text-slate-700' : 'bg-orange-100 text-orange-800'
                      }`}>
                        <Trophy className="w-3 h-3 mr-1" />
                        {sticker.position} Place
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPrintingSticker(sticker)}>
                          <Printer className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                          if(confirm('Delete sticker?')) deleteSticker.mutate({ id: sticker.id });
                        }}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="relative z-10">
                      <p className="font-bold text-lg truncate">{sticker.name}</p>
                      <p className="text-sm text-muted-foreground truncate">{sticker.programName}</p>
                      <p className="text-xs text-muted-foreground/60 mt-2">{format(new Date(sticker.createdAt), 'PP')}</p>
                    </div>
                  </div>
                ))}
                {stickers?.length === 0 && (
                  <div className="col-span-full py-12 text-center text-muted-foreground">
                    No stickers created.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* PRINT PREVIEW OVERLAY */}
      {printingSticker && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 print-hide">
          <div className="bg-background rounded-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Print Sticker</h3>
              <div className="space-x-2">
                <Button variant="outline" onClick={() => setPrintingSticker(null)}>Close</Button>
                <Button onClick={() => window.print()}><Printer className="w-4 h-4 mr-2"/> Print</Button>
              </div>
            </div>
            <div className="flex justify-center bg-gray-100 p-8 rounded-lg">
              <PrintableSticker sticker={printingSticker} />
            </div>
          </div>
        </div>
      )}

      {/* ACTUAL PRINTABLE DOM */}
      <div className="hidden print-fullscreen print-only">
        {printingSticker && <PrintableSticker sticker={printingSticker} />}
      </div>
    </div>
  );
}

function PrintableSticker({ sticker }: { sticker: Sticker }) {
  const isGold = sticker.position === '1st';
  const isSilver = sticker.position === '2nd';
  const colors = isGold 
    ? 'from-amber-300 via-amber-400 to-amber-500 border-amber-600 text-amber-900' 
    : isSilver 
      ? 'from-slate-200 via-slate-300 to-slate-400 border-slate-500 text-slate-800'
      : 'from-orange-300 via-orange-400 to-orange-500 border-orange-600 text-orange-950';

  return (
    <div className={`w-[80mm] h-[80mm] rounded-full flex flex-col items-center justify-center text-center p-6 border-[6px] bg-gradient-to-br shadow-2xl ${colors} relative overflow-hidden`}>
      {/* Decorative inner rings */}
      <div className="absolute inset-2 border-2 border-white/40 rounded-full border-dashed pointer-events-none"></div>
      <div className="absolute inset-4 border border-white/30 rounded-full pointer-events-none"></div>
      
      <Trophy className="w-12 h-12 text-white/90 mb-2 drop-shadow-md" />
      <h2 className="text-3xl font-black font-serif uppercase tracking-widest drop-shadow-sm mb-1">
        {sticker.position}
      </h2>
      <div className="w-12 h-0.5 bg-current opacity-30 my-2 rounded-full"></div>
      <p className="text-[10px] font-bold uppercase tracking-wider opacity-80 mb-1 leading-tight px-4 line-clamp-2">
        {sticker.programName}
      </p>
      <p className="text-xl font-bold font-serif leading-tight drop-shadow-sm max-w-[90%] truncate">
        {sticker.name}
      </p>
      
      {/* Sparkles */}
      {isGold && (
        <>
          <div className="absolute top-8 left-12 w-2 h-2 bg-white rounded-full animate-pulse blur-[1px]"></div>
          <div className="absolute bottom-16 right-10 w-3 h-3 bg-white rounded-full animate-pulse blur-[2px] delay-150"></div>
        </>
      )}
    </div>
  );
}
