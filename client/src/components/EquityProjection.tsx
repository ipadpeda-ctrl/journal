import { Card } from "@/components/ui/card";
import { Trade } from "./TradesTable";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface EquityProjectionProps {
  trades: Trade[];
  initialCapital?: number;
}

export default function EquityProjection({ trades, initialCapital = 10000 }: EquityProjectionProps) {
  const winTrades = trades.filter((t) => t.result === "target" || t.result === "parziale");
  const lossTrades = trades.filter((t) => t.result === "stop_loss");
  const totalTrades = winTrades.length + lossTrades.length;

  if (totalTrades < 3) {
    return (
      <Card className="p-4" data-testid="equity-projection">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium">Proiezione Equity (12 mesi)</h3>
        </div>
        <div className="h-64 flex items-center justify-center">
          <p className="text-sm text-muted-foreground text-center">
            Inserisci almeno 3 trade per vedere la proiezione.<br />
            <span className="text-xs">Trade attuali: {totalTrades}</span>
          </p>
        </div>
      </Card>
    );
  }

  const winRate = winTrades.length / totalTrades;
  const avgWin = winTrades.length > 0
    ? winTrades.reduce((sum, t) => sum + (t.result === "parziale" ? t.target * 0.5 : t.target), 0) / winTrades.length
    : 0;
  const avgLoss = lossTrades.length > 0
    ? lossTrades.reduce((sum, t) => sum + t.stopLoss, 0) / lossTrades.length
    : 0;

  const expectedReturn = (winRate * avgWin) - ((1 - winRate) * avgLoss);

  const projectionMonths = 12;
  const tradesPerMonth = Math.max(1, totalTrades > 0 ? Math.ceil(totalTrades / 3) : 10);

  const projectionData = [];
  let currentCapital = initialCapital;
  let optimisticCapital = initialCapital;
  let pessimisticCapital = initialCapital;

  for (let month = 0; month <= projectionMonths; month++) {
    projectionData.push({
      month: `M${month}`,
      expected: Math.round(currentCapital),
      optimistic: Math.round(optimisticCapital),
      pessimistic: Math.round(pessimisticCapital),
    });

    const monthlyExpectedReturn = expectedReturn * tradesPerMonth / 100;
    const monthlyOptimisticReturn = (expectedReturn * 1.5) * tradesPerMonth / 100;
    const monthlyPessimisticReturn = (expectedReturn * 0.5) * tradesPerMonth / 100;

    currentCapital *= (1 + monthlyExpectedReturn);
    optimisticCapital *= (1 + monthlyOptimisticReturn);
    pessimisticCapital *= (1 + Math.max(-0.05, monthlyPessimisticReturn));
  }

  const finalExpected = projectionData[projectionData.length - 1].expected;
  const projectedGrowth = ((finalExpected - initialCapital) / initialCapital * 100).toFixed(1);

  return (
    <Card className="p-4" data-testid="equity-projection">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium">Proiezione Equity (12 mesi)</h3>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Crescita attesa</p>
          <p className={`text-lg font-bold ${parseFloat(projectedGrowth) >= 0 ? "text-emerald-500" : "text-red-500"}`}>
            {parseFloat(projectedGrowth) >= 0 ? "+" : ""}{projectedGrowth}%
          </p>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={projectionData}>
            <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
              }}
              formatter={(value: number, name: string) => [
                `${value.toLocaleString()}`,
                name === "expected" ? "Atteso" : name === "optimistic" ? "Ottimistico" : "Pessimistico"
              ]}
            />
            <ReferenceLine y={initialCapital} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
            <Line
              type="monotone"
              dataKey="optimistic"
              stroke="hsl(142, 71%, 45%)"
              strokeWidth={1}
              strokeDasharray="5 5"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="expected"
              stroke="hsl(217, 91%, 60%)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="pessimistic"
              stroke="hsl(0, 84%, 60%)"
              strokeWidth={1}
              strokeDasharray="5 5"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-center gap-6 mt-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-[hsl(142,71%,45%)]" style={{ borderStyle: "dashed" }} />
          <span className="text-muted-foreground">Ottimistico</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-[hsl(217,91%,60%)]" />
          <span className="text-muted-foreground">Atteso</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-[hsl(0,84%,60%)]" style={{ borderStyle: "dashed" }} />
          <span className="text-muted-foreground">Pessimistico</span>
        </div>
      </div>
    </Card>
  );
}
