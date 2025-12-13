import { useState } from "react";
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

const initialTrades: Trade[] = [
  { id: "1", date: "2024-12-07", time: "09:30", pair: "EURUSD", direction: "long", target: 1.75, stopLoss: 0.5, result: "target", emotion: "Fiducioso", confluencesPro: ["Trend forte", "Supporto testato"], confluencesContro: ["Notizie in arrivo"], imageUrls: [], notes: "" },
  { id: "2", date: "2024-12-08", time: "14:15", pair: "GBPUSD", direction: "short", target: 1.5, stopLoss: 0.75, result: "stop_loss", emotion: "FOMO", confluencesPro: ["Pattern chiaro"], confluencesContro: ["Contro trend", "Bassa liquidità"], imageUrls: [], notes: "" },
  { id: "3", date: "2024-12-09", time: "10:00", pair: "USDJPY", direction: "long", target: 2.0, stopLoss: 0.6, result: "breakeven", emotion: "Neutrale", confluencesPro: ["Volume alto", "Livello chiave"], confluencesContro: [], imageUrls: [], notes: "" },
  { id: "4", date: "2024-12-10", time: "16:45", pair: "EURUSD", direction: "short", target: 1.25, stopLoss: 0.4, result: "target", emotion: "Sicuro", confluencesPro: ["Trend forte", "Pattern chiaro", "Volume alto"], confluencesContro: ["Orario sfavorevole"], imageUrls: [], notes: "" },
  { id: "5", date: "2024-12-11", time: "11:20", pair: "XAUUSD", direction: "long", target: 3.0, stopLoss: 1.0, result: "target", emotion: "Fiducioso", confluencesPro: ["Trend forte", "Livello chiave"], confluencesContro: [], imageUrls: [], notes: "" },
  { id: "6", date: "2024-12-11", time: "15:30", pair: "GBPJPY", direction: "short", target: 2.5, stopLoss: 0.8, result: "parziale", emotion: "Neutrale", confluencesPro: ["Pattern chiaro", "Volume alto"], confluencesContro: ["Orario sfavorevole"], imageUrls: [], notes: "" },
  { id: "7", date: "2024-12-12", time: "09:00", pair: "USDCAD", direction: "long", target: 1.5, stopLoss: 0.5, result: "stop_loss", emotion: "Impaziente", confluencesPro: ["Supporto testato"], confluencesContro: ["Notizie in arrivo", "Pattern debole"], imageUrls: [], notes: "" },
  { id: "8", date: "2024-12-12", time: "14:00", pair: "EURUSD", direction: "long", target: 1.75, stopLoss: 0.5, result: "target", emotion: "Sicuro", confluencesPro: ["Trend forte", "Volume alto", "Livello chiave"], confluencesContro: [], imageUrls: [], notes: "" },
  { id: "9", date: "2024-12-13", time: "08:30", pair: "GBPUSD", direction: "short", target: 2.0, stopLoss: 0.6, result: "non_fillato", emotion: "Neutrale", confluencesPro: ["Pattern chiaro", "Trend forte"], confluencesContro: [], imageUrls: [], notes: "" },
  { id: "10", date: "2024-12-13", time: "11:45", pair: "USDJPY", direction: "long", target: 1.8, stopLoss: 0.5, result: "parziale", emotion: "Fiducioso", confluencesPro: ["Livello chiave", "Volume alto"], confluencesContro: ["Orario sfavorevole"], imageUrls: [], notes: "" },
];

const defaultPairs = ["EURUSD", "GBPUSD", "USDJPY", "USDCAD", "AUDUSD", "XAUUSD", "GBPJPY", "EURJPY"];
const defaultEmotions = ["Neutrale", "FOMO", "Rabbia", "Vendetta", "Speranza", "Fiducioso", "Impaziente", "Paura", "Sicuro", "Stress"];
const defaultConfluencesPro = ["Trend forte", "Supporto testato", "Volume alto", "Pattern chiaro", "Livello chiave"];
const defaultConfluencesContro = ["Notizie in arrivo", "Pattern debole", "Contro trend", "Bassa liquidità", "Orario sfavorevole"];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("new-entry");
  const [trades, setTrades] = useState<Trade[]>(initialTrades);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);

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
      setTrades((prev) =>
        prev.map((t) =>
          t.id === editingTrade.id
            ? {
                ...t,
                date: formData.date,
                time: formData.time,
                pair: formData.pair,
                direction: formData.direction,
                target: parseFloat(formData.target) || 0,
                stopLoss: parseFloat(formData.stopLoss) || 0,
                result: formData.result,
                emotion: formData.emotion,
                confluencesPro: formData.confluencesPro,
                confluencesContro: formData.confluencesContro,
                imageUrls: formData.imageUrls,
                notes: formData.notes,
              }
            : t
        )
      );
      setEditingTrade(null);
      setActiveTab("operations");
    } else {
      const newTrade: Trade = {
        id: Date.now().toString(),
        date: formData.date,
        time: formData.time,
        pair: formData.pair,
        direction: formData.direction,
        target: parseFloat(formData.target) || 0,
        stopLoss: parseFloat(formData.stopLoss) || 0,
        result: formData.result,
        emotion: formData.emotion,
        confluencesPro: formData.confluencesPro,
        confluencesContro: formData.confluencesContro,
        imageUrls: formData.imageUrls,
        notes: formData.notes,
      };
      setTrades((prev) => [...prev, newTrade]);
      setActiveTab("operations");
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
    setTrades((prev) => prev.filter((t) => t.id !== id));
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
