import { Card } from "@/components/ui/card";
import { Trade } from "./TradesTable";
import { TrendingUp, TrendingDown, Target, XCircle, MinusCircle } from "lucide-react";

interface WeeklyRecapProps {
  trades: Trade[];
  currentDate?: Date;
}

export default function WeeklyRecap({ trades, currentDate = new Date() }: WeeklyRecapProps) {
  const getWeekDates = (date: Date) => {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { monday, sunday };
  };

  const { monday, sunday } = getWeekDates(new Date(currentDate));
  
  const weekTrades = trades.filter((trade) => {
    const tradeDate = new Date(trade.date);
    return tradeDate >= monday && tradeDate <= sunday;
  });

  const totalTrades = weekTrades.length;
  const wins = weekTrades.filter((t) => t.result === "target" || t.result === "parziale").length;
  const losses = weekTrades.filter((t) => t.result === "stop_loss").length;
  const breakevens = weekTrades.filter((t) => t.result === "breakeven").length;
  const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(1) : "0";

  const pnl = weekTrades.reduce((acc, trade) => {
    if (trade.result === "target") return acc + trade.target;
    if (trade.result === "parziale") return acc + (trade.target * 0.5);
    if (trade.result === "stop_loss") return acc - trade.stopLoss;
    return acc;
  }, 0);

  const formatDate = (date: Date) => {
    return `${date.getDate()}/${date.getMonth() + 1}`;
  };

  return (
    <Card className="p-4 h-full">
      <h3 className="text-sm font-medium mb-4">Recap Settimanale</h3>
      <p className="text-xs text-muted-foreground mb-4">
        {formatDate(monday)} - {formatDate(sunday)}
      </p>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <span className="text-sm text-muted-foreground">Trades Totali</span>
          <span className="text-xl font-bold font-mono">{totalTrades}</span>
        </div>

        <div className={`flex items-center justify-between p-3 rounded-lg ${pnl >= 0 ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
          <div className="flex items-center gap-2">
            {pnl >= 0 ? (
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
            <span className="text-sm text-muted-foreground">P&L</span>
          </div>
          <span className={`text-xl font-bold font-mono ${pnl >= 0 ? "text-emerald-500" : "text-red-500"}`}>
            {pnl >= 0 ? "+" : ""}{pnl.toFixed(2)}%
          </span>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-chart-1/10">
          <span className="text-sm text-muted-foreground">Win Rate</span>
          <span className="text-xl font-bold font-mono text-chart-1">{winRate}%</span>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-2">
          <div className="text-center p-2 rounded-lg bg-emerald-500/10">
            <Target className="w-4 h-4 mx-auto text-emerald-500 mb-1" />
            <p className="text-lg font-bold text-emerald-500">{wins}</p>
            <p className="text-xs text-muted-foreground">Win</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-red-500/10">
            <XCircle className="w-4 h-4 mx-auto text-red-500 mb-1" />
            <p className="text-lg font-bold text-red-500">{losses}</p>
            <p className="text-xs text-muted-foreground">Loss</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-yellow-500/10">
            <MinusCircle className="w-4 h-4 mx-auto text-yellow-500 mb-1" />
            <p className="text-lg font-bold text-yellow-500">{breakevens}</p>
            <p className="text-xs text-muted-foreground">BE</p>
          </div>
        </div>

        {weekTrades.length > 0 && (
          <div className="pt-2">
            <p className="text-xs text-muted-foreground mb-2">Ultimi trade</p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {weekTrades.slice(-5).reverse().map((trade) => (
                <div key={trade.id} className="flex items-center justify-between text-xs p-1.5 rounded bg-muted/30">
                  <span>{trade.pair}</span>
                  <span className={
                    trade.result === "target" ? "text-emerald-500" :
                    trade.result === "stop_loss" ? "text-red-500" :
                    trade.result === "parziale" ? "text-blue-500" :
                    "text-yellow-500"
                  }>
                    {trade.result === "target" ? `+${trade.target}%` :
                     trade.result === "stop_loss" ? `-${trade.stopLoss}%` :
                     trade.result === "parziale" ? `+${(trade.target * 0.5).toFixed(1)}%` : "0%"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
