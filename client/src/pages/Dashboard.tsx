import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import Header, { Tab } from "@/components/Header";
import StatCard from "@/components/StatCard";
import TradeForm, { TradeFormData } from "@/components/TradeForm";
import TradesTable, { Trade } from "@/components/TradesTable";
import TradeDetailModal from "@/components/TradeDetailModal";
import {
  EquityCurveChart,
} from "@/components/Charts";
import Settings from "@/components/Settings";
import Calendar from "@/components/Calendar";
import WeeklyRecap from "@/components/WeeklyRecap";
import ResultBreakdownCard from "@/components/ResultBreakdownCard";
import MoodTracker from "@/components/MoodTracker";
import ConfluenceStats from "@/components/ConfluenceStats";
import MetricsCards from "@/components/MetricsCards";
import { PerformanceByPair, TradeCountDonut, DirectionBreakdown } from "@/components/PerformanceCharts";
import EquityProjection from "@/components/EquityProjection";
import RiskOfRuinTable from "@/components/RiskOfRuinTable";
import AdvancedMetrics from "@/components/AdvancedMetrics";
import MonthlyComparison from "@/components/MonthlyComparison";
import TradingDiary from "@/components/TradingDiary";
import MonthlyGoals from "@/components/MonthlyGoals";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Download, Filter, X, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Trade as SchemaTrade } from "@shared/schema";

const defaultPairs = ["EURUSD", "GBPUSD", "USDJPY", "USDCAD", "AUDUSD", "XAUUSD", "GBPJPY", "EURJPY"];
const defaultEmotions = ["Neutrale", "FOMO", "Rabbia", "Vendetta", "Speranza", "Fiducioso", "Impaziente", "Paura", "Sicuro", "Stress"];
const defaultConfluencesPro = ["Trend forte", "Supporto testato", "Volume alto", "Pattern chiaro", "Livello chiave"];
const defaultConfluencesContro = ["Notizie in arrivo", "Pattern debole", "Contro trend", "Bassa liquidità", "Orario sfavorevole"];

function mapSchemaTradeToTrade(t: SchemaTrade): Trade {
  return {
    id: t.id.toString(),
    date: t.date,
    time: t.time || "",
    pair: t.pair,
    direction: t.direction as "long" | "short",
    target: t.target || 0,
    stopLoss: t.stopLoss || 0,
    result: t.result as Trade["result"],
    pnl: t.pnl || 0,
    emotion: t.emotion || "",
    confluencesPro: t.confluencesPro || [],
    confluencesContro: t.confluencesContro || [],
    imageUrls: t.imageUrls || [],
    notes: t.notes || "",
  };
}

function exportTradesToCSV(trades: Trade[]) {
  const headers = ["Data", "Ora", "Coppia", "Direzione", "Target", "Stop Loss", "Risultato", "P&L", "Emozione", "Confluenze Pro", "Confluenze Contro", "Note"];
  const rows = trades.map(t => [
    t.date,
    t.time,
    t.pair,
    t.direction === "long" ? "Long" : "Short",
    t.target.toFixed(5),
    t.stopLoss.toFixed(5),
    t.result,
    (t.pnl || 0).toFixed(2),
    t.emotion,
    t.confluencesPro.join("; "),
    t.confluencesContro.join("; "),
    t.notes.replace(/"/g, '""'),
  ]);
  
  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
  ].join("\n");
  
  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `trades_export_${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function Dashboard() {
  const { user } = useAuth();
  const initialCapital = user?.initialCapital ?? 10000;
  
  const [activeTab, setActiveTab] = useState<Tab>("new-entry");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  const { data: schemaTrades = [], isLoading } = useQuery<SchemaTrade[]>({
    queryKey: ["/api/trades"],
  });

  const trades: Trade[] = schemaTrades.map(mapSchemaTradeToTrade);

  const filteredTrades = useMemo(() => {
    if (!filterStartDate && !filterEndDate) {
      return trades;
    }
    return trades.filter((trade) => {
      const tradeDate = trade.date;
      if (filterStartDate && tradeDate < filterStartDate) return false;
      if (filterEndDate && tradeDate > filterEndDate) return false;
      return true;
    });
  }, [trades, filterStartDate, filterEndDate]);

  const isFiltered = filterStartDate || filterEndDate;

  const clearFilters = () => {
    setFilterStartDate("");
    setFilterEndDate("");
  };

  const createTradeMutation = useMutation({
    mutationFn: async (data: TradeFormData) => {
      return apiRequest("POST", "/api/trades", {
        date: data.date,
        time: data.time,
        pair: data.pair,
        direction: data.direction,
        target: parseFloat(data.target) || 0,
        stopLoss: parseFloat(data.stopLoss) || 0,
        result: data.result,
        emotion: data.emotion,
        confluencesPro: data.confluencesPro,
        confluencesContro: data.confluencesContro,
        imageUrls: data.imageUrls,
        notes: data.notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
    },
  });

  const updateTradeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TradeFormData }) => {
      return apiRequest("PATCH", `/api/trades/${id}`, {
        date: data.date,
        time: data.time,
        pair: data.pair,
        direction: data.direction,
        target: parseFloat(data.target) || 0,
        stopLoss: parseFloat(data.stopLoss) || 0,
        result: data.result,
        emotion: data.emotion,
        confluencesPro: data.confluencesPro,
        confluencesContro: data.confluencesContro,
        imageUrls: data.imageUrls,
        notes: data.notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
    },
  });

  const deleteTradeMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/trades/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
    },
  });

  const stats = useMemo(() => ({
    totalOperations: filteredTrades.length,
    winRate: filteredTrades.length > 0
      ? ((filteredTrades.filter((t) => t.result === "target").length / filteredTrades.length) * 100).toFixed(1)
      : "0",
    profitFactor: calculateProfitFactor(filteredTrades),
    totalEquity: calculateEquity(filteredTrades, initialCapital),
  }), [filteredTrades, initialCapital]);

  const equityData = useMemo(() => calculateEquityCurve(filteredTrades, initialCapital), [filteredTrades, initialCapital]);

  const handleSubmitTrade = (formData: TradeFormData) => {
    if (editingTrade) {
      updateTradeMutation.mutate(
        { id: editingTrade.id, data: formData },
        {
          onSuccess: () => {
            setEditingTrade(null);
            setActiveTab("operations");
          },
        }
      );
    } else {
      createTradeMutation.mutate(formData, {
        onSuccess: () => {
          setActiveTab("operations");
        },
      });
    }
  };

  const handleEditTrade = (trade: Trade) => {
    setEditingTrade(trade);
    setIsDetailModalOpen(false);
    setActiveTab("new-entry");
  };

  const handleCancelEdit = () => {
    setEditingTrade(null);
  };

  const handleRowClick = (trade: Trade) => {
    setSelectedTrade(trade);
    setIsDetailModalOpen(true);
  };

  const handleDeleteTrade = (id: string) => {
    deleteTradeMutation.mutate(id);
    if (editingTrade?.id === id) {
      setEditingTrade(null);
    }
  };

  // Calculate result breakdown data
  const resultBreakdownData = useMemo(() => ({
    target: {
      total: filteredTrades.filter((t) => t.result === "target").length,
      long: filteredTrades.filter((t) => t.result === "target" && t.direction === "long").length,
      short: filteredTrades.filter((t) => t.result === "target" && t.direction === "short").length,
    },
    stopLoss: {
      total: filteredTrades.filter((t) => t.result === "stop_loss").length,
      long: filteredTrades.filter((t) => t.result === "stop_loss" && t.direction === "long").length,
      short: filteredTrades.filter((t) => t.result === "stop_loss" && t.direction === "short").length,
    },
    breakeven: {
      total: filteredTrades.filter((t) => t.result === "breakeven").length,
      long: filteredTrades.filter((t) => t.result === "breakeven" && t.direction === "long").length,
      short: filteredTrades.filter((t) => t.result === "breakeven" && t.direction === "short").length,
    },
    parziale: {
      total: filteredTrades.filter((t) => t.result === "parziale").length,
      long: filteredTrades.filter((t) => t.result === "parziale" && t.direction === "long").length,
      short: filteredTrades.filter((t) => t.result === "parziale" && t.direction === "short").length,
    },
  }), [filteredTrades]);

  // Calculate metrics
  const metricsData = useMemo(() => calculateMetrics(filteredTrades), [filteredTrades]);

  // Calculate mood data
  const moodData = useMemo(() => calculateMoodData(filteredTrades), [filteredTrades]);

  // Calculate confluence stats
  const { confluencesPro, confluencesContro } = useMemo(() => calculateConfluenceStats(filteredTrades), [filteredTrades]);

  // Calculate performance by pair
  const performanceByPair = useMemo(() => calculatePerformanceByPair(filteredTrades), [filteredTrades]);

  // Calculate direction breakdown
  const directionBreakdown = useMemo(() => ({
    longWins: filteredTrades.filter((t) => t.direction === "long" && t.result === "target").length,
    longLosses: filteredTrades.filter((t) => t.direction === "long" && t.result === "stop_loss").length,
    shortWins: filteredTrades.filter((t) => t.direction === "short" && t.result === "target").length,
    shortLosses: filteredTrades.filter((t) => t.direction === "short" && t.result === "stop_loss").length,
  }), [filteredTrades]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === "statistiche" && (
          <div className="space-y-6">
            {/* Filter Bar */}
            <Card className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Filtra per periodo:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="filterStart" className="text-xs text-muted-foreground">Da:</Label>
                    <Input
                      id="filterStart"
                      type="date"
                      value={filterStartDate}
                      onChange={(e) => setFilterStartDate(e.target.value)}
                      className="h-8 w-36 text-xs"
                      data-testid="input-filter-start-date"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="filterEnd" className="text-xs text-muted-foreground">A:</Label>
                    <Input
                      id="filterEnd"
                      type="date"
                      value={filterEndDate}
                      onChange={(e) => setFilterEndDate(e.target.value)}
                      className="h-8 w-36 text-xs"
                      data-testid="input-filter-end-date"
                    />
                  </div>
                  {isFiltered && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="h-8"
                      data-testid="button-clear-filters"
                    >
                      <X className="w-3 h-3 mr-1" />
                      Rimuovi filtri
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {isFiltered && (
                    <span className="text-xs text-muted-foreground">
                      Mostrati {filteredTrades.length} di {trades.length} trade
                    </span>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => exportTradesToCSV(filteredTrades)}
                    disabled={filteredTrades.length === 0}
                    data-testid="button-export-csv"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Esporta CSV
                  </Button>
                </div>
              </div>
            </Card>

            {/* Row 1: Direction Breakdown + Win Rate + Risultato Finale */}
            <div className="grid lg:grid-cols-3 gap-6">
              <DirectionBreakdown trades={filteredTrades} />
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Win Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold" data-testid="text-winrate-value">{stats.winRate}%</div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {filteredTrades.filter((t) => t.result === "target").length} vincenti su {filteredTrades.length} totali
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Risultato Finale</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${parseFloat(stats.totalEquity) >= initialCapital ? "text-emerald-500" : "text-red-500"}`} data-testid="text-equity-value">
                    {parseFloat(stats.totalEquity) >= initialCapital ? "+" : ""}{(parseFloat(stats.totalEquity) - initialCapital).toFixed(2)} EUR
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Equity totale: {stats.totalEquity} EUR
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Row 2: Trade Count Donut + Performance by Pair */}
            <div className="grid lg:grid-cols-2 gap-6">
              <TradeCountDonut trades={filteredTrades} />
              <PerformanceByPair trades={filteredTrades} />
            </div>

            {/* Row 3: Metrics Cards */}
            <MetricsCards trades={filteredTrades} />

            {/* Row 3.5: Advanced Metrics - Drawdown, Streaks, Performance by Day/Hour */}
            <AdvancedMetrics trades={filteredTrades} />

            {/* Row 3.6: Monthly Comparison */}
            <MonthlyComparison trades={filteredTrades} initialCapital={initialCapital} />

            {/* Row 4: Result Breakdown Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <ResultBreakdownCard
                title="Take Profit"
                result="target"
                trades={filteredTrades}
                color="hsl(142, 71%, 45%)"
              />
              <ResultBreakdownCard
                title="Stop Loss"
                result="stop_loss"
                trades={filteredTrades}
                color="hsl(0, 84%, 60%)"
              />
              <ResultBreakdownCard
                title="Breakeven"
                result="breakeven"
                trades={filteredTrades}
                color="hsl(45, 93%, 47%)"
              />
              <ResultBreakdownCard
                title="Parziali"
                result="parziale"
                trades={filteredTrades}
                color="hsl(217, 91%, 60%)"
              />
            </div>

            {/* Row 5: Mood Tracker */}
            <MoodTracker trades={filteredTrades} />

            {/* Row 6: Confluence Stats */}
            <div className="grid lg:grid-cols-2 gap-6">
              <ConfluenceStats trades={filteredTrades} type="pro" />
              <ConfluenceStats trades={filteredTrades} type="contro" />
            </div>

            {/* Row 7: Equity Projection + Risk of Ruin */}
            <div className="grid lg:grid-cols-2 gap-6">
              <EquityProjection trades={filteredTrades} initialCapital={initialCapital} />
              <RiskOfRuinTable trades={filteredTrades} />
            </div>

            {/* Row 8: Equity Curve */}
            <EquityCurveChart data={equityData} />
          </div>
        )}

        {activeTab === "calendario" && (
          <div className="flex gap-6">
            <div className="flex-1">
              <Calendar trades={trades} />
            </div>
            <div className="w-80 flex-shrink-0">
              <WeeklyRecap trades={trades} currentDate={selectedDate} />
            </div>
          </div>
        )}

        {activeTab === "operations" && (
          <>
            <TradesTable
              trades={trades}
              onEdit={handleEditTrade}
              onDelete={handleDeleteTrade}
              onRowClick={handleRowClick}
            />
            <TradeDetailModal
              trade={selectedTrade}
              open={isDetailModalOpen}
              onOpenChange={setIsDetailModalOpen}
              onEdit={handleEditTrade}
              onDelete={handleDeleteTrade}
            />
          </>
        )}

        {activeTab === "new-entry" && (
          <TradeForm
            onSubmit={handleSubmitTrade}
            onDuplicate={() => console.log("Duplicate")}
            editingTrade={editingTrade ? {
              id: editingTrade.id,
              date: editingTrade.date,
              time: editingTrade.time,
              pair: editingTrade.pair,
              direction: editingTrade.direction,
              target: editingTrade.target.toString(),
              stopLoss: editingTrade.stopLoss.toString(),
              result: editingTrade.result,
              emotion: editingTrade.emotion,
              confluencesPro: editingTrade.confluencesPro,
              confluencesContro: editingTrade.confluencesContro,
              imageUrls: editingTrade.imageUrls,
              notes: editingTrade.notes,
            } : undefined}
            onCancelEdit={handleCancelEdit}
          />
        )}

        {activeTab === "settings" && (
          <Settings
            pairs={defaultPairs}
            emotions={defaultEmotions}
            confluencesPro={defaultConfluencesPro}
            confluencesContro={defaultConfluencesContro}
            initialCapital={initialCapital}
            onSave={(settings) => console.log("Settings saved:", settings)}
          />
        )}

        {activeTab === "diary" && <TradingDiary />}

        {activeTab === "goals" && (
          <MonthlyGoals
            trades={trades.map((t) => ({
              date: t.date,
              result: t.result,
              target: t.target,
              stopLoss: t.stopLoss,
            }))}
          />
        )}
      </main>
    </div>
  );
}

function calculateProfitFactor(trades: Trade[]): string {
  const wins = trades.filter((t) => t.result === "target");
  const losses = trades.filter((t) => t.result === "stop_loss");
  
  const totalWins = wins.reduce((sum, t) => sum + t.target, 0);
  const totalLosses = losses.reduce((sum, t) => sum + t.stopLoss, 0);
  
  if (totalLosses === 0) return totalWins > 0 ? "∞" : "0.00";
  return (totalWins / totalLosses).toFixed(2);
}

function calculateEquity(trades: Trade[], initialCapital: number = 10000): string {
  let equity = initialCapital;
  for (const trade of trades) {
    if (trade.result === "target") {
      equity += trade.target * 100;
    } else if (trade.result === "stop_loss") {
      equity -= trade.stopLoss * 100;
    } else if (trade.result === "parziale") {
      equity += (trade.target * 0.5) * 100;
    }
  }
  return equity.toFixed(2);
}

function calculateEquityCurve(trades: Trade[], initialCapital: number = 10000): { date: string; equity: number }[] {
  const sortedTrades = [...trades].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time}`);
    const dateB = new Date(`${b.date}T${b.time}`);
    return dateA.getTime() - dateB.getTime();
  });

  let equity = initialCapital;
  const curve = [{ date: "Start", equity }];

  for (const trade of sortedTrades) {
    if (trade.result === "target") {
      equity += trade.target * 100;
    } else if (trade.result === "stop_loss") {
      equity -= trade.stopLoss * 100;
    } else if (trade.result === "parziale") {
      equity += (trade.target * 0.5) * 100;
    }
    curve.push({
      date: trade.date.slice(5),
      equity,
    });
  }

  return curve;
}

function calculateMetrics(trades: Trade[]) {
  const wins = trades.filter((t) => t.result === "target");
  const losses = trades.filter((t) => t.result === "stop_loss");
  const partials = trades.filter((t) => t.result === "parziale");
  
  const totalWins = wins.reduce((sum, t) => sum + t.target, 0);
  const totalLosses = losses.reduce((sum, t) => sum + t.stopLoss, 0);
  const totalPartials = partials.reduce((sum, t) => sum + t.target * 0.5, 0);
  
  const profitFactor = totalLosses > 0 ? (totalWins + totalPartials) / totalLosses : 0;
  
  const avgWin = wins.length > 0 ? totalWins / wins.length : 0;
  const avgLoss = losses.length > 0 ? totalLosses / losses.length : 0;
  const riskReward = avgLoss > 0 ? avgWin / avgLoss : 0;
  
  const winRate = trades.length > 0 ? (wins.length + partials.length * 0.5) / trades.length : 0;
  const expectancy = (winRate * avgWin) - ((1 - winRate) * avgLoss);

  return {
    profitFactor: profitFactor.toFixed(2),
    riskReward: riskReward.toFixed(2),
    expectancy: expectancy.toFixed(2),
    avgLoss: avgLoss.toFixed(2),
  };
}

function calculateMoodData(trades: Trade[]) {
  const allEmotions = ["FOMO", "Rabbia", "Neutrale", "Vendetta", "Speranza", "Fiducioso", "Impaziente", "Paura", "Sicuro", "Stress"];
  
  return allEmotions.map((emotion) => {
    const emotionTrades = trades.filter((t) => t.emotion === emotion);
    const count = emotionTrades.length;
    const wins = emotionTrades.filter((t) => t.result === "target").length;
    const winRate = count > 0 ? (wins / count) * 100 : 0;
    
    return {
      emotion,
      count,
      winRate,
    };
  });
}

function calculateConfluenceStats(trades: Trade[]) {
  const allConfluencesPro = ["Trend forte", "Supporto testato", "Volume alto", "Pattern chiaro", "Livello chiave"];
  const allConfluencesContro = ["Notizie in arrivo", "Pattern debole", "Contro trend", "Bassa liquidità", "Orario sfavorevole"];
  
  const confluencesPro = allConfluencesPro.map((conf) => {
    const confTrades = trades.filter((t) => t.confluencesPro.includes(conf));
    const count = confTrades.length;
    const wins = confTrades.filter((t) => t.result === "target").length;
    const losses = confTrades.filter((t) => t.result === "stop_loss").length;
    const winRate = count > 0 ? (wins / count) * 100 : 0;
    
    return {
      name: conf,
      count,
      wins,
      losses,
      winRate,
    };
  });
  
  const confluencesContro = allConfluencesContro.map((conf) => {
    const confTrades = trades.filter((t) => t.confluencesContro.includes(conf));
    const count = confTrades.length;
    const wins = confTrades.filter((t) => t.result === "target").length;
    const losses = confTrades.filter((t) => t.result === "stop_loss").length;
    const winRate = count > 0 ? (wins / count) * 100 : 0;
    
    return {
      name: conf,
      count,
      wins,
      losses,
      winRate,
    };
  });

  return { confluencesPro, confluencesContro };
}

function calculatePerformanceByPair(trades: Trade[]) {
  const pairs = Array.from(new Set(trades.map((t) => t.pair)));
  
  return pairs.map((pair) => {
    const pairTrades = trades.filter((t) => t.pair === pair);
    const wins = pairTrades.filter((t) => t.result === "target").length;
    const losses = pairTrades.filter((t) => t.result === "stop_loss").length;
    const pnl = pairTrades.reduce((sum, t) => {
      if (t.result === "target") return sum + t.target;
      if (t.result === "stop_loss") return sum - t.stopLoss;
      if (t.result === "parziale") return sum + t.target * 0.5;
      return sum;
    }, 0);
    
    return {
      pair,
      trades: pairTrades.length,
      wins,
      losses,
      pnl: pnl * 100,
    };
  });
}
