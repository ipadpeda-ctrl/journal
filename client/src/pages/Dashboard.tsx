import { useState } from "react";
import Header, { Tab } from "@/components/Header";
import StatCard from "@/components/StatCard";
import TradeForm, { TradeFormData } from "@/components/TradeForm";
import TradesTable, { Trade } from "@/components/TradesTable";
import {
  TradeDistributionChart,
  DirectionChart,
  WinRateChart,
  EquityCurveChart,
  EmotionalFrequencyChart,
} from "@/components/Charts";
import Settings from "@/components/Settings";

// todo: remove mock functionality
const initialTrades: Trade[] = [
  {
    id: "1",
    date: "2024-12-07",
    time: "09:30",
    pair: "EURUSD",
    direction: "long",
    target: 1.75,
    stopLoss: 0.5,
    result: "target",
    emotion: "Fiducioso",
    confluencesPro: ["Trend forte", "Supporto testato"],
    confluencesContro: ["Notizie in arrivo"],
  },
  {
    id: "2",
    date: "2024-12-08",
    time: "14:15",
    pair: "GBPUSD",
    direction: "short",
    target: 1.5,
    stopLoss: 0.75,
    result: "stop_loss",
    emotion: "FOMO",
    confluencesPro: ["Pattern chiaro"],
    confluencesContro: ["Contro trend", "Bassa liquidità"],
  },
  {
    id: "3",
    date: "2024-12-09",
    time: "10:00",
    pair: "USDJPY",
    direction: "long",
    target: 2.0,
    stopLoss: 0.6,
    result: "breakeven",
    emotion: "Neutrale",
    confluencesPro: ["Volume alto", "Livello chiave"],
    confluencesContro: [],
  },
  {
    id: "4",
    date: "2024-12-10",
    time: "16:45",
    pair: "EURUSD",
    direction: "short",
    target: 1.25,
    stopLoss: 0.4,
    result: "target",
    emotion: "Sicuro",
    confluencesPro: ["Trend forte", "Pattern chiaro", "Volume alto"],
    confluencesContro: ["Orario sfavorevole"],
  },
  {
    id: "5",
    date: "2024-12-11",
    time: "11:20",
    pair: "XAUUSD",
    direction: "long",
    target: 3.0,
    stopLoss: 1.0,
    result: "target",
    emotion: "Fiducioso",
    confluencesPro: ["Trend forte", "Livello chiave"],
    confluencesContro: [],
  },
  {
    id: "6",
    date: "2024-12-11",
    time: "15:30",
    pair: "GBPJPY",
    direction: "short",
    target: 2.5,
    stopLoss: 0.8,
    result: "target",
    emotion: "Neutrale",
    confluencesPro: ["Pattern chiaro", "Volume alto"],
    confluencesContro: ["Orario sfavorevole"],
  },
  {
    id: "7",
    date: "2024-12-12",
    time: "09:00",
    pair: "USDCAD",
    direction: "long",
    target: 1.5,
    stopLoss: 0.5,
    result: "stop_loss",
    emotion: "Impaziente",
    confluencesPro: ["Supporto testato"],
    confluencesContro: ["Notizie in arrivo", "Pattern debole"],
  },
  {
    id: "8",
    date: "2024-12-12",
    time: "14:00",
    pair: "EURUSD",
    direction: "long",
    target: 1.75,
    stopLoss: 0.5,
    result: "target",
    emotion: "Sicuro",
    confluencesPro: ["Trend forte", "Volume alto", "Livello chiave"],
    confluencesContro: [],
  },
];

const defaultPairs = ["EURUSD", "GBPUSD", "USDJPY", "USDCAD", "AUDUSD", "XAUUSD", "GBPJPY", "EURJPY"];
const defaultEmotions = ["Neutrale", "FOMO", "Rabbia", "Vendetta", "Speranza", "Fiducioso", "Impaziente", "Paura", "Sicuro", "Stress"];
const defaultConfluencesPro = ["Trend forte", "Supporto testato", "Volume alto", "Pattern chiaro", "Livello chiave"];
const defaultConfluencesContro = ["Notizie in arrivo", "Pattern debole", "Contro trend", "Bassa liquidità", "Orario sfavorevole"];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [trades, setTrades] = useState<Trade[]>(initialTrades);

  const stats = {
    totalOperations: trades.length,
    winRate: trades.length > 0
      ? ((trades.filter((t) => t.result === "target").length / trades.length) * 100).toFixed(1)
      : "0",
    profitFactor: calculateProfitFactor(trades),
    totalEquity: calculateEquity(trades),
  };

  const tradeDistribution = {
    target: trades.filter((t) => t.result === "target").length,
    stopLoss: trades.filter((t) => t.result === "stop_loss").length,
    breakeven: trades.filter((t) => t.result === "breakeven").length,
  };

  const directionData = {
    long: trades.filter((t) => t.direction === "long").length,
    short: trades.filter((t) => t.direction === "short").length,
  };

  const winRateData = {
    wins: trades.filter((t) => t.result === "target").length,
    losses: trades.filter((t) => t.result === "stop_loss").length,
  };

  const equityData = calculateEquityCurve(trades);

  const emotionData = calculateEmotionFrequency(trades);

  const handleSubmitTrade = (formData: TradeFormData) => {
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
    };
    setTrades((prev) => [...prev, newTrade]);
    setActiveTab("operations");
  };

  const handleDeleteTrade = (id: string) => {
    setTrades((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="min-h-screen bg-background">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Operazioni Totali" value={stats.totalOperations} />
              <StatCard
                label="Win Rate"
                value={`${stats.winRate}%`}
                trend={parseFloat(stats.winRate) >= 50 ? "up" : "down"}
              />
              <StatCard
                label="Profit Factor"
                value={stats.profitFactor}
                trend={parseFloat(stats.profitFactor) >= 1 ? "up" : "down"}
              />
              <StatCard label="Equity Totale" value={stats.totalEquity} subValue="EUR" />
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              <TradeDistributionChart data={tradeDistribution} />
              <DirectionChart data={directionData} />
              <WinRateChart data={winRateData} />
            </div>

            <EquityCurveChart data={equityData} />

            <EmotionalFrequencyChart data={emotionData} />
          </div>
        )}

        {activeTab === "operations" && (
          <TradesTable
            trades={trades}
            onEdit={(trade) => console.log("Edit:", trade)}
            onDelete={handleDeleteTrade}
          />
        )}

        {activeTab === "new-entry" && (
          <TradeForm onSubmit={handleSubmitTrade} onDuplicate={() => console.log("Duplicate")} />
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
    }
    curve.push({
      date: trade.date.slice(5),
      equity,
    });
  }

  return curve;
}

function calculateEmotionFrequency(trades: Trade[]): { emotion: string; count: number }[] {
  const emotionCounts: Record<string, number> = {};
  
  for (const trade of trades) {
    emotionCounts[trade.emotion] = (emotionCounts[trade.emotion] || 0) + 1;
  }

  const allEmotions = ["FOMO", "Rabbia", "Neutrale", "Vendetta", "Speranza", "Fiducioso", "Impaziente", "Paura", "Sicuro", "Stress"];
  
  return allEmotions.map((emotion) => ({
    emotion,
    count: emotionCounts[emotion] || 0,
  }));
}
