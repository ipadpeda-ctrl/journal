import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trade } from "./TradesTable";
import { TrendingDown, Flame, Calendar, Clock, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";

interface AdvancedMetricsProps {
  trades: Trade[];
}

function calculateMaxDrawdown(trades: Trade[]): { maxDrawdown: number; maxDrawdownPercent: string } {
  if (trades.length === 0) return { maxDrawdown: 0, maxDrawdownPercent: "0.00" };

  const sortedTrades = [...trades].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time || "00:00"}`);
    const dateB = new Date(`${b.date}T${b.time || "00:00"}`);
    return dateA.getTime() - dateB.getTime();
  });

  let equity = 0;
  let peak = 0;
  let maxDrawdown = 0;

  for (const trade of sortedTrades) {
    equity += trade.pnl || 0;

    if (equity > peak) {
      peak = equity;
    }

    const drawdown = peak - equity;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }

  const totalPnl = sortedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const maxPeak = Math.max(peak, Math.abs(totalPnl));
  const maxDrawdownPercent = maxPeak > 0 ? ((maxDrawdown / maxPeak) * 100).toFixed(2) : "0.00";
  return { maxDrawdown, maxDrawdownPercent };
}

function calculateStreaks(trades: Trade[]): { 
  currentStreak: number; 
  currentStreakType: "win" | "loss" | "none";
  maxWinStreak: number; 
  maxLossStreak: number 
} {
  if (trades.length === 0) {
    return { currentStreak: 0, currentStreakType: "none", maxWinStreak: 0, maxLossStreak: 0 };
  }

  const sortedTrades = [...trades].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time || "00:00"}`);
    const dateB = new Date(`${b.date}T${b.time || "00:00"}`);
    return dateA.getTime() - dateB.getTime();
  });

  let maxWinStreak = 0;
  let maxLossStreak = 0;
  let currentWinStreak = 0;
  let currentLossStreak = 0;

  for (const trade of sortedTrades) {
    const isWin = trade.result === "target" || trade.result === "parziale";
    const isLoss = trade.result === "stop_loss";

    if (isWin) {
      currentWinStreak++;
      currentLossStreak = 0;
      maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
    } else if (isLoss) {
      currentLossStreak++;
      currentWinStreak = 0;
      maxLossStreak = Math.max(maxLossStreak, currentLossStreak);
    } else {
      currentWinStreak = 0;
      currentLossStreak = 0;
    }
  }

  const lastTrade = sortedTrades[sortedTrades.length - 1];
  const lastIsWin = lastTrade.result === "target" || lastTrade.result === "parziale";
  const lastIsLoss = lastTrade.result === "stop_loss";

  return {
    currentStreak: lastIsWin ? currentWinStreak : lastIsLoss ? currentLossStreak : 0,
    currentStreakType: lastIsWin ? "win" : lastIsLoss ? "loss" : "none",
    maxWinStreak,
    maxLossStreak,
  };
}

function calculatePerformanceByDay(trades: Trade[]): { day: string; winRate: number; count: number }[] {
  const days = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];
  
  return days.map((day, index) => {
    const dayTrades = trades.filter((t) => {
      const date = new Date(t.date);
      return date.getDay() === index;
    });
    
    const wins = dayTrades.filter((t) => t.result === "target" || t.result === "parziale").length;
    const winRate = dayTrades.length > 0 ? (wins / dayTrades.length) * 100 : 0;
    
    return { day, winRate, count: dayTrades.length };
  });
}

function calculatePerformanceByHour(trades: Trade[]): { hour: string; winRate: number; count: number }[] {
  const hours: { hour: string; winRate: number; count: number }[] = [];
  
  for (let h = 6; h <= 22; h++) {
    const hourStr = h.toString().padStart(2, "0");
    const hourTrades = trades.filter((t) => {
      if (!t.time) return false;
      const tradeHour = parseInt(t.time.split(":")[0], 10);
      return tradeHour === h;
    });
    
    const wins = hourTrades.filter((t) => t.result === "target" || t.result === "parziale").length;
    const winRate = hourTrades.length > 0 ? (wins / hourTrades.length) * 100 : 0;
    
    hours.push({ hour: `${hourStr}:00`, winRate, count: hourTrades.length });
  }
  
  return hours;
}

export default function AdvancedMetrics({ trades }: AdvancedMetricsProps) {
  const { maxDrawdown, maxDrawdownPercent } = calculateMaxDrawdown(trades);
  const streaks = calculateStreaks(trades);
  const performanceByDay = calculatePerformanceByDay(trades);
  const performanceByHour = calculatePerformanceByHour(trades);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-red-900/20 border-red-900/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-5 h-5 text-red-400" />
              <span className="text-sm text-muted-foreground">Max Drawdown</span>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-3 h-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-48 text-xs">La massima perdita dal picco massimo dell'equity</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="text-2xl font-bold text-red-400 font-mono" data-testid="text-max-drawdown">
              -{maxDrawdownPercent}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {maxDrawdown.toFixed(2)} EUR
            </p>
          </CardContent>
        </Card>

        <Card className="bg-emerald-900/20 border-emerald-900/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-5 h-5 text-emerald-400" />
              <span className="text-sm text-muted-foreground">Max Win Streak</span>
            </div>
            <p className="text-2xl font-bold text-emerald-400 font-mono" data-testid="text-max-win-streak">
              {streaks.maxWinStreak}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Trade vincenti consecutivi
            </p>
          </CardContent>
        </Card>

        <Card className="bg-red-900/20 border-red-900/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-5 h-5 text-red-400" />
              <span className="text-sm text-muted-foreground">Max Loss Streak</span>
            </div>
            <p className="text-2xl font-bold text-red-400 font-mono" data-testid="text-max-loss-streak">
              {streaks.maxLossStreak}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Trade perdenti consecutivi
            </p>
          </CardContent>
        </Card>

        <Card className={streaks.currentStreakType === "win" ? "bg-emerald-900/20 border-emerald-900/30" : streaks.currentStreakType === "loss" ? "bg-red-900/20 border-red-900/30" : ""}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Flame className={`w-5 h-5 ${streaks.currentStreakType === "win" ? "text-emerald-400" : streaks.currentStreakType === "loss" ? "text-red-400" : "text-muted-foreground"}`} />
              <span className="text-sm text-muted-foreground">Streak Attuale</span>
            </div>
            <p className={`text-2xl font-bold font-mono ${streaks.currentStreakType === "win" ? "text-emerald-400" : streaks.currentStreakType === "loss" ? "text-red-400" : "text-muted-foreground"}`} data-testid="text-current-streak">
              {streaks.currentStreak}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {streaks.currentStreakType === "win" ? "Vincenti" : streaks.currentStreakType === "loss" ? "Perdenti" : "N/A"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Performance per Giorno
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceByDay} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis 
                    dataKey="day" 
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Bar dataKey="winRate" radius={[4, 4, 0, 0]}>
                    {performanceByDay.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.winRate >= 50 ? "hsl(142, 71%, 45%)" : entry.count > 0 ? "hsl(0, 84%, 60%)" : "hsl(var(--muted))"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {performanceByDay.map((d) => (
                <div key={d.day} className="text-xs text-muted-foreground">
                  {d.day}: {d.count} trade
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Performance per Orario
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceByHour} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis 
                    dataKey="hour" 
                    tick={{ fontSize: 9 }}
                    axisLine={false}
                    tickLine={false}
                    interval={1}
                  />
                  <YAxis 
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Bar dataKey="winRate" radius={[4, 4, 0, 0]}>
                    {performanceByHour.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.winRate >= 50 ? "hsl(142, 71%, 45%)" : entry.count > 0 ? "hsl(0, 84%, 60%)" : "hsl(var(--muted))"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Win rate per fascia oraria (dalle 6:00 alle 22:00)
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
