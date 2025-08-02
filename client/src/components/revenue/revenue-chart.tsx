import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

interface RevenueEntry {
  id: string;
  amount: number;
  type: "income" | "expense" | "projection";
  category: string;
  description: string;
  date: string;
  isRecurring: boolean;
}

interface RevenueChartProps {
  data: RevenueEntry[];
  period: "month" | "quarter" | "year";
}

export function RevenueChart({ data, period }: RevenueChartProps) {
  const chartData = useMemo(() => {
    if (!data?.length) return [];

    // Group data by date and type
    const grouped = data.reduce((acc, entry) => {
      const date = new Date(entry.date);
      let key: string;

      switch (period) {
        case "month":
          key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          break;
        case "quarter":
          key = date.toLocaleDateString('en-US', { month: 'short' });
          break;
        case "year":
          key = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
          break;
        default:
          key = date.toLocaleDateString();
      }

      if (!acc[key]) {
        acc[key] = {
          date: key,
          income: 0,
          expenses: 0,
          projections: 0,
          net: 0,
        };
      }

      switch (entry.type) {
        case "income":
          acc[key].income += entry.amount;
          break;
        case "expense":
          acc[key].expenses += entry.amount;
          break;
        case "projection":
          acc[key].projections += entry.amount;
          break;
      }

      acc[key].net = acc[key].income - acc[key].expenses;

      return acc;
    }, {} as Record<string, any>);

    return Object.values(grouped).sort((a: any, b: any) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }, [data, period]);

  if (!chartData.length) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        No revenue data available for the selected period
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Net Revenue Trend */}
      <div>
        <h4 className="text-sm font-medium mb-3">Net Revenue Trend</h4>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis 
              tickFormatter={(value) => `$${(value / 1000).toFixed(1)}k`}
            />
            <Tooltip 
              formatter={(value: number) => [`$${value.toLocaleString()}`, "Net Revenue"]}
              labelStyle={{ color: "hsl(var(--foreground))" }}
              contentStyle={{ 
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px"
              }}
            />
            <Line 
              type="monotone" 
              dataKey="net" 
              stroke="hsl(var(--primary))" 
              strokeWidth={3}
              dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Income vs Expenses */}
      <div>
        <h4 className="text-sm font-medium mb-3">Income vs Expenses</h4>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis 
              tickFormatter={(value) => `$${(value / 1000).toFixed(1)}k`}
            />
            <Tooltip 
              formatter={(value: number, name: string) => [
                `$${value.toLocaleString()}`, 
                name === "income" ? "Income" : name === "expenses" ? "Expenses" : "Projections"
              ]}
              labelStyle={{ color: "hsl(var(--foreground))" }}
              contentStyle={{ 
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px"
              }}
            />
            <Bar dataKey="income" fill="hsl(142, 76%, 36%)" name="income" />
            <Bar dataKey="expenses" fill="hsl(0, 84%, 60%)" name="expenses" />
            <Bar dataKey="projections" fill="hsl(221, 83%, 53%)" name="projections" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}