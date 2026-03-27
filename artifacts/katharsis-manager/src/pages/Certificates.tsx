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
  position: z.string().min(1, "Position/Achievement description is required"),
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
      }
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
                  <input
                    type="text"
                    {...form.register("position")}
                    className="w-full h-10 px-3 rounded-md border bg-background"
                    placeholder="e.g. First Place in Oil Painting"
                  />
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
                      <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
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
                        if(confirm("Delete this certificate record?")) deleteCert.mutate({ id: cert.id });
                      }}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
                {certificates?.length === 0 && (
                  <div className="py-12 text-center text-muted-foreground">
                    No certificates issued yet.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* PRINT PREVIEW OVERLAY */}
      {printingCert && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 print-hide">
          <div className="bg-background rounded-xl p-6 w-full max-w-[1000px] h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
              <h3 className="text-xl font-bold">Print Certificate</h3>
              <div className="space-x-2">
                <Button variant="outline" onClick={() => setPrintingCert(null)}>Close</Button>
                <Button onClick={() => window.print()}><Printer className="w-4 h-4 mr-2"/> Print</Button>
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-gray-100 p-4 rounded-lg flex items-center justify-center">
              {/* Scale down for preview if needed, but actual print will use real dimensions */}
              <div className="transform scale-[0.6] sm:scale-[0.8] md:scale-100 origin-center">
                <PrintableCertificate cert={printingCert} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ACTUAL PRINTABLE DOM */}
      <div className="hidden print-fullscreen print-only bg-white">
        {printingCert && <PrintableCertificate cert={printingCert} />}
      </div>
    </div>
  );
}

function PrintableCertificate({ cert }: { cert: Certificate }) {
  return (
    <div className="w-[297mm] h-[210mm] bg-white text-center flex flex-col items-center justify-center relative p-[15mm] shadow-2xl">
      {/* Decorative Borders */}
      <div className="absolute inset-[10mm] border-[8px] border-double border-primary/20 pointer-events-none"></div>
      <div className="absolute inset-[14mm] border-2 border-primary pointer-events-none"></div>
      
      {/* Corner decorations */}
      <div className="absolute top-[14mm] left-[14mm] w-8 h-8 border-t-4 border-l-4 border-primary"></div>
      <div className="absolute top-[14mm] right-[14mm] w-8 h-8 border-t-4 border-r-4 border-primary"></div>
      <div className="absolute bottom-[14mm] left-[14mm] w-8 h-8 border-b-4 border-l-4 border-primary"></div>
      <div className="absolute bottom-[14mm] right-[14mm] w-8 h-8 border-b-4 border-r-4 border-primary"></div>

      <div className="w-20 h-20 mb-8 bg-primary text-white rounded-full flex items-center justify-center text-4xl font-serif font-bold mx-auto">
        K
      </div>

      <h1 className="text-6xl font-serif font-bold text-primary tracking-widest uppercase mb-4">
        Certificate of Achievement
      </h1>
      
      <p className="text-xl text-gray-500 italic mt-8 mb-4 font-serif">
        This is proudly presented to
      </p>

      <h2 className="text-5xl font-serif font-bold text-gray-900 border-b-2 border-gray-300 pb-2 mb-6 px-16 inline-block min-w-[500px]">
        {cert.name}
      </h2>

      <p className="text-xl text-gray-600 font-serif max-w-3xl leading-relaxed mb-16">
        In recognition of outstanding performance and dedication, achieving <br/>
        <strong className="text-2xl text-primary mt-2 block">{cert.position}</strong> <br/>
        in the <strong className="text-gray-900">{cert.programName}</strong>.
      </p>

      <div className="flex w-full justify-around items-end px-20 mt-auto">
        <div className="text-center w-64">
          <div className="border-b border-gray-400 pb-2 mb-2">
            <span className="font-serif italic text-lg">{format(new Date(cert.createdAt), 'MMMM do, yyyy')}</span>
          </div>
          <p className="text-sm font-bold uppercase tracking-wider text-gray-500">Date</p>
        </div>
        
        <div className="w-32 h-32 rounded-full border-4 border-amber-500 flex items-center justify-center opacity-80 transform rotate-12">
          <div className="text-amber-600 font-serif font-bold text-center leading-none">
            OFFICIAL<br/><span className="text-sm">SEAL</span>
          </div>
        </div>

        <div className="text-center w-64">
          <div className="border-b border-gray-400 pb-2 mb-2 h-8">
            {/* Signature space */}
          </div>
          <p className="text-sm font-bold uppercase tracking-wider text-gray-500">KathArtsis Director</p>
        </div>
      </div>
    </div>
  );
}
