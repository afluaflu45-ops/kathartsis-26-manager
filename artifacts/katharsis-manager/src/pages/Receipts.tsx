import { useState } from "react";
import { useReceipts, useCreateNewReceipt } from "@/hooks/use-receipts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Receipt } from "@workspace/api-client-react";

const formSchema = z.object({
  donorName: z.string().min(1, "Donor Name is required"),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  paymentMethod: z.string().min(1, "Payment method is required"),
});

export default function Receipts() {
  const { data: receipts } = useReceipts();
  const createReceipt = useCreateNewReceipt();
  const [printingReceipt, setPrintingReceipt] = useState<Receipt | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    createReceipt.mutate({ data }, {
      onSuccess: (newReceipt) => {
        form.reset();
        setPrintingReceipt(newReceipt);
      }
    });
  };

  return (
    <div className="space-y-8">
      <div className="print-hide space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Donation Receipts</h2>
          <p className="text-muted-foreground mt-2">Generate and print official donation receipts.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-1 shadow-md">
            <CardHeader>
              <CardTitle>Generate New Receipt</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Donor Name</label>
                  <input
                    type="text"
                    {...form.register("donorName")}
                    className="w-full h-10 px-3 rounded-md border bg-background"
                    placeholder="Full Name"
                  />
                  {form.formState.errors.donorName && (
                    <p className="text-xs text-red-500">{form.formState.errors.donorName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    {...form.register("amount")}
                    className="w-full h-10 px-3 rounded-md border bg-background"
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Payment Method</label>
                  <select
                    {...form.register("paymentMethod")}
                    className="w-full h-10 px-3 rounded-md border bg-background"
                  >
                    <option value="">Select...</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                    <option value="UPI">UPI</option>
                    <option value="Online">Online</option>
                  </select>
                </div>
                <Button type="submit" className="w-full bg-green-700 hover:bg-green-800" disabled={createReceipt.isPending}>
                  {createReceipt.isPending ? "Generating..." : "Generate Receipt"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent Receipts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {receipts?.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No receipts generated yet.</p>
                ) : (
                  receipts?.map((receipt) => (
                    <div key={receipt.id} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:shadow-sm transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-semibold">{receipt.donorName}</p>
                          <p className="text-sm text-muted-foreground">
                            {receipt.receiptNumber} • {format(new Date(receipt.createdAt), "PP")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-bold text-lg text-green-700">{formatCurrency(receipt.amount)}</p>
                          <p className="text-xs text-muted-foreground">{receipt.paymentMethod}</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setPrintingReceipt(receipt)}>
                          <Printer className="w-4 h-4 mr-2" /> Print
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {printingReceipt && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 print-hide">
          <div className="bg-background rounded-xl p-6 max-w-2xl w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Print Preview</h3>
              <div className="space-x-2">
                <Button variant="outline" onClick={() => setPrintingReceipt(null)}>Close</Button>
                <Button className="bg-green-700 hover:bg-green-800" onClick={() => window.print()}>
                  <Printer className="w-4 h-4 mr-2" /> Print Now
                </Button>
              </div>
            </div>
            <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
              <PrintableReceipt receipt={printingReceipt} />
            </div>
          </div>
        </div>
      )}

      <div className="hidden print-fullscreen print-only">
        {printingReceipt && <PrintableReceipt receipt={printingReceipt} />}
      </div>
    </div>
  );
}

function PrintableReceipt({ receipt }: { receipt: Receipt }) {
  return (
    <div
      className="receipt-bw-safe w-full max-w-[800px] mx-auto bg-white relative overflow-hidden"
      style={{ fontFamily: "Georgia, serif", border: "2px solid #15803d" }}
    >
      <div
        className="receipt-header-bar h-3 w-full"
        style={{ background: "linear-gradient(to right, #15803d, #ca8a04)" }}
      ></div>

      <div className="px-12 pt-8 pb-10">
        <div className="flex flex-col items-center mb-8 border-b-2 pb-6" style={{ borderColor: "#15803d" }}>
          <img
            src="/kathartsis-logo.png"
            alt="KathArtsis Logo"
            className="h-16 object-contain mb-2"
          />
          <p className="text-gray-500 text-sm tracking-widest uppercase">Official Donation Receipt</p>
        </div>

        <div className="flex justify-between items-start mb-8">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Receipt Number</p>
            <p className="text-3xl font-bold font-mono" style={{ color: "#15803d" }}>{receipt.receiptNumber}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Date of Issue</p>
            <p className="text-lg font-medium text-gray-800">{format(new Date(receipt.createdAt), "MMMM do, yyyy")}</p>
            <p className="text-sm text-gray-600">{format(new Date(receipt.createdAt), "h:mm a")}</p>
          </div>
        </div>

        <div
          className="receipt-panel rounded-xl p-6 mb-8 border-l-4"
          style={{ backgroundColor: "#f0fdf4", borderColor: "#15803d", borderLeftWidth: "6px" }}
        >
          <div className="mb-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Received With Gratitude From</p>
            <p className="text-3xl font-bold text-gray-900">{receipt.donorName}</p>
          </div>
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Payment Method</p>
              <p className="text-xl font-bold text-gray-800 border border-gray-300 px-3 py-1 rounded">{receipt.paymentMethod}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Amount Received</p>
              <p className="receipt-amount text-5xl font-bold" style={{ color: "#15803d" }}>
                {formatCurrency(Number(receipt.amount))}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-end mt-10 flex-wrap gap-6">
          <p className="text-sm text-gray-600 italic max-w-xs border-l-2 border-gray-300 pl-3">
            We gratefully acknowledge your generous contribution to KathArtsis — The Ultimate Talent Fiesta.
          </p>
          <div className="text-center w-48">
            <div className="border-b-2 border-gray-400 pb-2 mb-2 h-10"></div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-600">Authorized Signature</p>
          </div>
        </div>
      </div>

      <div
        className="receipt-footer-bar h-1.5 w-full"
        style={{ background: "linear-gradient(to right, #15803d, #ca8a04)" }}
      ></div>
    </div>
  );
}
