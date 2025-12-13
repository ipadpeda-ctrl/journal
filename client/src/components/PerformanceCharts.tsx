import { Card } from "@/components/ui/card";
import { Trade } from "./TradesTable";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface PerformanceByPairProps {
  trades: Trade[];
}

export function PerformanceByPair({ trades }: PerformanceByPairProps) {
  const pairData: Record<string, number> = {};

  for (const trade of trades) {
    if (!pairData[trade.pair]) {
      pairData[trade.pair] = 0;
    }
    if (trade.result === "target") {
      pairData[trade.pair] += trade.target;
    } else if (trade.result === "parziale") {
      pairData[trade.pair] += trade.target * 0.5;
    } else if (trade.result === "stop_loss") {
      pairData[trade.pair] -= trade.stopLoss;
    }
  }

  const chartData = Object.entries(pairData)
    .map(([pair, pnl]) => ({ pair, pnl: parseFloat(pnl.toFixed(2)) }))
    .sort((a, b) => b.pnl - a.pnl);

  return (
    <Card className="p-4">
      <h3 className="text-sm font-medium mb-4">Performance per Pair</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <XAxis dataKey="pair" stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
              }}
              formatter={(value: number) => [`${value >= 0 ? "+" : ""}${value.toFixed(2)}%`, "P&L"]}
            />
            <Bar
              dataKey="pnl"
              radius={[4, 4, 0, 0]}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.pnl >= 0 ? "hsl(142, 71%, 45%)" : "hsl(0, 84%, 60%)"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

interface TradeCountDonutProps {
  trades: Trade[];
}

const RESULT_COLORS = {
  target: "hsl(142, 71%, 45%)",
  stop_loss: "hsl(0, 84%, 60%)",
  breakeven: "hsl(45, 93%, 47%)",
  parziale: "hsl(217, 91%, 60%)",
  non_fillato: "hsl(0, 0%, 50%)",
};

const RESULT_LABELS = {
  target: "Take Profit",
  stop_loss: "Stop Loss",
  breakeven: "Breakeven",
  parziale: "Parziali",
  non_fillato: "Non Fillato",
};

export function TradeCountDonut({ trades }: TradeCountDonutProps) {
  const resultCounts = trades.reduce((acc, trade) => {
    acc[trade.result] = (acc[trade.result] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(resultCounts).map(([result, count]) => ({
    name: RESULT_LABELS[result as keyof typeof RESULT_LABELS] || result,
    value: count,
    fill: RESULT_COLORS[result as keyof typeof RESULT_COLORS] || "hsl(var(--muted))",
  }));

  const total = trades.length;
  const tradesPerWeek = (total / Math.max(1, 4)).toFixed(1);

  return (
    <Card className="p-4">
      <h3 className="text-sm font-medium mb-4">Numero di Trade</h3>
      <div className="relative h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="45%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-3xl font-bold">{total}</p>
        </div>
      </div>
      <p className="text-center text-sm text-muted-foreground mt-2">
        {tradesPerWeek} a settimana
      </p>
    </Card>
  );
}

interface DirectionBreakdownProps {
  trades: Trade[];
}

export function DirectionBreakdown({ trades }: DirectionBreakdownProps) {
  const longTrades = trades.filter((t) => t.direction === "long").length;
  const shortTrades = trades.filter((t) => t.direction === "short").length;
  const total = trades.length;

  const longPercent = total > 0 ? ((longTrades / total) * 100).toFixed(1) : "0";
  const shortPercent = total > 0 ? ((shortTrades / total) * 100).toFixed(1) : "0";

  const data = [
    { name: "Long", value: longTrades, percent: longPercent },
    { name: "Short", value: shortTrades, percent: shortPercent },
  ];

  return (
    <Card className="p-4 flex items-center gap-6">
      <div className="flex items-center gap-3">
        <div className="relative w-16 h-16">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={[{ value: parseFloat(longPercent) }, { value: 100 - parseFloat(longPercent) }]}
                cx="50%"
                cy="50%"
                innerRadius={20}
                outerRadius={28}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
              >
                <Cell fill="hsl(142, 71%, 45%)" />
                <Cell fill="hsl(var(--muted))" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold">{longPercent}%</span>
          </div>
        </div>
        <div>
          <p className="text-2xl font-bold">{longTrades}</p>
          <p className="text-xs text-muted-foreground">Trade long</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative w-16 h-16">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={[{ value: parseFloat(shortPercent) }, { value: 100 - parseFloat(shortPercent) }]}
                cx="50%"
                cy="50%"
                innerRadius={20}
                outerRadius={28}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
              >
                <Cell fill="hsl(var(--muted-foreground))" />
                <Cell fill="hsl(var(--muted))" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold">{shortPercent}%</span>
          </div>
        </div>
        <div>
          <p className="text-2xl font-bold">{shortTrades}</p>
          <p className="text-xs text-muted-foreground">Trade short</p>
        </div>
      </div>
    </Card>
  );
}
