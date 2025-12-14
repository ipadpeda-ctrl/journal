import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import Header, { Tab } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Users, TrendingUp, BarChart3, ArrowUp, ArrowDown, Shield, ShieldCheck, User as UserIcon, Trophy, Medal, Award } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from "recharts";
import type { User, Trade } from "@shared/schema";

interface AdminTrade extends Trade {
  userName?: string;
  userEmail?: string;
}

export default function AdminDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("admin");

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  const { data: users = [], isLoading: usersLoading, error: usersError } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: isAdmin,
  });

  const { data: trades = [], isLoading: tradesLoading, error: tradesError } = useQuery<AdminTrade[]>({
    queryKey: ["/api/admin/trades"],
    enabled: isAdmin,
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      return apiRequest("PATCH", `/api/admin/users/${userId}/role`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
  });

  const isSuperAdmin = user?.role === "super_admin";
  const isLoading = authLoading || usersLoading || tradesLoading;

  if (authLoading) {
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

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="max-w-7xl mx-auto px-4 py-6">
          <Card className="p-8 text-center">
            <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-bold mb-2">Accesso Negato</h2>
            <p className="text-muted-foreground">Non hai i permessi per accedere a questa pagina.</p>
          </Card>
        </main>
      </div>
    );
  }

  const getUserStats = (userId: string) => {
    const userTrades = trades.filter((t) => t.userId === userId);
    const wins = userTrades.filter((t) => t.result === "target").length;
    const losses = userTrades.filter((t) => t.result === "stop_loss").length;
    const winRate = userTrades.length > 0 ? (wins / userTrades.length) * 100 : 0;
    const pnl = userTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    return { totalTrades: userTrades.length, wins, losses, winRate, pnl };
  };

  const leaderboardByWinRate = users
    .map((u) => ({ ...u, stats: getUserStats(u.id) }))
    .filter((u) => u.stats.totalTrades >= 1)
    .sort((a, b) => b.stats.winRate - a.stats.winRate)
    .slice(0, 10);

  const leaderboardByPnL = users
    .map((u) => ({ ...u, stats: getUserStats(u.id) }))
    .filter((u) => u.stats.totalTrades >= 1)
    .sort((a, b) => b.stats.pnl - a.stats.pnl)
    .slice(0, 10);

  const userTradesChartData = users
    .map((u) => ({
      name: u.firstName || u.email?.split("@")[0] || "?",
      trades: getUserStats(u.id).totalTrades,
      winRate: getUserStats(u.id).winRate,
    }))
    .filter((u) => u.trades > 0)
    .sort((a, b) => b.trades - a.trades)
    .slice(0, 8);

  const getMedalIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (index === 1) return <Medal className="w-5 h-5 text-gray-400" />;
    if (index === 2) return <Award className="w-5 h-5 text-amber-600" />;
    return <span className="w-5 text-center text-muted-foreground font-mono">{index + 1}</span>;
  };

  const totalStats = {
    totalUsers: users.length,
    totalTrades: trades.length,
    avgWinRate: users.length > 0
      ? users.reduce((sum, u) => sum + getUserStats(u.id).winRate, 0) / users.length
      : 0,
    totalWins: trades.filter((t) => t.result === "target").length,
    totalLosses: trades.filter((t) => t.result === "stop_loss").length,
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "super_admin":
        return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30"><ShieldCheck className="w-3 h-3 mr-1" />Super Admin</Badge>;
      case "admin":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30"><Shield className="w-3 h-3 mr-1" />Admin</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30"><UserIcon className="w-3 h-3 mr-1" />User</Badge>;
    }
  };

  const getResultBadge = (result: string) => {
    switch (result) {
      case "target":
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Target</Badge>;
      case "stop_loss":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Stop Loss</Badge>;
      case "breakeven":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Breakeven</Badge>;
      case "parziale":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Parziale</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Non Fillato</Badge>;
    }
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
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Panoramica di tutti gli utenti e le operazioni</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" />
                Utenti Totali
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" data-testid="text-total-users">{totalStats.totalUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Operazioni Totali
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" data-testid="text-total-trades">{totalStats.totalTrades}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Win Rate Medio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" data-testid="text-avg-winrate">{totalStats.avgWinRate.toFixed(1)}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Vittorie/Perdite
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-emerald-500 font-bold">{totalStats.totalWins}W</span>
                <span className="text-muted-foreground">/</span>
                <span className="text-red-500 font-bold">{totalStats.totalLosses}L</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users" data-testid="tab-users">Utenti</TabsTrigger>
            <TabsTrigger value="trades" data-testid="tab-trades">Tutte le Operazioni</TabsTrigger>
            <TabsTrigger value="leaderboard" data-testid="tab-leaderboard">Classifica</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Gestione Utenti</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Utente</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Ruolo</TableHead>
                      <TableHead className="text-right">Trades</TableHead>
                      <TableHead className="text-right">Win Rate</TableHead>
                      {isSuperAdmin && <TableHead>Azioni</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => {
                      const stats = getUserStats(u.id);
                      return (
                        <TableRow key={u.id} data-testid={`row-user-${u.id}`}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={u.profileImageUrl || undefined} />
                                <AvatarFallback>
                                  {u.firstName?.[0] || u.email?.[0] || "?"}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">
                                {u.firstName} {u.lastName}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{u.email}</TableCell>
                          <TableCell>{getRoleBadge(u.role)}</TableCell>
                          <TableCell className="text-right font-mono">{stats.totalTrades}</TableCell>
                          <TableCell className="text-right font-mono">{stats.winRate.toFixed(1)}%</TableCell>
                          {isSuperAdmin && (
                            <TableCell>
                              {u.role !== "super_admin" && (
                                <Select
                                  value={u.role}
                                  onValueChange={(role) =>
                                    updateRoleMutation.mutate({ userId: u.id, role })
                                  }
                                  disabled={updateRoleMutation.isPending}
                                >
                                  <SelectTrigger className="w-28" data-testid={`select-role-${u.id}`}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="user">User</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                            </TableCell>
                          )}
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
              <CardHeader>
                <CardTitle>Tutte le Operazioni</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Utente</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Coppia</TableHead>
                        <TableHead>Dir.</TableHead>
                        <TableHead className="text-right">Target</TableHead>
                        <TableHead className="text-right">Stop</TableHead>
                        <TableHead>Risultato</TableHead>
                        <TableHead>Emozione</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trades.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                            Nessuna operazione trovata
                          </TableCell>
                        </TableRow>
                      ) : (
                        trades.map((trade) => {
                          const tradeUser = users.find((u) => u.id === trade.userId);
                          return (
                            <TableRow key={trade.id} data-testid={`row-admin-trade-${trade.id}`}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Avatar className="w-6 h-6">
                                    <AvatarImage src={tradeUser?.profileImageUrl || undefined} />
                                    <AvatarFallback className="text-xs">
                                      {tradeUser?.firstName?.[0] || "?"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm">{tradeUser?.firstName || "Unknown"}</span>
                                </div>
                              </TableCell>
                              <TableCell className="font-mono text-sm">{trade.date}</TableCell>
                              <TableCell className="font-medium">{trade.pair}</TableCell>
                              <TableCell>
                                <span className={`inline-flex items-center gap-1 ${trade.direction === "long" ? "text-emerald-500" : "text-red-500"}`}>
                                  {trade.direction === "long" ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                                  {trade.direction === "long" ? "Long" : "Short"}
                                </span>
                              </TableCell>
                              <TableCell className="text-right font-mono">{trade.target?.toFixed(2) || "-"}</TableCell>
                              <TableCell className="text-right font-mono">{trade.stopLoss?.toFixed(2) || "-"}</TableCell>
                              <TableCell>{getResultBadge(trade.result)}</TableCell>
                              <TableCell className="text-sm">{trade.emotion || "-"}</TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leaderboard">
            <div className="grid lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    Top Win Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {leaderboardByWinRate.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">Nessun dato disponibile</p>
                  ) : (
                    <div className="space-y-2">
                      {leaderboardByWinRate.map((u, idx) => (
                        <div
                          key={u.id}
                          className="flex items-center gap-3 p-2 rounded-md hover-elevate"
                          data-testid={`leaderboard-winrate-${idx}`}
                        >
                          <div className="flex items-center justify-center w-6">{getMedalIcon(idx)}</div>
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={u.profileImageUrl || undefined} />
                            <AvatarFallback>{u.firstName?.[0] || u.email?.[0] || "?"}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{u.firstName || u.email?.split("@")[0]}</p>
                            <p className="text-xs text-muted-foreground">{u.stats.totalTrades} trades</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-emerald-500">{u.stats.winRate.toFixed(1)}%</p>
                            <p className="text-xs text-muted-foreground">{u.stats.wins}W / {u.stats.losses}L</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                    Top P&L
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {leaderboardByPnL.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">Nessun dato disponibile</p>
                  ) : (
                    <div className="space-y-2">
                      {leaderboardByPnL.map((u, idx) => (
                        <div
                          key={u.id}
                          className="flex items-center gap-3 p-2 rounded-md hover-elevate"
                          data-testid={`leaderboard-pnl-${idx}`}
                        >
                          <div className="flex items-center justify-center w-6">{getMedalIcon(idx)}</div>
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={u.profileImageUrl || undefined} />
                            <AvatarFallback>{u.firstName?.[0] || u.email?.[0] || "?"}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{u.firstName || u.email?.split("@")[0]}</p>
                            <p className="text-xs text-muted-foreground">{u.stats.totalTrades} trades</p>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold font-mono ${u.stats.pnl >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                              {u.stats.pnl >= 0 ? "+" : ""}{u.stats.pnl.toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground">{u.stats.winRate.toFixed(1)}% WR</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Attivita per Utente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {userTradesChartData.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">Nessun dato disponibile</p>
                  ) : (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={userTradesChartData} layout="vertical">
                          <XAxis type="number" />
                          <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
                          <Tooltip
                            formatter={(value: number, name: string) => {
                              if (name === "trades") return [value, "Trades"];
                              return [value.toFixed(1) + "%", "Win Rate"];
                            }}
                            contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                          />
                          <Bar dataKey="trades" name="trades" radius={[0, 4, 4, 0]}>
                            {userTradesChartData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.winRate >= 50 ? "hsl(var(--chart-2))" : "hsl(var(--chart-1))"}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
