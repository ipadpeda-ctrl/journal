import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import Header, { Tab } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Users, TrendingUp, BarChart3, ArrowUp, ArrowDown, Shield, ShieldCheck, User as UserIcon, Trophy, Medal, Award, CheckCircle2, XCircle, Clock, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from "recharts";
import type { User, Trade } from "@shared/schema";

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) { console.error("AdminDashboard Crash:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 border-2 border-red-500 bg-red-50 text-red-900 rounded-lg m-4">
          <h2 className="text-lg font-bold flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Errore visualizzazione</h2>
          <p className="mt-2 text-sm">{this.state.error?.message}</p>
          <Button variant="outline" className="mt-4 border-red-200 hover:bg-red-100 text-red-700" onClick={() => this.setState({ hasError: false })}>Riprova</Button>
        </div>
      );
    }
    return this.props.children;
  }
}

interface AdminTrade extends Trade { userName?: string; userEmail?: string; }

export default function AdminDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const [location, setLocation] = useLocation();

  // --- NAVIGAZIONE CORRETTA VERSO I NUOVI URL ---
  const handleTabChange = (tab: Tab) => {
    switch (tab) {
      case "admin": break; // Siamo già qui
      case "operations": setLocation("/operations"); break;
      case "calendario": setLocation("/calendar"); break;
      case "statistiche": setLocation("/stats"); break;
      case "diary": setLocation("/diary"); break;
      case "goals": setLocation("/goals"); break;
      case "settings": setLocation("/settings"); break;
      default: setLocation("/"); break; // Home/Nuova operazione
    }
  };
  // ---------------------------------------------

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  const { data: users = [], isLoading: usersLoading, error: usersError } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: isAdmin,
    retry: 1
  });

  const { data: trades = [], isLoading: tradesLoading, error: tradesError } = useQuery<AdminTrade[]>({
    queryKey: ["/api/admin/trades"],
    enabled: isAdmin,
    retry: 1
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => apiRequest("PATCH", `/api/admin/users/${userId}/role`, { role }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] }),
  });

  const updateApprovalMutation = useMutation({
    mutationFn: async ({ userId, isApproved }: { userId: string; isApproved: string }) => apiRequest("PATCH", `/api/admin/users/${userId}/approval`, { isApproved }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] }),
  });

  const isLoading = authLoading || (isAdmin && (usersLoading || tradesLoading));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header activeTab="admin" onTabChange={handleTabChange} />
        <main className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Caricamento dashboard admin...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header activeTab="admin" onTabChange={handleTabChange} />
        <main className="max-w-7xl mx-auto px-4 py-6">
          <Card className="p-8 text-center border-red-100 bg-red-50/50">
            <Shield className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-bold mb-2">Accesso Negato</h2>
            <p className="text-muted-foreground">Non hai i permessi necessari (Ruolo attuale: {user?.role || "Nessuno"}).</p>
          </Card>
        </main>
      </div>
    );
  }

  if (usersError || tradesError) {
    return (
      <div className="min-h-screen bg-background">
        <Header activeTab="admin" onTabChange={handleTabChange} />
        <main className="max-w-7xl mx-auto px-4 py-6">
          <Card className="p-6 border-red-200 bg-red-50">
            <h3 className="text-lg font-bold text-red-800">Errore Caricamento Dati</h3>
            <pre className="mt-4 p-2 bg-white rounded border text-xs overflow-auto">{usersError?.message || tradesError?.message}</pre>
          </Card>
        </main>
      </div>
    );
  }

  const safeUsers = Array.isArray(users) ? users : [];
  const safeTrades = Array.isArray(trades) ? trades : [];

  const getUserStats = (userId: string) => {
    const userTrades = safeTrades.filter((t) => t.userId === userId);
    const wins = userTrades.filter((t) => t.result === "target").length;
    const losses = userTrades.filter((t) => t.result === "stop_loss").length;
    const winRate = userTrades.length > 0 ? (wins / userTrades.length) * 100 : 0;
    const pnl = userTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    return { totalTrades: userTrades.length, wins, losses, winRate, pnl };
  };

  const leaderboardByWinRate = safeUsers
    .map((u) => ({ ...u, stats: getUserStats(u.id) }))
    .filter((u) => u.stats.totalTrades >= 1)
    .sort((a, b) => b.stats.winRate - a.stats.winRate)
    .slice(0, 10);

  const userTradesChartData = safeUsers
    .map((u) => ({
      name: u.firstName || u.email?.split("@")[0] || "User",
      trades: getUserStats(u.id).totalTrades,
      winRate: Math.round(getUserStats(u.id).winRate),
    }))
    .filter((u) => u.trades > 0)
    .sort((a, b) => b.trades - a.trades)
    .slice(0, 8);

  const totalStats = {
    totalUsers: safeUsers.length,
    totalTrades: safeTrades.length,
    avgWinRate: safeUsers.length > 0 ? safeUsers.reduce((sum, u) => sum + getUserStats(u.id).winRate, 0) / safeUsers.length : 0,
    totalWins: safeTrades.filter((t) => t.result === "target").length,
    totalLosses: safeTrades.filter((t) => t.result === "stop_loss").length,
  };

  const getMedalIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (index === 1) return <Medal className="w-5 h-5 text-gray-400" />;
    if (index === 2) return <Award className="w-5 h-5 text-amber-600" />;
    return <span className="w-5 text-center text-muted-foreground font-mono">{index + 1}</span>;
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "super_admin": return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30"><ShieldCheck className="w-3 h-3 mr-1" />Super Admin</Badge>;
      case "admin": return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30"><Shield className="w-3 h-3 mr-1" />Admin</Badge>;
      default: return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30"><UserIcon className="w-3 h-3 mr-1" />User</Badge>;
    }
  };

  const getApprovalBadge = (isApproved: string) => {
    switch (isApproved) {
      case "approved": return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"><CheckCircle2 className="w-3 h-3 mr-1" />Approvato</Badge>;
      case "rejected": return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><XCircle className="w-3 h-3 mr-1" />Rifiutato</Badge>;
      default: return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"><Clock className="w-3 h-3 mr-1" />In Attesa</Badge>;
    }
  };

  const getResultBadge = (result: string) => {
    switch (result) {
      case "target": return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Target</Badge>;
      case "stop_loss": return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Stop Loss</Badge>;
      case "breakeven": return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Breakeven</Badge>;
      case "parziale": return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Parziale</Badge>;
      default: return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Non Fillato</Badge>;
    }
  };

  const pendingUsers = safeUsers.filter(u => u.isApproved === "pending");
  const isSuperAdmin = user?.role === "super_admin";

  return (
    <div className="min-h-screen bg-background">
      <Header activeTab="admin" onTabChange={handleTabChange} />
      <ErrorBoundary>
        <main className="max-w-7xl mx-auto px-4 py-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Panoramica di tutti gli utenti e le operazioni (Ruolo: {user?.role})</p>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Users className="w-4 h-4" />Utenti Totali</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{totalStats.totalUsers}</div></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><BarChart3 className="w-4 h-4" />Operazioni Totali</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{totalStats.totalTrades}</div></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><TrendingUp className="w-4 h-4" />Win Rate Medio</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{totalStats.avgWinRate.toFixed(1)}%</div></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Vittorie/Perdite</CardTitle></CardHeader><CardContent><div className="flex items-center gap-2"><span className="text-emerald-500 font-bold">{totalStats.totalWins}W</span><span className="text-muted-foreground">/</span><span className="text-red-500 font-bold">{totalStats.totalLosses}L</span></div></CardContent></Card>
          </div>

          <Tabs defaultValue="users" className="space-y-4">
            <TabsList><TabsTrigger value="users">Utenti</TabsTrigger><TabsTrigger value="trades">Tutte le Operazioni</TabsTrigger><TabsTrigger value="leaderboard">Classifica</TabsTrigger></TabsList>
            <TabsContent value="users">
              <Card>
                <CardHeader><CardTitle>Gestione Utenti</CardTitle></CardHeader>
                <CardContent>
                  {pendingUsers.length > 0 && (
                    <div className="mb-4 p-4 rounded-md bg-yellow-500/10 border border-yellow-500/30">
                      <div className="flex items-center gap-2 mb-2"><Clock className="w-4 h-4 text-yellow-500" /><span className="font-medium text-yellow-500">{pendingUsers.length} utenti in attesa di approvazione</span></div>
                      <div className="flex flex-wrap gap-2">
                        {pendingUsers.map((u) => (
                          <div key={u.id} className="flex items-center gap-2 bg-background rounded-md px-3 py-2">
                            <span className="text-sm">{u.firstName} {u.lastName}</span>
                            <Button size="sm" variant="outline" className="h-7 text-emerald-500 border-emerald-500/30" onClick={() => updateApprovalMutation.mutate({ userId: u.id, isApproved: "approved" })} disabled={updateApprovalMutation.isPending}>Approva</Button>
                            <Button size="sm" variant="outline" className="h-7 text-red-500 border-red-500/30" onClick={() => updateApprovalMutation.mutate({ userId: u.id, isApproved: "rejected" })} disabled={updateApprovalMutation.isPending}>Rifiuta</Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <Table>
                    <TableHeader><TableRow><TableHead>Utente</TableHead><TableHead>Email</TableHead><TableHead>Stato</TableHead><TableHead>Ruolo</TableHead><TableHead className="text-right">Trades</TableHead><TableHead className="text-right">Win Rate</TableHead><TableHead>Azioni</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {safeUsers.map((u) => {
                        const stats = getUserStats(u.id);
                        return (
                          <TableRow key={u.id}>
                            <TableCell><div className="flex items-center gap-2"><Avatar className="w-8 h-8"><AvatarImage src={u.profileImageUrl || undefined} /><AvatarFallback>{u.firstName?.[0] || "?"}</AvatarFallback></Avatar><span className="font-medium">{u.firstName} {u.lastName}</span></div></TableCell>
                            <TableCell className="text-muted-foreground">{u.email}</TableCell>
                            <TableCell>{getApprovalBadge(u.isApproved)}</TableCell>
                            <TableCell>{getRoleBadge(u.role)}</TableCell>
                            <TableCell className="text-right font-mono">{stats.totalTrades}</TableCell>
                            <TableCell className="text-right font-mono">{stats.winRate.toFixed(1)}%</TableCell>
                            <TableCell>
                              {u.role !== "super_admin" && (
                                <div className="flex items-center gap-2">
                                  <Select value={u.isApproved} onValueChange={(val) => updateApprovalMutation.mutate({ userId: u.id, isApproved: val })} disabled={updateApprovalMutation.isPending}><SelectTrigger className="w-28"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="approved">Approvato</SelectItem><SelectItem value="pending">In Attesa</SelectItem><SelectItem value="rejected">Rifiutato</SelectItem></SelectContent></Select>
                                  {isSuperAdmin && (
                                    <Select value={u.role} onValueChange={(val) => updateRoleMutation.mutate({ userId: u.id, role: val })} disabled={updateRoleMutation.isPending}><SelectTrigger className="w-24"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="user">User</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent></Select>
                                  )}
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="trades">
              <Card>
                <CardHeader><CardTitle>Tutte le Operazioni</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader><TableRow><TableHead>Utente</TableHead><TableHead>Data</TableHead><TableHead>Coppia</TableHead><TableHead>Dir.</TableHead><TableHead className="text-right">Target</TableHead><TableHead className="text-right">Stop</TableHead><TableHead>Risultato</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {safeTrades.length === 0 ? (
                        <TableRow><TableCell colSpan={7} className="text-center py-4">Nessun trade presente</TableCell></TableRow>
                      ) : (
                        safeTrades.map((trade) => {
                          const tradeUser = safeUsers.find((u) => u.id === trade.userId);
                          return (
                            <TableRow key={trade.id}>
                              <TableCell><div className="flex items-center gap-2"><Avatar className="w-6 h-6"><AvatarFallback className="text-[10px]">{tradeUser?.firstName?.[0] || "?"}</AvatarFallback></Avatar><span className="text-sm">{tradeUser?.firstName || "Unknown"}</span></div></TableCell>
                              <TableCell className="font-mono text-xs">{trade.date}</TableCell>
                              <TableCell className="font-medium">{trade.pair}</TableCell>
                              <TableCell><span className={`flex items-center gap-1 ${trade.direction === "long" ? "text-emerald-500" : "text-red-500"}`}>{trade.direction === "long" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}{trade.direction === "long" ? "L" : "S"}</span></TableCell>
                              <TableCell className="text-right font-mono">{trade.target?.toFixed(2) || "-"}</TableCell>
                              <TableCell className="text-right font-mono">{trade.stopLoss?.toFixed(2) || "-"}</TableCell>
                              <TableCell>{getResultBadge(trade.result)}</TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="leaderboard">
              <div className="grid lg:grid-cols-2 gap-4">
                <Card><CardHeader><CardTitle className="flex items-center gap-2"><Trophy className="w-5 h-5 text-yellow-500" />Top Win Rate</CardTitle></CardHeader><CardContent><div className="space-y-2">{leaderboardByWinRate.map((u, idx) => (<div key={u.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50"><div className="w-6 text-center">{getMedalIcon(idx)}</div><Avatar className="w-8 h-8"><AvatarFallback>{u.firstName?.[0]}</AvatarFallback></Avatar><div className="flex-1"><p className="font-medium">{u.firstName}</p></div><div className="text-right font-bold text-emerald-500">{u.stats.winRate.toFixed(1)}%</div></div>))}{leaderboardByWinRate.length === 0 && <p className="text-center text-muted-foreground">Nessun dato</p>}</div></CardContent></Card>
                <Card className="lg:col-span-2"><CardHeader><CardTitle>Attività Utenti</CardTitle></CardHeader><CardContent><div className="h-64 w-full">{userTradesChartData.length > 0 ? (<ResponsiveContainer width="100%" height="100%"><BarChart data={userTradesChartData} layout="vertical" margin={{ left: 20 }}><XAxis type="number" hide /><YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} /><Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px' }} /><Bar dataKey="trades" name="Trades" radius={[0, 4, 4, 0]}>{userTradesChartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.winRate >= 50 ? "#10b981" : "#ef4444"} />))}</Bar></BarChart></ResponsiveContainer>) : (<div className="flex items-center justify-center h-full text-muted-foreground">Nessun dato grafico disponibile</div>)}</div></CardContent></Card>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </ErrorBoundary>
    </div>
  );
}