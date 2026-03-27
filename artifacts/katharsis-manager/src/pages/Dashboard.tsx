import { useFinanceSummary } from "@/hooks/use-finance";
import { useReceipts } from "@/hooks/use-receipts";
import { useStickers } from "@/hooks/use-stickers";
import { useCertificates } from "@/hooks/use-certificates";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, TrendingUp, TrendingDown, Receipt, Award, Medal } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { data: finance } = useFinanceSummary();
  const { data: receipts } = useReceipts();
  const { data: stickers } = useStickers();
  const { data: certificates } = useCertificates();

  const stats = [
    {
      title: "Total Income",
      value: formatCurrency(finance?.totalIncome || 0),
      icon: TrendingUp,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Total Expense",
      value: formatCurrency(finance?.totalExpense || 0),
      icon: TrendingDown,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
    },
    {
      title: "Current Balance",
      value: formatCurrency(finance?.balance || 0),
      icon: Wallet,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Generated Receipts",
      value: receipts?.length || 0,
      icon: Receipt,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Award Stickers",
      value: stickers?.length || 0,
      icon: Award,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      title: "Certificates Issued",
      value: certificates?.length || 0,
      icon: Medal,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
        <p className="text-muted-foreground mt-2">Welcome to KathArtsis Manager. Here's what's happening today.</p>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="hover:shadow-md transition-shadow duration-300">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${stat.bgColor}`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
