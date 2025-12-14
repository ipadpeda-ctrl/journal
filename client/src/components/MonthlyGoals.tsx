import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Loader2, Save, Target, TrendingUp, Percent, ChevronLeft, ChevronRight } from "lucide-react";
import type { Goal } from "@shared/schema";

const months = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
];

interface MonthlyGoalsProps {
  trades: { date: string; result: string; target?: number; stopLoss?: number }[];
}

export default function MonthlyGoals({ trades }: MonthlyGoalsProps) {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  
  const [targetTrades, setTargetTrades] = useState("");
  const [targetWinRate, setTargetWinRate] = useState("");
  const [targetProfit, setTargetProfit] = useState("");

  const { data: goals = [], isLoading } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
  });

  const currentGoal = goals.find((g) => g.month === selectedMonth && g.year === selectedYear);

  useEffect(() => {
    if (currentGoal) {
      setTargetTrades(currentGoal.targetTrades?.toString() || "");
      setTargetWinRate(currentGoal.targetWinRate?.toString() || "");
      setTargetProfit(currentGoal.targetProfit?.toString() || "");
    } else {
      setTargetTrades("");
      setTargetWinRate("");
      setTargetProfit("");
    }
  }, [currentGoal]);

  const monthlyTrades = useMemo(() => {
    const monthStr = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}`;
    return trades.filter((t) => t.date.startsWith(monthStr));
  }, [trades, selectedMonth, selectedYear]);

  const actualStats = useMemo(() => {
    const total = monthlyTrades.length;
    const wins = monthlyTrades.filter((t) => t.result === "target").length;
    const winRate = total > 0 ? (wins / total) * 100 : 0;
    let profit = 0;
    monthlyTrades.forEach((t) => {
      if (t.result === "target") profit += (t.target || 0) * 100;
      else if (t.result === "stop_loss") profit -= (t.stopLoss || 0) * 100;
      else if (t.result === "parziale") profit += (t.target || 0) * 50;
    });
    return { total, winRate, profit };
  }, [monthlyTrades]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/goals", {
        month: selectedMonth,
        year: selectedYear,
        targetTrades: parseInt(targetTrades) || null,
        targetWinRate: parseFloat(targetWinRate) || null,
        targetProfit: parseFloat(targetProfit) || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
    },
  });

  const handleMonthChange = (newMonth: number, newYear: number) => {
    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
    const goal = goals.find((g) => g.month === newMonth && g.year === newYear);
    if (goal) {
      setTargetTrades(goal.targetTrades?.toString() || "");
      setTargetWinRate(goal.targetWinRate?.toString() || "");
      setTargetProfit(goal.targetProfit?.toString() || "");
    } else {
      setTargetTrades("");
      setTargetWinRate("");
      setTargetProfit("");
    }
  };

  const navigateMonth = (direction: number) => {
    let newMonth = selectedMonth + direction;
    let newYear = selectedYear;
    if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    } else if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    }
    handleMonthChange(newMonth, newYear);
  };

  const calculateProgress = (actual: number, target: number | null) => {
    if (!target || target === 0) return 0;
    return Math.min((actual / target) * 100, 100);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const tradesProgress = calculateProgress(actualStats.total, currentGoal?.targetTrades || parseInt(targetTrades));
  const winRateProgress = calculateProgress(actualStats.winRate, currentGoal?.targetWinRate || parseFloat(targetWinRate));
  const profitProgress = calculateProgress(actualStats.profit, currentGoal?.targetProfit || parseFloat(targetProfit));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-chart-1" />
          <h2 className="text-xl font-semibold">Obiettivi Mensili</h2>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigateMonth(-1)}
                data-testid="button-prev-month"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-lg font-medium min-w-[160px] text-center">
                {months[selectedMonth - 1]} {selectedYear}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigateMonth(1)}
                data-testid="button-next-month"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              data-testid="button-save-goals"
            >
              {saveMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Salva Obiettivi
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="w-4 h-4" />
              Numero Trade
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Obiettivo</Label>
              <Input
                type="number"
                value={targetTrades}
                onChange={(e) => setTargetTrades(e.target.value)}
                placeholder="es. 20"
                data-testid="input-target-trades"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progresso</span>
                <span className="font-mono font-medium">
                  {actualStats.total} / {targetTrades || "-"}
                </span>
              </div>
              <Progress value={tradesProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Percent className="w-4 h-4" />
              Win Rate
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Obiettivo (%)</Label>
              <Input
                type="number"
                value={targetWinRate}
                onChange={(e) => setTargetWinRate(e.target.value)}
                placeholder="es. 60"
                min="0"
                max="100"
                data-testid="input-target-winrate"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Attuale</span>
                <span className="font-mono font-medium">
                  {actualStats.winRate.toFixed(1)}% / {targetWinRate || "-"}%
                </span>
              </div>
              <Progress value={winRateProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Profitto (EUR)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Obiettivo</Label>
              <Input
                type="number"
                value={targetProfit}
                onChange={(e) => setTargetProfit(e.target.value)}
                placeholder="es. 500"
                data-testid="input-target-profit"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Attuale</span>
                <span className={`font-mono font-medium ${actualStats.profit >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                  {actualStats.profit >= 0 ? "+" : ""}{actualStats.profit.toFixed(2)} / {targetProfit || "-"}
                </span>
              </div>
              <Progress value={profitProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Riepilogo Mese</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-md">
              <div className="text-2xl font-bold font-mono">{actualStats.total}</div>
              <div className="text-xs text-muted-foreground">Trade Totali</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-md">
              <div className="text-2xl font-bold font-mono">{monthlyTrades.filter(t => t.result === "target").length}</div>
              <div className="text-xs text-muted-foreground">Vincenti</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-md">
              <div className="text-2xl font-bold font-mono">{actualStats.winRate.toFixed(1)}%</div>
              <div className="text-xs text-muted-foreground">Win Rate</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-md">
              <div className={`text-2xl font-bold font-mono ${actualStats.profit >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                {actualStats.profit >= 0 ? "+" : ""}{actualStats.profit.toFixed(0)}
              </div>
              <div className="text-xs text-muted-foreground">P&L (EUR)</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
