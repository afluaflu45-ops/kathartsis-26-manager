import { useState } from "react";
import { useCertificates, useCreateNewCertificate, useDeleteExistingCertificate } from "@/hooks/use-certificates";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer, Trash2, Medal } from "lucide-react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Certificate } from "@workspace/api-client-react";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  programName: z.string().min(1, "Program Name is required"),
  position: z.string().min(1, "Position/Achievement is required"),
});

function buildCertHTML(cert: Certificate): string {
  const logoUrl = `${window.location.origin}/kathartsis-logo.png`;
  const dateStr = format(new Date(cert.createdAt), "MMMM do, yyyy");

  return `
    <html>
      <head>
        <meta charset="UTF-8" />
        <style>
          @page { size: A4 landscape; margin: 10mm; }
          * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body { margin: 0; padding: 0; font-family: Georgia, serif; background: white; }
          .cert {
            width: 277mm; min-height: 190mm; padding: 16mm 18mm;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            position: relative; background: white; text-align: center; page-break-inside: avoid;
          }
          .border-outer { position: absolute; inset: 6mm; border: 6px double #15803d; pointer-events: none; }
          .border-inner { position: absolute; inset: 10mm; border: 2px solid #ca8a04; pointer-events: none; }
          .corner { position: absolute; width: 36px; height: 36px; }
          .corner-tl { top: 12mm; left: 12mm; border-top: 4px solid #15803d; border-left: 4px solid #15803d; }
          .corner-tr { top: 12mm; right: 12mm; border-top: 4px solid #15803d; border-right: 4px solid #15803d; }
          .corner-bl { bottom: 12mm; left: 12mm; border-bottom: 4px solid #15803d; border-left: 4px solid #15803d; }
          .corner-br { bottom: 12mm; right: 12mm; border-bottom: 4px solid #15803d; border-right: 4px solid #15803d; }
          .logo { height: 56px; object-fit: contain; margin-bottom: 12px; }
          .sub { font-size: 11pt; font-weight: 600; letter-spacing: 0.3em; text-transform: uppercase; color: #666; margin-bottom: 6px; }
          .title { font-size: 42pt; font-weight: 900; letter-spacing: 0.15em; color: #15803d; line-height: 1.05; margin-bottom: 6px; text-transform: uppercase; }
          .divider { width: 120px; border-top: 2px solid #ca8a04; margin: 0 auto 6px; }
          .of { font-size: 10pt; color: #666; font-style: italic; margin-bottom: 10px; }
          .recipient { font-size: 32pt; font-weight: bold; color: #1a1a1a; border-bottom: 3px solid #15803d; padding-bottom: 4px; min-width: 320px; display: inline-block; margin-bottom: 8px; }
          .recognition { font-size: 10pt; color: #555; font-style: italic; margin-bottom: 4px; }
          .position { font-size: 22pt; font-weight: bold; color: #ca8a04; margin-bottom: 2px; }
          .program { font-size: 10pt; color: #555; margin-bottom: 16px; }
          .program b { color: #1a1a1a; font-weight: bold; }
          .footer { display: flex; width: 100%; justify-content: space-around; align-items: flex-end; padding-top: 12px; margin-top: auto; }
          .sig-block { width: 160px; text-align: center; }
          .sig-line { border-bottom: 1px solid #555; padding-bottom: 4px; margin-bottom: 4px; height: 24px; font-size: 9pt; font-style: italic; color: #444; display: flex; align-items: flex-end; justify-content: center; }
          .sig-label { font-size: 8pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; color: #666; }
          .seal { width: 80px; height: 80px; border-radius: 50%; border: 3px solid #ca8a04; color: #ca8a04; font-size: 8pt; font-weight: bold; display: flex; align-items: center; justify-content: center; text-align: center; letter-spacing: 0.05em; line-height: 1.3; }
        </style>
      </head>
      <body>
        <div class="cert">
          <div class="border-outer"></div>
          <div class="border-inner"></div>
          <div class="corner corner-tl"></div>
          <div class="corner corner-tr"></div>
          <div class="corner corner-bl"></div>
          <div class="corner corner-br"></div>

          <img src="${logoUrl}" alt="KathArtsis" class="logo" />
          <p class="sub">KathArtsis Presents</p>
          <h1 class="title">Certificate</h1>
          <div class="divider"></div>
          <p class="of">This is proudly presented to</p>
          <div class="recipient">${cert.name}</div>
          <p class="recognition">In recognition of outstanding achievement, for securing</p>
          <p class="position">${cert.position}</p>
          <p class="program">in the program <b>${cert.programName}</b></p>

          <div class="footer">
            <div class="sig-block">
              <div class="sig-line">${dateStr}</div>
              <p class="sig-label">Date</p>
            </div>
            <div class="seal">OFFICIAL<br/>SEAL</div>
            <div class="sig-block">
              <div class="sig-line"></div>
              <p class="sig-label">KathArtsis Director</p>
            </div>
          </div>
        </div>
      </body>
    </html>`;
}

function printCertificate(cert: Certificate) {
  const html = buildCertHTML(cert);
  const win = window.open("", "_blank", "width=1050,height=750");
  if (!win) { alert("Please allow popups for this site."); return; }
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); win.close(); }, 600);
}

export default function Certificates() {
  const { data: certificates } = useCertificates();
  const createCert = useCreateNewCertificate();
  const deleteCert = useDeleteExistingCertificate();
  const [printingCert, setPrintingCert] = useState<Certificate | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    createCert.mutate({ data }, {
      onSuccess: (newCert) => {
        form.reset({ name: "", programName: data.programName, position: data.position });
        setPrintingCert(newCert);
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="print-hide space-y-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Award Certificates</h2>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">Generate and print formal achievement certificates.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1 shadow-md h-fit">
            <CardHeader>
              <CardTitle>Issue Certificate</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Recipient Name</label>
                  <input
                    type="text"
                    {...form.register("name")}
                    className="w-full h-10 px-3 rounded-md border bg-background text-sm"
                    placeholder="Full Name"
                  />
                  {form.formState.errors.name && (
                    <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Program / Event Name</label>
                  <input
                    type="text"
                    {...form.register("programName")}
                    className="w-full h-10 px-3 rounded-md border bg-background text-sm"
                    placeholder="e.g. Summer Art Exhibition"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Achievement / Position</label>
                  <select
                    {...form.register("position")}
                    className="w-full h-10 px-3 rounded-md border bg-background text-sm"
                  >
                    <option value="">Select position...</option>
                    <option value="1st Place">1st Place</option>
                    <option value="2nd Place">2nd Place</option>
                    <option value="3rd Place">3rd Place</option>
                    <option value="Participation">Participation</option>
                    <option value="Best Performance">Best Performance</option>
                    <option value="Special Recognition">Special Recognition</option>
                  </select>
                  {form.formState.errors.position && (
                    <p className="text-xs text-red-500">{form.formState.errors.position.message}</p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={createCert.isPending}>
                  {createCert.isPending ? "Generating..." : "Generate Certificate"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Certificate Registry</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {certificates?.map((cert) => (
                  <div key={cert.id} className="flex items-center justify-between p-3 md:p-4 rounded-lg border bg-card hover:border-primary/50 transition-colors group flex-wrap gap-3">
                    <div className="flex items-center gap-3 md:gap-4 min-w-0">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-200 shrink-0">
                        <Medal className="w-5 h-5 md:w-6 md:h-6" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-base md:text-lg font-serif truncate">{cert.name}</p>
                        <p className="text-xs md:text-sm text-muted-foreground truncate">{cert.position} • {cert.programName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button variant="secondary" size="sm" onClick={() => { setPrintingCert(cert); printCertificate(cert); }}>
                        <Printer className="w-4 h-4 mr-1 md:mr-2" /> Print
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => {
                        if (confirm("Delete this certificate record?")) deleteCert.mutate({ id: cert.id });
                      }}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
                {certificates?.length === 0 && (
                  <div className="py-12 text-center text-muted-foreground">No certificates issued yet.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {printingCert && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 md:p-4 print-hide">
          <div className="bg-background rounded-xl p-4 md:p-6 w-full max-w-[1050px]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg md:text-xl font-bold">Certificate Preview</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPrintingCert(null)}>Close</Button>
                <Button size="sm" onClick={() => printCertificate(printingCert)}>
                  <Printer className="w-4 h-4 mr-1" /> Print A4 Landscape
                </Button>
              </div>
            </div>
            <div className="overflow-auto bg-gray-100 p-4 rounded-lg flex justify-center">
              <div className="transform scale-[0.45] sm:scale-[0.6] md:scale-[0.75] origin-top">
                <PrintableCertificate cert={printingCert} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PrintableCertificate({ cert }: { cert: Certificate }) {
  return (
    <div
      className="bg-white text-center flex flex-col items-center justify-center relative"
      style={{ width: "297mm", minHeight: "210mm", padding: "18mm 20mm", fontFamily: "Georgia, serif" }}
    >
      <div className="absolute inset-[8mm] pointer-events-none" style={{ border: "6px double #15803d" }}></div>
      <div className="absolute inset-[12mm] pointer-events-none" style={{ border: "2px solid #ca8a04" }}></div>
      <div className="absolute top-[14mm] left-[14mm] w-10 h-10" style={{ borderTop: "4px solid #15803d", borderLeft: "4px solid #15803d" }}></div>
      <div className="absolute top-[14mm] right-[14mm] w-10 h-10" style={{ borderTop: "4px solid #15803d", borderRight: "4px solid #15803d" }}></div>
      <div className="absolute bottom-[14mm] left-[14mm] w-10 h-10" style={{ borderBottom: "4px solid #15803d", borderLeft: "4px solid #15803d" }}></div>
      <div className="absolute bottom-[14mm] right-[14mm] w-10 h-10" style={{ borderBottom: "4px solid #15803d", borderRight: "4px solid #15803d" }}></div>
      <div className="mb-5">
        <img src="/kathartsis-logo.png" alt="KathArtsis" className="h-16 object-contain mx-auto" />
      </div>
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-500">KathArtsis Presents</p>
      <h1 className="font-black uppercase mb-5" style={{ fontSize: "52px", letterSpacing: "0.15em", color: "#15803d", lineHeight: 1.1 }}>Certificate</h1>
      <div className="w-32 mx-auto mb-2" style={{ borderTop: "2px solid #ca8a04" }}></div>
      <p className="text-base italic text-gray-500 mb-4">This is proudly presented to</p>
      <h2 className="font-bold mb-1 pb-2 inline-block px-16" style={{ fontSize: "40px", color: "#1a1a1a", borderBottom: "3px solid #15803d", minWidth: "400px" }}>
        {cert.name}
      </h2>
      <p className="text-base text-gray-500 italic mt-5 mb-2">In recognition of outstanding achievement, for securing</p>
      <p className="font-bold mb-1" style={{ fontSize: "28px", color: "#ca8a04" }}>{cert.position}</p>
      <p className="text-base text-gray-600 mb-6">in the program <span className="font-bold text-gray-800">{cert.programName}</span></p>
      <div className="flex w-full justify-around items-end mt-auto pt-4">
        <div className="text-center" style={{ width: "180px" }}>
          <div style={{ borderBottom: "1px solid #555", paddingBottom: "6px", marginBottom: "4px" }}>
            <span className="italic text-sm text-gray-700">{format(new Date(cert.createdAt), "MMMM do, yyyy")}</span>
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Date</p>
        </div>
        <div className="flex items-center justify-center font-bold text-center" style={{ width: "90px", height: "90px", borderRadius: "50%", border: "3px solid #ca8a04", color: "#ca8a04", fontSize: "10px", lineHeight: 1.3, letterSpacing: "0.05em" }}>
          OFFICIAL<br />SEAL
        </div>
        <div className="text-center" style={{ width: "180px" }}>
          <div style={{ borderBottom: "1px solid #555", paddingBottom: "6px", marginBottom: "4px", height: "28px" }}></div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">KathArtsis Director</p>
        </div>
      </div>
    </div>
  );
}
