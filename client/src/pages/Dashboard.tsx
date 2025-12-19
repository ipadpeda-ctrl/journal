import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import Header, { Tab } from "@/components/Header";
import TradeForm, { TradeFormData } from "@/components/TradeForm";
import TradesTable, { Trade } from "@/components/TradesTable";
import TradeDetailModal from "@/components/TradeDetailModal";
import { EquityCurveChart } from "@/components/Charts";
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
import { Loader2, Download, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Trade as SchemaTrade } from "@shared/schema";

// Fallback defaults if DB is empty
const FALLBACK_PAIRS = ["EURUSD", "GBPUSD", "USDJPY", "USDCAD", "AUDUSD", "XAUUSD", "GBPJPY", "EURJPY"];
const FALLBACK_EMOTIONS = ["Neutrale", "FOMO", "Rabbia", "Vendetta", "Speranza", "Fiducioso", "Impaziente", "Paura", "Sicuro", "Stress"];

// --- Helpers e Mappers ---
function mapSchemaTradeToTrade(t: SchemaTrade): Trade {
  return {
    id: t.id.toString(),
    date: t.date,
    time: t.time || "",
    exitDate: t.exitDate || undefined, // NEW: Mapped
    exitTime: t.exitTime || undefined, // NEW: Mapped
    pair: t.pair,
    direction: t.direction as "long" | "short",
    // FIX: Convert decimal strings to numbers for frontend math
    target: t.target ? parseFloat(t.target.toString()) : 0,
    stopLoss: t.stopLoss ? parseFloat(t.stopLoss.toString()) : 0,
    slPips: t.slPips ? parseFloat(t.slPips.toString()) : undefined,
    tpPips: t.tpPips ? parseFloat(t.tpPips.toString()) : undefined,
    rr: t.rr ? parseFloat(t.rr.toString()) : undefined,
    result: t.result as Trade["result"],
    pnl: t.pnl ? parseFloat(t.pnl.toString()) : 0, // IMPORTANT: Use PnL from DB
    emotion: t.emotion || "",
    confluencesPro: t.confluencesPro || [],
    confluencesContro: t.confluencesContro || [],
    imageUrls: t.imageUrls || [],
    notes: t.notes || "",
  };
}

function calculateEquity(trades: Trade[], initialCapital: number): string {
  // FIX: Logic corrected to use Actual PnL
  const totalPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  return (initialCapital + totalPnL).toFixed(2);
}

function calculateEquityCurve(trades: Trade[], initialCapital: number) {
  const sortedTrades = [...trades].sort((a, b) => {
    const timeA = a.time || "00:00";
    const timeB = b.time || "00:00";
    return new Date(`${a.date}T${timeA}`).getTime() - new Date(`${b.date}T${timeB}`).getTime();
  });
  
  let equity = initialCapital;
  const curve = [{ date: "Start", equity }];
  
  for (const trade of sortedTrades) {
    // FIX: Using PnL exclusively for equity curve
    equity += (trade.pnl || 0);
    curve.push({ date: trade.date.slice(5), equity });
  }
  return curve;
}

export default function Dashboard() {
  const { user } = useAuth();
  
  // FIX: Fetch precision decimal as number, handle fallback
  const initialCapital = user?.initialCapital ? parseFloat(user.initialCapital.toString()) : 10000;
  
  // FIX: Load preferences from User object
  const userPreferences = user?.preferences as { pairs?: string[], emotions?: string[] } | undefined;
  const activePairs = userPreferences?.pairs?.length ? userPreferences.pairs : FALLBACK_PAIRS;
  const activeEmotions = userPreferences?.emotions?.length ? userPreferences.emotions : FALLBACK_EMOTIONS;

  const [location, setLocation] = useLocation();

  const getTabFromPath = (path: string): Tab => {
    if (path === "/operations") return "operations";
    if (path === "/calendar") return "calendario";
    if (path === "/stats") return "statistiche";
    if (path === "/diary") return "diary";
    if (path === "/goals") return "goals";
    if (path === "/settings") return "settings";
    return "new-entry";
  };

  const [activeTab, setActiveTab] = useState<Tab>(() => getTabFromPath(location));

  useEffect(() => {
    setActiveTab(getTabFromPath(location));
  }, [location]);

  const handleTabChange = (tab: Tab) => {
    switch (tab) {
      case "admin": setLocation("/admin"); break;
      case "operations": setLocation("/operations"); break;
      case "calendario": setLocation("/calendar"); break;
      case "statistiche": setLocation("/stats"); break;
      case "diary": setLocation("/diary"); break;
      case "goals": setLocation("/goals"); break;
      case "settings": setLocation("/settings"); break;
      default: setLocation("/"); break;
    }
  };

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
    if (!filterStartDate && !filterEndDate) return trades;
    return trades.filter((trade) => {
      const tradeDate = trade.date;
      if (filterStartDate && tradeDate < filterStartDate) return false;
      if (filterEndDate && tradeDate > filterEndDate) return false;
      return true;
    });
  }, [trades, filterStartDate, filterEndDate]);

  const isFiltered = filterStartDate || filterEndDate;
  const clearFilters = () => { setFilterStartDate(""); setFilterEndDate(""); };

  const createTradeMutation = useMutation({
    mutationFn: async (data: TradeFormData) => apiRequest("POST", "/api/trades", { 
      ...data, 
      target: data.target.toString(), 
      stopLoss: data.stopLoss.toString(), 
      slPips: data.slPips?.toString(),
      tpPips: data.tpPips?.toString(),
      rr: data.rr?.toString(),
      pnl: data.pnl?.toString() // Ensure PnL is sent as string for decimal
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/trades"] }),
  });

  const updateTradeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TradeFormData }) => apiRequest("PATCH", `/api/trades/${id}`, {
      ...data,
      target: data.target.toString(),
      stopLoss: data.stopLoss.toString(),
      slPips: data.slPips?.toString(),
      tpPips: data.tpPips?.toString(),
      rr: data.rr?.toString(),
      pnl: data.pnl?.toString()
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/trades"] }),
  });

  const deleteTradeMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/trades/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/trades"] }),
  });

  const updateUserMutation = useMutation({
    mutationFn: async (data: { initialCapital?: string, preferences?: any }) => apiRequest("PATCH", "/api/user", data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/user"] }),
  });

  const stats = useMemo(() => ({
    totalOperations: filteredTrades.length,
    winRate: filteredTrades.length > 0 ? ((filteredTrades.filter((t) => t.result === "target").length / filteredTrades.length) * 100).toFixed(1) : "0",
    totalEquity: calculateEquity(filteredTrades, initialCapital),
  }), [filteredTrades, initialCapital]);

  const equityData = useMemo(() => calculateEquityCurve(filteredTrades, initialCapital), [filteredTrades, initialCapital]);

  const handleSubmitTrade = (formData: TradeFormData) => {
    if (editingTrade) {
      updateTradeMutation.mutate({ id: editingTrade.id, data: formData }, { onSuccess: () => { setEditingTrade(null); handleTabChange("operations"); } });
    } else {
      createTradeMutation.mutate(formData, { onSuccess: () => handleTabChange("operations") });
    }
  };

  const handleEditTrade = (trade: Trade) => { setEditingTrade(trade); setIsDetailModalOpen(false); handleTabChange("new-entry"); };
  const handleCancelEdit = () => setEditingTrade(null);
  const handleRowClick = (trade: Trade) => { setSelectedTrade(trade); setIsDetailModalOpen(true); };
  const handleDeleteTrade = (id: string) => { deleteTradeMutation.mutate(id); if (editingTrade?.id === id) setEditingTrade(null); };

  const handleSaveSettings = (newSettings: { pairs: string[], emotions: string[], initialCapital: number }) => {
    updateUserMutation.mutate({
      initialCapital: newSettings.initialCapital.toString(),
      preferences: {
        pairs: newSettings.pairs,
        emotions: newSettings.emotions
      }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header activeTab={activeTab} onTabChange={handleTabChange} />
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
      <Header activeTab={activeTab} onTabChange={handleTabChange} />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === "statistiche" && (
          <div className="space-y-6">
            <Card className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2"><Filter className="w-4 h-4 text-muted-foreground" /><span className="text-sm font-medium">Filtra per periodo:</span></div>
                  <div className="flex items-center gap-2"><Label htmlFor="filterStart" className="text-xs text-muted-foreground">Da:</Label><Input id="filterStart" type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} className="h-8 w-36 text-xs" /></div>
                  <div className="flex items-center gap-2"><Label htmlFor="filterEnd" className="text-xs text-muted-foreground">A:</Label><Input id="filterEnd" type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} className="h-8 w-36 text-xs" /></div>
                  {isFiltered && <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8"><X className="w-3 h-3 mr-1" />Rimuovi filtri</Button>}
                </div>
              </div>
            </Card>

            <div className="grid lg:grid-cols-3 gap-6">
              <DirectionBreakdown trades={filteredTrades} />
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Win Rate</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{stats.winRate}%</div><p className="text-sm text-muted-foreground mt-1">{filteredTrades.filter((t) => t.result === "target").length} vincenti su {filteredTrades.length} totali</p></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Risultato Finale</CardTitle></CardHeader><CardContent><div className={`text-3xl font-bold ${parseFloat(stats.totalEquity) >= initialCapital ? "text-emerald-500" : "text-red-500"}`}>{parseFloat(stats.totalEquity) >= initialCapital ? "+" : ""}{(parseFloat(stats.totalEquity) - initialCapital).toFixed(2)} EUR</div><p className="text-sm text-muted-foreground mt-1">Equity totale: {stats.totalEquity} EUR</p></CardContent></Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <TradeCountDonut trades={filteredTrades} />
              <PerformanceByPair trades={filteredTrades} />
            </div>

            <MetricsCards trades={filteredTrades} />
            {/* FIX: New Metrics Component with Sharpe/Sortino/Holding */}
            <AdvancedMetrics trades={filteredTrades} />
            <MonthlyComparison trades={filteredTrades} initialCapital={initialCapital} />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <ResultBreakdownCard title="Take Profit" result="target" trades={filteredTrades} color="hsl(142, 71%, 45%)" />
              <ResultBreakdownCard title="Stop Loss" result="stop_loss" trades={filteredTrades} color="hsl(0, 84%, 60%)" />
              <ResultBreakdownCard title="Breakeven" result="breakeven" trades={filteredTrades} color="hsl(45, 93%, 47%)" />
              <ResultBreakdownCard title="Parziali" result="parziale" trades={filteredTrades} color="hsl(217, 91%, 60%)" />
            </div>

            <MoodTracker trades={filteredTrades} />

            <div className="grid lg:grid-cols-2 gap-6">
              <ConfluenceStats trades={filteredTrades} type="pro" />
              <ConfluenceStats trades={filteredTrades} type="contro" />
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <EquityProjection trades={filteredTrades} initialCapital={initialCapital} />
              <RiskOfRuinTable trades={filteredTrades} />
            </div>

            <EquityCurveChart data={equityData} />
          </div>
        )}

        {activeTab === "calendario" && (
          <div className="flex gap-6">
            <div className="flex-1"><Calendar trades={trades} /></div>
            <div className="w-80 flex-shrink-0"><WeeklyRecap trades={trades} currentDate={selectedDate} /></div>
          </div>
        )}

        {activeTab === "operations" && (
          <>
            <TradesTable trades={trades} onEdit={handleEditTrade} onDelete={handleDeleteTrade} onRowClick={handleRowClick} />
            <TradeDetailModal trade={selectedTrade} open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen} onEdit={handleEditTrade} onDelete={handleDeleteTrade} />
          </>
        )}

        {activeTab === "new-entry" && (
          // FIX: Pass active pairs/emotions to form
          <TradeForm 
            availablePairs={activePairs}
            availableEmotions={activeEmotions}
            onSubmit={handleSubmitTrade} 
            onDuplicate={() => console.log("Duplicate")} 
            editingTrade={editingTrade ? { 
              ...editingTrade, 
              target: editingTrade.target.toString(), 
              stopLoss: editingTrade.stopLoss.toString(), 
              slPips: editingTrade.slPips?.toString() || "", 
              tpPips: editingTrade.tpPips?.toString() || "", 
              rr: editingTrade.rr?.toString() || "",
              pnl: editingTrade.pnl?.toString() || ""
            } : undefined} 
            onCancelEdit={handleCancelEdit} 
          />
        )}

        {/* FIX: Settings logic linked to update mutation */}
        {activeTab === "settings" && (
          <Settings 
            pairs={activePairs} 
            emotions={activeEmotions} 
            confluencesPro={[]} // Se vuoi renderle editabili, segui lo stesso pattern di pairs
            confluencesContro={[]} 
            initialCapital={initialCapital} 
            onSave={handleSaveSettings} 
          />
        )}
        
        {activeTab === "diary" && <TradingDiary />}
        {activeTab === "goals" && <MonthlyGoals trades={trades.map((t) => ({ date: t.date, result: t.result, target: t.target, stopLoss: t.stopLoss }))} />}
      </main>
    </div>
  );
}