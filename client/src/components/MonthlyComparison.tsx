import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trade } from "./TradesTable";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip, Legend, LineChart, Line } from "recharts";
import { TrendingUp, Calendar } from "lucide-react";

interface MonthlyComparisonProps {
  trades: Trade[];
  initialCapital?: number;
}

interface MonthlyData {
  month: string;
  monthLabel: string;
  trades: number;
  wins: number;
  losses: number;
  winRate: number;
  pnl: number;
  equity: number;
}

function calculateTradePnl(trade: Trade): number {
  if (trade.result === "target") {
    return trade.target * 100;
  } else if (trade.result === "stop_loss") {
    return -trade.stopLoss * 100;
  } else if (trade.result === "parziale") {
    return (trade.target * 0.5) * 100;
  }
  return 0;
}

function calculateMonthlyData(trades: Trade[], initialCapital: number = 10000): MonthlyData[] {
  const monthlyMap = new Map<string, Trade[]>();

  for (const trade of trades) {
    const date = new Date(trade.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (!monthlyMap.has(monthKey)) {
      monthlyMap.set(monthKey, []);
    }
    monthlyMap.get(monthKey)!.push(trade);
  }

  const sortedMonths = Array.from(monthlyMap.keys()).sort();
  const monthNames = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];

  let cumulativeEquity = initialCapital;

  return sortedMonths.map((monthKey) => {
    const monthTrades = monthlyMap.get(monthKey)!;
    const [year, month] = monthKey.split("-");
    const monthIndex = parseInt(month, 10) - 1;

    const wins = monthTrades.filter((t) => t.result === "target" || t.result === "parziale").length;
    const losses = monthTrades.filter((t) => t.result === "stop_loss").length;
    const winRate = monthTrades.length > 0 ? (wins / monthTrades.length) * 100 : 0;

    const pnl = monthTrades.reduce((sum, t) => sum + calculateTradePnl(t), 0);

    cumulativeEquity += pnl;

    return {
      month: monthKey,
      monthLabel: `${monthNames[monthIndex]} ${year.slice(2)}`,
      trades: monthTrades.length,
      wins,
      losses,
      winRate,
      pnl,
      equity: cumulativeEquity,
    };
  });
}

export default function MonthlyComparison({ trades, initialCapital = 10000 }: MonthlyComparisonProps) {
  const monthlyData = calculateMonthlyData(trades, initialCapital);

  if (monthlyData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Confronto Mensile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Nessun dato disponibile. Aggiungi dei trade per vedere il confronto mensile.
          </p>
        </CardContent>
      </Card>
    );
  }

  const bestMonth = [...monthlyData].sort((a, b) => b.pnl - a.pnl)[0];
  const worstMonth = [...monthlyData].sort((a, b) => a.pnl - b.pnl)[0];
  const avgMonthlyPnl = monthlyData.reduce((sum, m) => sum + m.pnl, 0) / monthlyData.length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="bg-emerald-900/20 border-emerald-900/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <span className="text-sm text-muted-foreground">Miglior Mese</span>
            </div>
            <p className="text-xl font-bold text-emerald-400 font-mono" data-testid="text-best-month">
              {bestMonth.monthLabel}
            </p>
            <p className="text-sm text-muted-foreground">
              +{bestMonth.pnl.toFixed(2)} EUR ({bestMonth.winRate.toFixed(0)}% WR)
            </p>
          </CardContent>
        </Card>

        <Card className="bg-red-900/20 border-red-900/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-red-400 rotate-180" />
              <span className="text-sm text-muted-foreground">Peggior Mese</span>
            </div>
            <p className="text-xl font-bold text-red-400 font-mono" data-testid="text-worst-month">
              {worstMonth.monthLabel}
            </p>
            <p className="text-sm text-muted-foreground">
              {worstMonth.pnl >= 0 ? "+" : ""}{worstMonth.pnl.toFixed(2)} EUR ({worstMonth.winRate.toFixed(0)}% WR)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              <span className="text-sm text-muted-foreground">Media Mensile</span>
            </div>
            <p className={`text-xl font-bold font-mono ${avgMonthlyPnl >= 0 ? "text-emerald-400" : "text-red-400"}`} data-testid="text-avg-monthly">
              {avgMonthlyPnl >= 0 ? "+" : ""}{avgMonthlyPnl.toFixed(2)} EUR
            </p>
            <p className="text-sm text-muted-foreground">
              Su {monthlyData.length} mesi
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">P&L Mensile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <XAxis
                    dataKey="monthLabel"
                    tick={{ fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${v >= 0 ? "+" : ""}${v}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                    }}
                    formatter={(value: number) => [`${value >= 0 ? "+" : ""}${value.toFixed(2)} EUR`, "P&L"]}
                  />
                  <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                    {monthlyData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.pnl >= 0 ? "hsl(142, 71%, 45%)" : "hsl(0, 84%, 60%)"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Equity Mensile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <XAxis
                    dataKey="monthLabel"
                    tick={{ fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    domain={["dataMin - 100", "dataMax + 100"]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                    }}
                    formatter={(value: number) => [`${value.toFixed(2)} EUR`, "Equity"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="equity"
                    stroke="hsl(217, 91%, 60%)"
                    strokeWidth={2}
                    dot={{ fill: "hsl(217, 91%, 60%)", strokeWidth: 0, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Win Rate Mensile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <XAxis
                  dataKey="monthLabel"
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === "winRate") return [`${value.toFixed(1)}%`, "Win Rate"];
                    return [value, name];
                  }}
                />
                <Bar dataKey="winRate" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-4 mt-4 justify-center">
            {monthlyData.map((m) => (
              <div key={m.month} className="text-center">
                <p className="text-xs text-muted-foreground">{m.monthLabel}</p>
                <p className="text-sm font-mono">{m.trades} trade</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
