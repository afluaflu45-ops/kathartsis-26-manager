import { useState, useRef } from "react";
import { useFinance, useCreateFinanceTx, useDeleteFinanceTx, useFinanceSummary } from "@/hooks/use-finance";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, TrendingUp, TrendingDown, Paperclip, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const INCOME_CATEGORIES = [
  "Opening Balance",
  "Donation",
  "Rent",
  "Collection",
  "Sponsors",
  "Other",
];

const EXPENSE_CATEGORIES = [
  "Starting Payment",
  "Electricity",
  "Office & Stationery",
  "Award & Presentation",
  "Repair",
  "T&A",
  "Food & Travel",
  "L&S",
  "Rent",
  "Print",
  "Other",
];

const formSchema = z.object({
  date: z.string().min(1, "Date is required"),
  type: z.enum(["income", "expense"]),
  category: z.string().min(1, "Category is required"),
  name: z.string().min(1, "Name is required"),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function Finance() {
  const { data: transactions, isLoading } = useFinance();
  const { data: summary } = useFinanceSummary();
  const createTx = useCreateFinanceTx();
  const deleteTx = useDeleteFinanceTx();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [viewingAttachment, setViewingAttachment] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "income",
      date: new Date().toISOString().split("T")[0],
      category: "",
    },
  });

  const txType = form.watch("type");
  const categoryOptions = txType === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const previewUrl = URL.createObjectURL(file);
    setAttachmentPreview(previewUrl);
  };

  const resetForm = () => {
    setIsFormOpen(false);
    setAttachmentPreview(null);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    form.reset({ type: "income", date: new Date().toISOString().split("T")[0], category: "" });
  };

  const onSubmit = async (data: FormValues) => {
    let attachmentUrl: string | null = null;

    if (selectedFile) {
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", selectedFile);
        const response = await fetch("/api/uploads", {
          method: "POST",
          body: formData,
        });
        if (!response.ok) throw new Error("Upload failed");
        const result = await response.json();
        attachmentUrl = result.url as string;
      } catch {
        alert("Image upload failed. Please try again or submit without an image.");
        setIsUploading(false);
        return;
      } finally {
        setIsUploading(false);
      }
    }

    const notes = [
      data.notes || "",
      attachmentUrl ? `__ATTACHMENT__${attachmentUrl}` : "",
    ]
      .filter(Boolean)
      .join("|");

    createTx.mutate(
      { data: { ...data, notes } },
      { onSuccess: resetForm }
    );
  };

  const getAttachment = (notes: string | undefined | null) => {
    if (!notes) return null;
    const parts = notes.split("|");
    const att = parts.find((p) => p.startsWith("__ATTACHMENT__"));
    return att ? att.replace("__ATTACHMENT__", "") : null;
  };

  const getNotes = (notes: string | undefined | null) => {
    if (!notes) return "";
    return notes.split("|").filter((p) => !p.startsWith("__ATTACHMENT__")).join(" ").trim();
  };

  const isBusy = isUploading || createTx.isPending;

  return (
    <div className="space-y-8">
      {viewingAttachment && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setViewingAttachment(null)}>
          <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <Button className="absolute -top-12 right-0" variant="secondary" onClick={() => setViewingAttachment(null)}>Close</Button>
            <img src={viewingAttachment} alt="Attachment" className="w-full rounded-lg shadow-2xl" />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Finance Ledger</h2>
          <p className="text-muted-foreground mt-2">Manage your organization's income and expenses.</p>
        </div>
        <Button onClick={() => setIsFormOpen(!isFormOpen)} className="gap-2">
          <Plus className="w-4 h-4" /> Add Transaction
        </Button>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
        <Card className="bg-primary text-primary-foreground shadow-lg border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-primary-foreground/80">Current Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{formatCurrency(summary?.balance || 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Income</CardTitle>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(summary?.totalIncome || 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Expense</CardTitle>
            <TrendingDown className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(summary?.totalExpense || 0)}</div>
          </CardContent>
        </Card>
      </div>

      {isFormOpen && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
          <Card className="border-primary/20 shadow-md">
            <CardHeader>
              <CardTitle>New Transaction</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Type</label>
                    <select
                      {...form.register("type")}
                      onChange={(e) => {
                        form.setValue("type", e.target.value as "income" | "expense");
                        form.setValue("category", "");
                      }}
                      className="w-full h-10 px-3 rounded-md border bg-background"
                    >
                      <option value="income">Income</option>
                      <option value="expense">Expense</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date</label>
                    <input
                      type="date"
                      {...form.register("date")}
                      className="w-full h-10 px-3 rounded-md border bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    <select
                      {...form.register("category")}
                      className="w-full h-10 px-3 rounded-md border bg-background"
                    >
                      <option value="">Select category...</option>
                      {categoryOptions.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    {form.formState.errors.category && (
                      <p className="text-xs text-red-500">{form.formState.errors.category.message}</p>
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
                  <div className="space-y-2 lg:col-span-2">
                    <label className="text-sm font-medium">Name / Description</label>
                    <input
                      type="text"
                      {...form.register("name")}
                      className="w-full h-10 px-3 rounded-md border bg-background"
                      placeholder="e.g. John Doe Donation or Rent Payment"
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
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Notes (Optional)</label>
                    <input
                      type="text"
                      {...form.register("notes")}
                      className="w-full h-10 px-3 rounded-md border bg-background"
                      placeholder="Optional"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Paperclip className="w-4 h-4" /> Attach Bill / Receipt Image (JPG, PNG — optional)
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/jpg"
                      onChange={handleFileChange}
                      className="w-full h-10 px-3 rounded-md border bg-background file:mr-4 file:py-1 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground cursor-pointer"
                    />
                    {attachmentPreview && (
                      <img src={attachmentPreview} alt="Preview" className="h-10 w-16 object-cover rounded border" />
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="ghost" onClick={resetForm} disabled={isBusy}>Cancel</Button>
                  <Button type="submit" disabled={isBusy}>
                    {isUploading ? "Uploading image..." : createTx.isPending ? "Saving..." : "Save Transaction"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-secondary/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-4 font-medium">Date</th>
                <th className="px-4 py-4 font-medium">Type</th>
                <th className="px-4 py-4 font-medium">Category</th>
                <th className="px-4 py-4 font-medium">Name</th>
                <th className="px-4 py-4 font-medium text-right">Amount</th>
                <th className="px-4 py-4 font-medium">Payment</th>
                <th className="px-4 py-4 font-medium">Attach</th>
                <th className="px-4 py-4 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={8} className="px-6 py-8 text-center text-muted-foreground">Loading...</td></tr>
              ) : transactions?.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-8 text-center text-muted-foreground">No transactions found. Add one above.</td></tr>
              ) : (
                transactions?.map((tx) => {
                  const attachment = getAttachment(tx.notes);
                  const noteText = getNotes(tx.notes);
                  return (
                    <tr key={tx.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">{format(new Date(tx.date), "dd MMM yyyy")}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${tx.type === "income" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {tx.type === "income" ? "INCOME" : "EXPENSE"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{tx.category}</td>
                      <td className="px-4 py-3 font-medium">
                        {tx.name}
                        {noteText && <span className="block text-xs text-muted-foreground">{noteText}</span>}
                      </td>
                      <td className={`px-4 py-3 text-right font-bold ${tx.type === "income" ? "text-green-600" : "text-red-600"}`}>
                        {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{tx.paymentMethod}</td>
                      <td className="px-4 py-3">
                        {attachment ? (
                          <Button variant="outline" size="sm" className="gap-1 h-7 text-xs" onClick={() => setViewingAttachment(attachment)}>
                            <Eye className="w-3 h-3" /> View
                          </Button>
                        ) : (
                          <span className="text-muted-foreground/40 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="icon" onClick={() => {
                          if (confirm("Delete this transaction?")) deleteTx.mutate({ id: tx.id });
                        }}>
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
    </div>
  );
}
