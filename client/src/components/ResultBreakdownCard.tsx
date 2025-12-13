import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Trade, TradeResult } from "./TradesTable";

interface ResultBreakdownCardProps {
  title: string;
  result: TradeResult;
  trades: Trade[];
  color: string;
}

export default function ResultBreakdownCard({ title, result, trades, color }: ResultBreakdownCardProps) {
  const resultTrades = trades.filter((t) => t.result === result);
  const longTrades = resultTrades.filter((t) => t.direction === "long").length;
  const shortTrades = resultTrades.filter((t) => t.direction === "short").length;
  const total = longTrades + shortTrades;

  const longPercent = total > 0 ? ((longTrades / total) * 100).toFixed(2) : "0";
  const shortPercent = total > 0 ? ((shortTrades / total) * 100).toFixed(2) : "0";

  const longData = [
    { name: "Long", value: parseFloat(longPercent) },
    { name: "Rest", value: 100 - parseFloat(longPercent) },
  ];

  const shortData = [
    { name: "Short", value: parseFloat(shortPercent) },
    { name: "Rest", value: 100 - parseFloat(shortPercent) },
  ];

  const DonutWithLabel = ({ data, percent, label, fillColor }: { data: typeof longData; percent: string; label: string; fillColor: string }) => (
    <div className="flex items-center gap-3">
      <div className="relative w-16 h-16">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={20}
              outerRadius={28}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
            >
              <Cell fill={fillColor} />
              <Cell fill="hsl(var(--muted))" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[9px] font-medium">{percent}%</span>
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold">{label === "Long" ? longTrades : shortTrades}</p>
        <p className="text-xs text-muted-foreground">Trade {label.toLowerCase()}</p>
      </div>
    </div>
  );

  return (
    <Card className="p-4" data-testid={`result-breakdown-${result}`}>
      <h3 className={`text-sm font-medium mb-4`} style={{ color }}>
        {title}
      </h3>
      
      <div className="flex items-center justify-between">
        <DonutWithLabel 
          data={longData} 
          percent={longPercent} 
          label="Long" 
          fillColor="hsl(142, 71%, 45%)" 
        />
        <DonutWithLabel 
          data={shortData} 
          percent={shortPercent} 
          label="Short" 
          fillColor="hsl(var(--muted-foreground))" 
        />
      </div>
    </Card>
  );
}
