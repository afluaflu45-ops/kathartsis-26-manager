import { useFinance } from "@/hooks/use-finance";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { useMemo } from "react";

const EXPENSE_ORDER = [
  "Starting Payment",
  "Electricity",
  "Office & Stationery",
  "Award & Presentation",
  "Repair",
  "Food & Travel",
  "L&S",
  "T&A",
  "Rent",
  "Print",
  "Other",
];

const INCOME_ORDER = [
  "Opening Balance",
  "Electricity",
  "Print",
  "Donation",
  "Rent",
  "Sponsors",
  "Other",
];

function sortByOrder(items: { category: string }[], order: string[]) {
  return [...items].sort((a, b) => {
    const ai = order.indexOf(a.category);
    const bi = order.indexOf(b.category);
    const aIdx = ai === -1 ? order.length : ai;
    const bIdx = bi === -1 ? order.length : bi;
    return aIdx - bIdx;
  });
}

export default function AccountStatement() {
  const { data: transactions, isLoading } = useFinance();

  const { incomes, expenses, totalIncome, totalExpense, balanceTotal } = useMemo(() => {
    const incs = sortByOrder(
      (transactions || []).filter((t) => t.type === "income"),
      INCOME_ORDER
    );
    const exps = sortByOrder(
      (transactions || []).filter((t) => t.type === "expense"),
      EXPENSE_ORDER
    );
    const tInc = incs.reduce((sum, t) => sum + t.amount, 0);
    const tExp = exps.reduce((sum, t) => sum + t.amount, 0);
    return {
      incomes: incs,
      expenses: exps,
      totalIncome: tInc,
      totalExpense: tExp,
      balanceTotal: Math.max(tInc, tExp),
    };
  }, [transactions]);

  const surplus = totalIncome > totalExpense ? totalIncome - totalExpense : 0;
  const deficit = totalExpense > totalIncome ? totalExpense - totalIncome : 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between print-hide">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Account Statement</h2>
          <p className="text-muted-foreground mt-2">Income & Expenditure Report</p>
        </div>
        <Button onClick={() => window.print()} className="gap-2">
          <Printer className="w-4 h-4" /> Print Statement
        </Button>
      </div>

      <Card className="border-t-4 shadow-lg overflow-hidden" style={{ borderTopColor: "#15803d" }}>
        <div className="px-8 py-6 text-center border-b" style={{ background: "linear-gradient(to right, #f0fdf4, #fffbeb)" }}>
          <div className="flex justify-center mb-3">
            <img src="/kathartsis-logo.png" alt="KathArtsis" className="h-12 object-contain" />
          </div>
          <h2 className="text-xl font-bold" style={{ fontFamily: "Georgia, serif", color: "#15803d" }}>
            Income & Expenditure Account
          </h2>
          <p className="text-sm text-gray-500 mt-1">As of {format(new Date(), "MMMM do, yyyy")}</p>
        </div>

        <CardContent className="p-0">
          <div className="account-statement-grid grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
            <div>
              <div className="p-4 border-b text-center font-bold uppercase tracking-wider text-sm" style={{ background: "#fef2f2", color: "#991b1b" }}>
                Expenditure (Dr.)
              </div>
              <table className="w-full text-sm">
                <tbody>
                  {isLoading ? (
                    <tr><td className="p-4 text-center text-muted-foreground">Loading...</td></tr>
                  ) : expenses.length === 0 ? (
                    <tr><td className="p-4 text-center text-muted-foreground italic">No expenses recorded</td></tr>
                  ) : (
                    <>
                      {expenses.map((exp) => (
                        <tr key={exp.id} className="border-b last:border-0 hover:bg-red-50/30">
                          <td className="px-5 py-3">
                            <span className="font-medium text-gray-800">To {exp.category}</span>
                            <span className="block text-xs text-gray-500">{exp.name}</span>
                          </td>
                          <td className="px-5 py-3 text-right font-mono font-semibold text-red-700">
                            {formatCurrency(exp.amount)}
                          </td>
                        </tr>
                      ))}
                      {surplus > 0 && (
                        <tr className="bg-green-50">
                          <td className="px-5 py-3 font-bold text-green-700 italic">To Surplus (Excess of Income)</td>
                          <td className="px-5 py-3 text-right font-mono font-bold text-green-700">{formatCurrency(surplus)}</td>
                        </tr>
                      )}
                    </>
                  )}
                </tbody>
              </table>
            </div>

            <div>
              <div className="p-4 border-b text-center font-bold uppercase tracking-wider text-sm" style={{ background: "#f0fdf4", color: "#166534" }}>
                Income (Cr.)
              </div>
              <table className="w-full text-sm">
                <tbody>
                  {isLoading ? (
                    <tr><td className="p-4 text-center text-muted-foreground">Loading...</td></tr>
                  ) : incomes.length === 0 ? (
                    <tr><td className="p-4 text-center text-muted-foreground italic">No income recorded</td></tr>
                  ) : (
                    <>
                      {incomes.map((inc) => (
                        <tr key={inc.id} className="border-b last:border-0 hover:bg-green-50/30">
                          <td className="px-5 py-3">
                            <span className="font-medium text-gray-800">By {inc.category}</span>
                            <span className="block text-xs text-gray-500">{inc.name}</span>
                          </td>
                          <td className="px-5 py-3 text-right font-mono font-semibold text-green-700">
                            {formatCurrency(inc.amount)}
                          </td>
                        </tr>
                      ))}
                      {deficit > 0 && (
                        <tr className="bg-red-50">
                          <td className="px-5 py-3 font-bold text-red-700 italic">By Deficit (Excess of Expenditure)</td>
                          <td className="px-5 py-3 text-right font-mono font-bold text-red-700">{formatCurrency(deficit)}</td>
                        </tr>
                      )}
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-2 divide-x divide-border border-t-2" style={{ borderTopColor: "#15803d" }}>
            <div className="px-5 py-4 flex justify-between items-center font-bold text-base bg-red-50">
              <span className="text-gray-700">Total</span>
              <span className="font-mono text-red-700 border-double border-b-4 border-t border-current px-2 py-0.5">
                {formatCurrency(balanceTotal)}
              </span>
            </div>
            <div className="px-5 py-4 flex justify-between items-center font-bold text-base bg-green-50">
              <span className="text-gray-700">Total</span>
              <span className="font-mono text-green-700 border-double border-b-4 border-t border-current px-2 py-0.5">
                {formatCurrency(balanceTotal)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="print-only mt-24 flex justify-between px-12">
        <div className="w-48 border-t border-black pt-2 text-center text-sm font-bold">Prepared By</div>
        <div className="w-48 border-t border-black pt-2 text-center text-sm font-bold">Auditor / Treasurer</div>
      </div>
    </div>
  );
}
