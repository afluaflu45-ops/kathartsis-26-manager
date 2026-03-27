import { useFinance } from "@/hooks/use-finance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer, FileText } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { useMemo } from "react";

export default function AccountStatement() {
  const { data: transactions, isLoading } = useFinance();

  const { incomes, expenses, totalIncome, totalExpense, balanceTotal } = useMemo(() => {
    const incs = (transactions || []).filter(t => t.type === 'income');
    const exps = (transactions || []).filter(t => t.type === 'expense');
    
    const tInc = incs.reduce((sum, t) => sum + t.amount, 0);
    const tExp = exps.reduce((sum, t) => sum + t.amount, 0);
    
    return {
      incomes: incs,
      expenses: exps,
      totalIncome: tInc,
      totalExpense: tExp,
      balanceTotal: Math.max(tInc, tExp)
    };
  }, [transactions]);

  const surplus = totalIncome > totalExpense ? totalIncome - totalExpense : 0;
  const deficit = totalExpense > totalIncome ? totalExpense - totalIncome : 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between print-hide">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Account Statement</h2>
          <p className="text-muted-foreground mt-2">Income and Expenditure Report.</p>
        </div>
        <Button onClick={() => window.print()} className="gap-2">
          <Printer className="w-4 h-4" /> Print Statement
        </Button>
      </div>

      <Card className="print-shadow-none print-border-none border-t-4 border-t-primary shadow-lg overflow-hidden">
        <div className="print-only mb-8 text-center pt-8">
          <h1 className="text-3xl font-serif font-bold text-primary">KathArtsis</h1>
          <h2 className="text-xl font-medium mt-2">Income & Expenditure Account</h2>
          <p className="text-gray-500">As of {format(new Date(), 'MMMM do, yyyy')}</p>
        </div>
        
        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
            
            {/* EXPENDITURE SIDE (Left historically in traditional I&E, but standard UI sometimes swaps. Let's do traditional: Expenditure Left, Income Right) */}
            <div className="p-0">
              <div className="bg-secondary/50 p-4 border-b">
                <h3 className="font-bold text-center uppercase tracking-wider text-muted-foreground">Expenditure (To)</h3>
              </div>
              <table className="w-full text-sm">
                <tbody>
                  {isLoading ? (
                    <tr><td className="p-4 text-center text-muted-foreground">Loading...</td></tr>
                  ) : (
                    <>
                      {expenses.map((exp) => (
                        <tr key={exp.id} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="p-4">
                            <span className="font-medium">{exp.name}</span>
                            <span className="text-muted-foreground ml-2">({exp.category})</span>
                          </td>
                          <td className="p-4 text-right">{formatCurrency(exp.amount)}</td>
                        </tr>
                      ))}
                      {surplus > 0 && (
                        <tr className="border-b bg-green-50/50">
                          <td className="p-4 font-bold text-green-700 italic">To Surplus (Excess of Income over Expenditure)</td>
                          <td className="p-4 text-right font-bold text-green-700">{formatCurrency(surplus)}</td>
                        </tr>
                      )}
                      {/* Pad empty space if needed, CSS grid handles equal height usually */}
                    </>
                  )}
                </tbody>
              </table>
            </div>

            {/* INCOME SIDE */}
            <div className="p-0">
              <div className="bg-secondary/50 p-4 border-b">
                <h3 className="font-bold text-center uppercase tracking-wider text-muted-foreground">Income (By)</h3>
              </div>
              <table className="w-full text-sm">
                <tbody>
                  {isLoading ? (
                    <tr><td className="p-4 text-center text-muted-foreground">Loading...</td></tr>
                  ) : (
                    <>
                      {incomes.map((inc) => (
                        <tr key={inc.id} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="p-4">
                            <span className="font-medium">{inc.name}</span>
                            <span className="text-muted-foreground ml-2">({inc.category})</span>
                          </td>
                          <td className="p-4 text-right">{formatCurrency(inc.amount)}</td>
                        </tr>
                      ))}
                      {deficit > 0 && (
                        <tr className="border-b bg-red-50/50">
                          <td className="p-4 font-bold text-red-700 italic">By Deficit (Excess of Expenditure over Income)</td>
                          <td className="p-4 text-right font-bold text-red-700">{formatCurrency(deficit)}</td>
                        </tr>
                      )}
                    </>
                  )}
                </tbody>
              </table>
            </div>
            
          </div>
          
          {/* TOTALS ROW */}
          <div className="grid grid-cols-2 divide-x divide-border border-t bg-muted/20">
            <div className="p-4 flex justify-between items-center font-bold text-lg">
              <span>Total</span>
              <span className="border-double border-b-4 border-t px-2 py-1">{formatCurrency(balanceTotal)}</span>
            </div>
            <div className="p-4 flex justify-between items-center font-bold text-lg">
              <span>Total</span>
              <span className="border-double border-b-4 border-t px-2 py-1">{formatCurrency(balanceTotal)}</span>
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
