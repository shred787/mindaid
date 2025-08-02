import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, DollarSign, Calendar, Plus } from "lucide-react";
import { RevenueChart } from "./revenue-chart";
import { RevenueEntryForm } from "./revenue-entry-form";

interface RevenueStats {
  totalIncome: number;
  totalExpenses: number;
  projectedIncome: number;
  netRevenue: number;
}

interface RevenueEntry {
  id: string;
  amount: number;
  type: "income" | "expense" | "projection";
  category: string;
  description: string;
  date: string;
  isRecurring: boolean;
}

export function RevenueDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState<"month" | "quarter" | "year">("month");
  const [showForm, setShowForm] = useState(false);

  const { data: revenueStats } = useQuery<RevenueStats>({
    queryKey: [`/api/revenue/stats/${selectedPeriod}`],
  });

  const { data: revenueEntries } = useQuery<RevenueEntry[]>({
    queryKey: ["/api/revenue"],
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getChangeColor = (amount: number) => {
    if (amount > 0) return "text-green-600 dark:text-green-400";
    if (amount < 0) return "text-red-600 dark:text-red-400";
    return "text-gray-600 dark:text-gray-400";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Revenue Dashboard</h2>
          <p className="text-muted-foreground">
            Track income, expenses, and financial projections
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Entry
        </Button>
      </div>

      {/* Period Selector */}
      <Tabs value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v as any)}>
        <TabsList>
          <TabsTrigger value="month">Month</TabsTrigger>
          <TabsTrigger value="quarter">Quarter</TabsTrigger>
          <TabsTrigger value="year">Year</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedPeriod} className="space-y-6 mt-6">
          {/* Stats Cards */}
          {revenueStats && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(revenueStats.totalIncome)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                  <TrendingDown className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {formatCurrency(revenueStats.totalExpenses)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Net Revenue</CardTitle>
                  <DollarSign className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${getChangeColor(revenueStats.netRevenue)}`}>
                    {formatCurrency(revenueStats.netRevenue)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Projected Income</CardTitle>
                  <Calendar className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(revenueStats.projectedIncome)}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <RevenueChart data={revenueEntries || []} period={selectedPeriod} />
            </CardContent>
          </Card>

          {/* Recent Entries */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {revenueEntries?.slice(0, 10).map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant={entry.type === "income" ? "default" : 
                               entry.type === "expense" ? "destructive" : "secondary"}
                      >
                        {entry.type}
                      </Badge>
                      <div>
                        <p className="font-medium">{entry.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {entry.category} • {new Date(entry.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className={`font-bold ${getChangeColor(
                      entry.type === "expense" ? -entry.amount : entry.amount
                    )}`}>
                      {entry.type === "expense" ? "-" : "+"}{formatCurrency(entry.amount)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Revenue Entry Form Modal */}
      {showForm && (
        <RevenueEntryForm 
          onClose={() => setShowForm(false)}
          onSubmit={() => {
            setShowForm(false);
            // Refetch will happen automatically via React Query
          }}
        />
      )}
    </div>
  );
}