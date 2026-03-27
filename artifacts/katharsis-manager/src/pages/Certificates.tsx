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
    <div className="space-y-8">
      <div className="print-hide space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Award Certificates</h2>
          <p className="text-muted-foreground mt-2">Generate and print formal achievement certificates.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                    className="w-full h-10 px-3 rounded-md border bg-background"
                    placeholder="Full Name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Program / Event Name</label>
                  <input
                    type="text"
                    {...form.register("programName")}
                    className="w-full h-10 px-3 rounded-md border bg-background"
                    placeholder="e.g. Summer Art Exhibition"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Achievement / Position</label>
                  <select
                    {...form.register("position")}
                    className="w-full h-10 px-3 rounded-md border bg-background"
                  >
                    <option value="">Select position...</option>
                    <option value="1st Place">1st Place</option>
                    <option value="2nd Place">2nd Place</option>
                    <option value="3rd Place">3rd Place</option>
                    <option value="Participation">Participation</option>
                    <option value="Best Performance">Best Performance</option>
                    <option value="Special Recognition">Special Recognition</option>
                  </select>
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
                  <div key={cert.id} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:border-primary/50 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-200">
                        <Medal className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-lg font-serif">{cert.name}</p>
                        <p className="text-sm text-muted-foreground">{cert.position} • {cert.programName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="secondary" size="sm" onClick={() => setPrintingCert(cert)}>
                        <Printer className="w-4 h-4 mr-2" /> Print
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
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 print-hide">
          <div className="bg-background rounded-xl p-6 w-full max-w-[1050px]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Certificate Preview</h3>
              <div className="space-x-2">
                <Button variant="outline" onClick={() => setPrintingCert(null)}>Close</Button>
                <Button onClick={() => window.print()}><Printer className="w-4 h-4 mr-2" />Print</Button>
              </div>
            </div>
            <div className="overflow-auto bg-gray-100 p-4 rounded-lg flex justify-center">
              <div className="transform scale-[0.55] sm:scale-[0.7] md:scale-[0.85] origin-top">
                <PrintableCertificate cert={printingCert} />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="hidden print-fullscreen print-only bg-white">
        {printingCert && <PrintableCertificate cert={printingCert} />}
      </div>
    </div>
  );
}

function PrintableCertificate({ cert }: { cert: Certificate }) {
  return (
    <div
      className="bg-white text-center flex flex-col items-center justify-center relative"
      style={{
        width: "297mm",
        minHeight: "210mm",
        padding: "18mm 20mm",
        fontFamily: "Georgia, serif",
      }}
    >
      <div className="absolute inset-[8mm] pointer-events-none" style={{ border: "6px double #15803d" }}></div>
      <div className="absolute inset-[12mm] pointer-events-none" style={{ border: "2px solid #ca8a04" }}></div>

      <div className="absolute top-[14mm] left-[14mm] w-10 h-10" style={{ borderTop: "4px solid #15803d", borderLeft: "4px solid #15803d" }}></div>
      <div className="absolute top-[14mm] right-[14mm] w-10 h-10" style={{ borderTop: "4px solid #15803d", borderRight: "4px solid #15803d" }}></div>
      <div className="absolute bottom-[14mm] left-[14mm] w-10 h-10" style={{ borderBottom: "4px solid #15803d", borderLeft: "4px solid #15803d" }}></div>
      <div className="absolute bottom-[14mm] right-[14mm] w-10 h-10" style={{ borderBottom: "4px solid #15803d", borderRight: "4px solid #15803d" }}></div>

      <div className="mb-6">
        <img src="/kathartsis-logo.png" alt="KathArtsis" className="h-16 object-contain mx-auto" />
      </div>

      <div className="mb-2">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-500">KathArtsis Presents</p>
      </div>

      <h1
        className="font-black uppercase mb-6"
        style={{ fontSize: "52px", letterSpacing: "0.15em", color: "#15803d", lineHeight: 1.1 }}
      >
        Certificate
      </h1>

      <div className="w-32 mx-auto mb-2" style={{ borderTop: "2px solid #ca8a04" }}></div>
      <p className="text-base italic text-gray-500 mb-4">This is proudly presented to</p>

      <h2
        className="font-bold mb-1 pb-2 inline-block px-16"
        style={{
          fontSize: "40px",
          color: "#1a1a1a",
          borderBottom: "3px solid #15803d",
          minWidth: "400px",
        }}
      >
        {cert.name}
      </h2>

      <p className="text-base text-gray-500 italic mt-6 mb-2">In recognition of outstanding achievement, for securing</p>

      <p
        className="font-bold mb-1"
        style={{ fontSize: "28px", color: "#ca8a04" }}
      >
        {cert.position}
      </p>

      <p className="text-base text-gray-600 mb-8">
        in the program <span className="font-bold text-gray-800">{cert.programName}</span>
      </p>

      <div className="flex w-full justify-around items-end mt-4" style={{ marginTop: "auto", paddingTop: "16px" }}>
        <div className="text-center" style={{ width: "180px" }}>
          <div style={{ borderBottom: "1px solid #555", paddingBottom: "6px", marginBottom: "4px" }}>
            <span className="italic text-sm text-gray-700">{format(new Date(cert.createdAt), "MMMM do, yyyy")}</span>
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Date</p>
        </div>

        <div
          className="flex items-center justify-center font-bold text-center"
          style={{
            width: "90px",
            height: "90px",
            borderRadius: "50%",
            border: "3px solid #ca8a04",
            color: "#ca8a04",
            fontSize: "10px",
            lineHeight: 1.3,
            letterSpacing: "0.05em",
          }}
        >
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
