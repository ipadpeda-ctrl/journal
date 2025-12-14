import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
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
    emotion: t.emotion || "",
    confluencesPro: t.confluencesPro || [],
    confluencesContro: t.confluencesContro || [],
    imageUrls: t.imageUrls || [],
    notes: t.notes || "",
  };
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("new-entry");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);

  const { data: schemaTrades = [], isLoading } = useQuery<SchemaTrade[]>({
    queryKey: ["/api/trades"],
  });

  const trades: Trade[] = schemaTrades.map(mapSchemaTradeToTrade);

  const createTradeMutation = useMutation({
    mutationFn: async (data: TradeFormData) => {
      return apiRequest("/api/trades", {
        method: "POST",
        body: JSON.stringify({
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
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
    },
  });

  const updateTradeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TradeFormData }) => {
      return apiRequest(`/api/trades/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
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
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
    },
  });

  const deleteTradeMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/trades/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
    },
  });

  const stats = {
    totalOperations: trades.length,
    winRate: trades.length > 0
      ? ((trades.filter((t) => t.result === "target").length / trades.length) * 100).toFixed(1)
      : "0",
    profitFactor: calculateProfitFactor(trades),
    totalEquity: calculateEquity(trades),
  };

  const equityData = calculateEquityCurve(trades);

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
  const resultBreakdownData = {
    target: {
      total: trades.filter((t) => t.result === "target").length,
      long: trades.filter((t) => t.result === "target" && t.direction === "long").length,
      short: trades.filter((t) => t.result === "target" && t.direction === "short").length,
    },
    stopLoss: {
      total: trades.filter((t) => t.result === "stop_loss").length,
      long: trades.filter((t) => t.result === "stop_loss" && t.direction === "long").length,
      short: trades.filter((t) => t.result === "stop_loss" && t.direction === "short").length,
    },
    breakeven: {
      total: trades.filter((t) => t.result === "breakeven").length,
      long: trades.filter((t) => t.result === "breakeven" && t.direction === "long").length,
      short: trades.filter((t) => t.result === "breakeven" && t.direction === "short").length,
    },
    parziale: {
      total: trades.filter((t) => t.result === "parziale").length,
      long: trades.filter((t) => t.result === "parziale" && t.direction === "long").length,
      short: trades.filter((t) => t.result === "parziale" && t.direction === "short").length,
    },
  };

  // Calculate metrics
  const metricsData = calculateMetrics(trades);

  // Calculate mood data
  const moodData = calculateMoodData(trades);

  // Calculate confluence stats
  const { confluencesPro, confluencesContro } = calculateConfluenceStats(trades);

  // Calculate performance by pair
  const performanceByPair = calculatePerformanceByPair(trades);

  // Calculate direction breakdown
  const directionBreakdown = {
    longWins: trades.filter((t) => t.direction === "long" && t.result === "target").length,
    longLosses: trades.filter((t) => t.direction === "long" && t.result === "stop_loss").length,
    shortWins: trades.filter((t) => t.direction === "short" && t.result === "target").length,
    shortLosses: trades.filter((t) => t.direction === "short" && t.result === "stop_loss").length,
  };

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
            {/* Row 1: Direction Breakdown + Win Rate + Risultato Finale */}
            <div className="grid lg:grid-cols-3 gap-6">
              <DirectionBreakdown trades={trades} />
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Win Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold" data-testid="text-winrate-value">{stats.winRate}%</div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {trades.filter((t) => t.result === "target").length} vincenti su {trades.length} totali
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Risultato Finale</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${parseFloat(stats.totalEquity) >= 1000 ? "text-emerald-500" : "text-red-500"}`} data-testid="text-equity-value">
                    {parseFloat(stats.totalEquity) >= 1000 ? "+" : ""}{(parseFloat(stats.totalEquity) - 1000).toFixed(2)} EUR
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Equity totale: {stats.totalEquity} EUR
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Row 2: Trade Count Donut + Performance by Pair */}
            <div className="grid lg:grid-cols-2 gap-6">
              <TradeCountDonut trades={trades} />
              <PerformanceByPair trades={trades} />
            </div>

            {/* Row 3: Metrics Cards */}
            <MetricsCards trades={trades} />

            {/* Row 4: Result Breakdown Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <ResultBreakdownCard
                title="Take Profit"
                result="target"
                trades={trades}
                color="hsl(142, 71%, 45%)"
              />
              <ResultBreakdownCard
                title="Stop Loss"
                result="stop_loss"
                trades={trades}
                color="hsl(0, 84%, 60%)"
              />
              <ResultBreakdownCard
                title="Breakeven"
                result="breakeven"
                trades={trades}
                color="hsl(45, 93%, 47%)"
              />
              <ResultBreakdownCard
                title="Parziali"
                result="parziale"
                trades={trades}
                color="hsl(217, 91%, 60%)"
              />
            </div>

            {/* Row 5: Mood Tracker */}
            <MoodTracker trades={trades} />

            {/* Row 6: Confluence Stats */}
            <div className="grid lg:grid-cols-2 gap-6">
              <ConfluenceStats trades={trades} type="pro" />
              <ConfluenceStats trades={trades} type="contro" />
            </div>

            {/* Row 7: Equity Projection + Risk of Ruin */}
            <div className="grid lg:grid-cols-2 gap-6">
              <EquityProjection trades={trades} />
              <RiskOfRuinTable trades={trades} />
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
            onSave={(settings) => console.log("Settings saved:", settings)}
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

function calculateEquity(trades: Trade[]): string {
  let equity = 1000;
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

function calculateEquityCurve(trades: Trade[]): { date: string; equity: number }[] {
  const sortedTrades = [...trades].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time}`);
    const dateB = new Date(`${b.date}T${b.time}`);
    return dateA.getTime() - dateB.getTime();
  });

  let equity = 1000;
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
