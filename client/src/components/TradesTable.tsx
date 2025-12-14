import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, Pencil, Trash2, Search, Filter } from "lucide-react";
import ConfluenceTag from "./ConfluenceTag";

export type TradeResult = "target" | "stop_loss" | "breakeven" | "parziale" | "non_fillato";

export interface Trade {
  id: string;
  date: string;
  time: string;
  pair: string;
  direction: "long" | "short";
  target: number;
  stopLoss: number;
  result: TradeResult;
  pnl?: number;
  emotion: string;
  confluencesPro: string[];
  confluencesContro: string[];
  imageUrls: string[];
  notes: string;
}

interface TradesTableProps {
  trades: Trade[];
  onEdit?: (trade: Trade) => void;
  onDelete?: (id: string) => void;
  onRowClick?: (trade: Trade) => void;
}

export default function TradesTable({ trades, onEdit, onDelete, onRowClick }: TradesTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPair, setFilterPair] = useState<string>("all");
  const [filterResult, setFilterResult] = useState<string>("all");

  const uniquePairs = Array.from(new Set(trades.map((t) => t.pair)));

  const filteredTrades = trades.filter((trade) => {
    const matchesSearch =
      trade.pair.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trade.emotion.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPair = filterPair === "all" || trade.pair === filterPair;
    const matchesResult = filterResult === "all" || trade.result === filterResult;
    return matchesSearch && matchesPair && matchesResult;
  });

  const getResultBadge = (result: Trade["result"]) => {
    switch (result) {
      case "target":
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Target</Badge>;
      case "stop_loss":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Stop Loss</Badge>;
      case "breakeven":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Breakeven</Badge>;
      case "parziale":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Parziale</Badge>;
      case "non_fillato":
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Non Fillato</Badge>;
    }
  };

  return (
    <Card className="p-4">
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cerca operazioni..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            data-testid="input-search-trades"
          />
        </div>
        <div className="flex gap-2">
          <Select value={filterPair} onValueChange={setFilterPair}>
            <SelectTrigger className="w-32" data-testid="select-filter-pair">
              <SelectValue placeholder="Coppia" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutte</SelectItem>
              {uniquePairs.map((pair) => (
                <SelectItem key={pair} value={pair}>
                  {pair}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterResult} onValueChange={setFilterResult}>
            <SelectTrigger className="w-32" data-testid="select-filter-result">
              <SelectValue placeholder="Risultato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti</SelectItem>
              <SelectItem value="target">Target</SelectItem>
              <SelectItem value="stop_loss">Stop Loss</SelectItem>
              <SelectItem value="breakeven">Breakeven</SelectItem>
              <SelectItem value="parziale">Parziale</SelectItem>
              <SelectItem value="non_fillato">Non Fillato</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Data</TableHead>
              <TableHead className="w-16">Ora</TableHead>
              <TableHead className="w-24">Coppia</TableHead>
              <TableHead className="w-20">Dir.</TableHead>
              <TableHead className="w-20 text-right">Target</TableHead>
              <TableHead className="w-20 text-right">Stop</TableHead>
              <TableHead className="w-24">Risultato</TableHead>
              <TableHead className="w-24">Emozione</TableHead>
              <TableHead className="min-w-40">Confluenze</TableHead>
              <TableHead className="w-24">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTrades.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                  Nessuna operazione trovata
                </TableCell>
              </TableRow>
            ) : (
              filteredTrades.map((trade) => (
                <TableRow
                  key={trade.id}
                  data-testid={`row-trade-${trade.id}`}
                  className="cursor-pointer hover-elevate"
                  onClick={() => onRowClick?.(trade)}
                >
                  <TableCell className="font-mono text-sm">{trade.date}</TableCell>
                  <TableCell className="font-mono text-sm">{trade.time}</TableCell>
                  <TableCell className="font-medium">{trade.pair}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center gap-1 ${
                        trade.direction === "long" ? "text-emerald-500" : "text-red-500"
                      }`}
                    >
                      {trade.direction === "long" ? (
                        <ArrowUp className="w-4 h-4" />
                      ) : (
                        <ArrowDown className="w-4 h-4" />
                      )}
                      {trade.direction === "long" ? "Long" : "Short"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono">{trade.target.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-mono">{trade.stopLoss.toFixed(2)}</TableCell>
                  <TableCell>{getResultBadge(trade.result)}</TableCell>
                  <TableCell className="text-sm">{trade.emotion}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      <span className="text-xs text-emerald-500">+{trade.confluencesPro.length}</span>
                      <span className="text-xs text-red-500">-{trade.confluencesContro.length}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => { e.stopPropagation(); onEdit?.(trade); }}
                        data-testid={`button-edit-trade-${trade.id}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => { e.stopPropagation(); onDelete?.(trade.id); }}
                        data-testid={`button-delete-trade-${trade.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
