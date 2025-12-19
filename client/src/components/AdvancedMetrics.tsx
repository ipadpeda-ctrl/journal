import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trade } from "./TradesTable";
import { TrendingDown, Flame, Calendar, Clock, Info, Activity, Timer } from "lucide-react";
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
    if (equity > peak) peak = equity;
    const drawdown = peak - equity;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }

  const totalPnl = sortedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const maxPeak = Math.max(peak, Math.abs(totalPnl));
  const maxDrawdownPercent = maxPeak > 0 ? ((maxDrawdown / maxPeak) * 100).toFixed(2) : "0.00";
  return { maxDrawdown, maxDrawdownPercent };
}

// --- NEW METRICS: Sharpe, Sortino, Holding Time ---

function calculateSharpeRatio(trades: Trade[]): string {
  if (trades.length < 2) return "0.00";
  const returns = trades.map(t => t.pnl || 0);
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const stdDev = Math.sqrt(returns.map(x => Math.pow(x - avgReturn, 2)).reduce((a, b) => a + b) / returns.length);
  return stdDev === 0 ? "0.00" : (avgReturn / stdDev).toFixed(2);
}

function calculateSortinoRatio(trades: Trade[]): string {
  if (trades.length < 2) return "0.00";
  const returns = trades.map(t => t.pnl || 0);
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const negativeReturns = returns.filter(r => r < 0);
  if (negativeReturns.length === 0) return "∞"; // No downside
  const downsideDeviation = Math.sqrt(negativeReturns.map(x => Math.pow(x, 2)).reduce((a, b) => a + b) / returns.length);
  return downsideDeviation === 0 ? "∞" : (avgReturn / downsideDeviation).toFixed(2);
}

function calculateAvgHoldingTime(trades: Trade[]): string {
  const closedTrades = trades.filter(t => t.exitDate && t.exitTime && t.date && t.time);
  if (closedTrades.length === 0) return "N/A";

  let totalDurationMs = 0;
  for (const t of closedTrades) {
    const entry = new Date(`${t.date}T${t.time}`);
    const exit = new Date(`${t.exitDate}T${t.exitTime}`);
    totalDurationMs += (exit.getTime() - entry.getTime());
  }

  const avgMs = totalDurationMs / closedTrades.length;
  const hours = Math.floor(avgMs / (1000 * 60 * 60));
  const minutes = Math.floor((avgMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 24) return `${(hours/24).toFixed(1)}g`;
  return `${hours}h ${minutes}m`;
}
// --------------------------------------------------

function calculateStreaks(trades: Trade[]) {
    // (Existing Streak logic kept same)
  if (trades.length === 0) {
    return { currentStreak: 0, currentStreakType: "none", maxWinStreak: 0, maxLossStreak: 0 };
  }
  const sortedTrades = [...trades].sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());
  let maxWinStreak = 0, maxLossStreak = 0, currentWinStreak = 0, currentLossStreak = 0;
  for (const trade of sortedTrades) {
    const isWin = trade.result === "target" || trade.result === "parziale";
    const isLoss = trade.result === "stop_loss";
    if (isWin) { currentWinStreak++; currentLossStreak = 0; maxWinStreak = Math.max(maxWinStreak, currentWinStreak); } 
    else if (isLoss) { currentLossStreak++; currentWinStreak = 0; maxLossStreak = Math.max(maxLossStreak, currentLossStreak); } 
    else { currentWinStreak = 0; currentLossStreak = 0; }
  }
  const last = sortedTrades[sortedTrades.length - 1];
  const lastType = (last.result === "target" || last.result === "parziale") ? "win" : last.result === "stop_loss" ? "loss" : "none";
  return { currentStreak: lastType === "win" ? currentWinStreak : lastType === "loss" ? currentLossStreak : 0, currentStreakType: lastType as any, maxWinStreak, maxLossStreak };
}

function calculatePerformanceByDay(trades: Trade[]) {
    const days = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];
    return days.map((day, index) => {
      const dayTrades = trades.filter(t => new Date(t.date).getDay() === index);
      const wins = dayTrades.filter(t => t.result === "target" || t.result === "parziale").length;
      return { day, winRate: dayTrades.length > 0 ? (wins / dayTrades.length) * 100 : 0, count: dayTrades.length };
    });
}
function calculatePerformanceByHour(trades: Trade[]) {
    const hours = [];
    for (let h = 6; h <= 22; h++) {
        const hStr = h.toString().padStart(2, "0");
        const hTrades = trades.filter(t => t.time && parseInt(t.time.split(":")[0]) === h);
        const wins = hTrades.filter(t => t.result === "target" || t.result === "parziale").length;
        hours.push({ hour: `${hStr}:00`, winRate: hTrades.length > 0 ? (wins / hTrades.length) * 100 : 0, count: hTrades.length });
    }
    return hours;
}

export default function AdvancedMetrics({ trades }: AdvancedMetricsProps) {
  const { maxDrawdown, maxDrawdownPercent } = calculateMaxDrawdown(trades);
  const streaks = calculateStreaks(trades);
  const performanceByDay = calculatePerformanceByDay(trades);
  const performanceByHour = calculatePerformanceByHour(trades);
  const sharpe = calculateSharpeRatio(trades);
  const sortino = calculateSortinoRatio(trades);
  const avgHolding = calculateAvgHoldingTime(trades);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Drawdown Card */}
        <Card className="bg-red-900/20 border-red-900/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-5 h-5 text-red-400" />
              <span className="text-sm text-muted-foreground">Max Drawdown</span>
              <Tooltip><TooltipTrigger><Info className="w-3 h-3 text-muted-foreground" /></TooltipTrigger><TooltipContent><p className="max-w-48 text-xs">Massima perdita dal picco</p></TooltipContent></Tooltip>
            </div>
            <p className="text-2xl font-bold text-red-400 font-mono">-{maxDrawdownPercent}%</p>
            <p className="text-xs text-muted-foreground mt-1">{maxDrawdown.toFixed(2)} EUR</p>
          </CardContent>
        </Card>
        
        {/* NEW: Sharpe & Sortino */}
        <Card className="bg-blue-900/20 border-blue-900/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-blue-400" />
              <span className="text-sm text-muted-foreground">Ratios</span>
            </div>
            <div className="flex justify-between items-baseline">
                <div>
                    <span className="text-xs text-muted-foreground block">Sharpe</span>
                    <span className="text-xl font-bold text-blue-400 font-mono">{sharpe}</span>
                </div>
                <div>
                    <span className="text-xs text-muted-foreground block">Sortino</span>
                    <span className="text-xl font-bold text-blue-400 font-mono">{sortino}</span>
                </div>
            </div>
          </CardContent>
        </Card>

        {/* NEW: Holding Time */}
        <Card className="bg-purple-900/20 border-purple-900/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Timer className="w-5 h-5 text-purple-400" />
              <span className="text-sm text-muted-foreground">Avg Holding</span>
            </div>
            <p className="text-2xl font-bold text-purple-400 font-mono">{avgHolding}</p>
            <p className="text-xs text-muted-foreground mt-1">Tempo medio a mercato</p>
          </CardContent>
        </Card>

        {/* Streaks */}
        <Card className={streaks.currentStreakType === "win" ? "bg-emerald-900/20 border-emerald-900/30" : streaks.currentStreakType === "loss" ? "bg-red-900/20 border-red-900/30" : ""}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Flame className={`w-5 h-5 ${streaks.currentStreakType === "win" ? "text-emerald-400" : streaks.currentStreakType === "loss" ? "text-red-400" : "text-muted-foreground"}`} />
              <span className="text-sm text-muted-foreground">Streak</span>
            </div>
            <p className={`text-2xl font-bold font-mono ${streaks.currentStreakType === "win" ? "text-emerald-400" : streaks.currentStreakType === "loss" ? "text-red-400" : "text-muted-foreground"}`}>
              {streaks.currentStreak}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Max W: {streaks.maxWinStreak} | Max L: {streaks.maxLossStreak}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts (Day & Hour) */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><Calendar className="w-4 h-4" />Performance per Giorno</CardTitle></CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%"><BarChart data={performanceByDay} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}><XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} /><Bar dataKey="winRate" radius={[4, 4, 0, 0]}>{performanceByDay.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.winRate >= 50 ? "hsl(142, 71%, 45%)" : entry.count > 0 ? "hsl(0, 84%, 60%)" : "hsl(var(--muted))"} />))}</Bar></BarChart></ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><Clock className="w-4 h-4" />Performance per Orario</CardTitle></CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%"><BarChart data={performanceByHour} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}><XAxis dataKey="hour" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} interval={1} /><YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} /><Bar dataKey="winRate" radius={[4, 4, 0, 0]}>{performanceByHour.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.winRate >= 50 ? "hsl(142, 71%, 45%)" : entry.count > 0 ? "hsl(0, 84%, 60%)" : "hsl(var(--muted))"} />))}</Bar></BarChart></ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}