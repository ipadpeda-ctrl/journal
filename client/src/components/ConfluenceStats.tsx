import { Card } from "@/components/ui/card";
import { Trade, TradeResult } from "./TradesTable";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Cell } from "recharts";

interface ConfluenceStatsProps {
  trades: Trade[];
  type: "pro" | "contro";
}

const RESULT_COLORS: Record<TradeResult, string> = {
  target: "hsl(142, 71%, 45%)",
  stop_loss: "hsl(0, 84%, 60%)",
  breakeven: "hsl(45, 93%, 47%)",
  parziale: "hsl(217, 91%, 60%)",
  non_fillato: "hsl(0, 0%, 50%)",
};

export default function ConfluenceStats({ trades, type }: ConfluenceStatsProps) {
  const confluenceKey = type === "pro" ? "confluencesPro" : "confluencesContro";
  
  const confluenceData: Record<string, Record<TradeResult, number>> = {};
  
  for (const trade of trades) {
    for (const confluence of trade[confluenceKey]) {
      if (!confluenceData[confluence]) {
        confluenceData[confluence] = {
          target: 0,
          stop_loss: 0,
          breakeven: 0,
          parziale: 0,
          non_fillato: 0,
        };
      }
      confluenceData[confluence][trade.result]++;
    }
  }

  const chartData = Object.entries(confluenceData)
    .map(([name, results]) => ({
      name: name.length > 20 ? name.slice(0, 20) + "..." : name,
      fullName: name,
      target: results.target,
      stop_loss: results.stop_loss,
      breakeven: results.breakeven,
      parziale: results.parziale,
      non_fillato: results.non_fillato,
      total: Object.values(results).reduce((a, b) => a + b, 0),
      winRate: ((results.target + results.parziale) / 
        Math.max(1, Object.values(results).reduce((a, b) => a + b, 0)) * 100).toFixed(1),
    }))
    .sort((a, b) => b.total - a.total);

  return (
    <Card className="p-4">
      <h3 className="text-sm font-medium mb-1">
        Statistiche per {type === "pro" ? "Confluenza PRO" : "Confluenza CONTRO"}
      </h3>
      <p className="text-xs text-muted-foreground mb-4">
        Numero di trade ed esito per ogni punto della checklist
      </p>

      {chartData.length > 0 ? (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ left: 20, right: 20 }}
            >
              <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis 
                type="category" 
                dataKey="name" 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={11}
                width={120}
                tick={{ fill: "hsl(var(--foreground))" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                }}
                formatter={(value: number, name: string) => {
                  const labels: Record<string, string> = {
                    target: "Take Profit",
                    stop_loss: "Stop Loss",
                    breakeven: "Breakeven",
                    parziale: "Parziali",
                    non_fillato: "Non Fillato",
                  };
                  return [value, labels[name] || name];
                }}
              />
              <Legend 
                formatter={(value) => {
                  const labels: Record<string, string> = {
                    target: "Take Profit",
                    stop_loss: "Stop Loss",
                    breakeven: "Breakeven",
                    parziale: "Parziali",
                    non_fillato: "Non Fillato",
                  };
                  return labels[value] || value;
                }}
              />
              <Bar dataKey="target" stackId="a" fill={RESULT_COLORS.target} />
              <Bar dataKey="stop_loss" stackId="a" fill={RESULT_COLORS.stop_loss} />
              <Bar dataKey="breakeven" stackId="a" fill={RESULT_COLORS.breakeven} />
              <Bar dataKey="parziale" stackId="a" fill={RESULT_COLORS.parziale} />
              <Bar dataKey="non_fillato" stackId="a" fill={RESULT_COLORS.non_fillato} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-8">
          Nessun dato disponibile
        </p>
      )}

      {chartData.length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-muted-foreground mb-2">Win Rate per confluenza</p>
          <div className="grid grid-cols-2 gap-2">
            {chartData.slice(0, 6).map((item) => (
              <div key={item.fullName} className="flex items-center justify-between text-xs p-2 rounded bg-muted/30">
                <span className="truncate mr-2">{item.name}</span>
                <span className={parseFloat(item.winRate) >= 50 ? "text-emerald-500" : "text-red-500"}>
                  {item.winRate}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
