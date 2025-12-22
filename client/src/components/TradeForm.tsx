import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Copy, ImageIcon, Trash2 } from "lucide-react";
import ConfluenceTag from "./ConfluenceTag";
import { useAuth } from "@/hooks/useAuth";

// Default values as fallback if user has no custom settings
const DEFAULT_PAIRS = ["EURUSD", "GBPUSD", "USDJPY", "USDCAD", "AUDUSD", "XAUUSD", "GBPJPY", "EURJPY"];
const DEFAULT_EMOTIONS = ["Neutrale", "FOMO", "Rabbia", "Vendetta", "Speranza", "Fiducioso", "Impaziente", "Paura", "Sicuro", "Stress"];
const DEFAULT_CONFLUENCES_PRO = ["Trend forte", "Supporto testato", "Volume alto", "Pattern chiaro", "Livello chiave"];
const DEFAULT_CONFLUENCES_CONTRO = ["Notizie in arrivo", "Pattern debole", "Contro trend", "Bassa liquidità", "Orario sfavorevole"];

interface TradeFormProps {
  onSubmit?: (trade: TradeFormData) => void;
  onDuplicate?: () => void;
  editingTrade?: TradeFormData & { id?: string };
  onCancelEdit?: () => void;
}

export type TradeResult = "target" | "stop_loss" | "breakeven" | "parziale" | "non_fillato";

export interface TradeFormData {
  date: string;
  time: string;
  pair: string;
  direction: "long" | "short";
  target: string;
  stopLoss: string;
  slPips: string;
  tpPips: string;
  rr: string;
  result: TradeResult;
  emotion: string;
  confluencesPro: string[];
  confluencesContro: string[];
  imageUrls: string[];
  notes: string;
}

export default function TradeForm({ onSubmit, onDuplicate, editingTrade, onCancelEdit }: TradeFormProps) {
  const { user } = useAuth();
  
  // Use user settings if available, otherwise default to constants
  const pairs = user?.pairs?.length ? user.pairs : DEFAULT_PAIRS;
  const emotions = user?.emotions?.length ? user.emotions : DEFAULT_EMOTIONS;
  const availableConfluencesPro = user?.confluencesPro?.length ? user.confluencesPro : DEFAULT_CONFLUENCES_PRO;
  const availableConfluencesContro = user?.confluencesContro?.length ? user.confluencesContro : DEFAULT_CONFLUENCES_CONTRO;

  const getInitialFormData = (): TradeFormData => {
    if (editingTrade) {
      return {
        date: editingTrade.date,
        time: editingTrade.time,
        pair: editingTrade.pair,
        direction: editingTrade.direction,
        target: editingTrade.target,
        stopLoss: editingTrade.stopLoss,
        slPips: editingTrade.slPips || "",
        tpPips: editingTrade.tpPips || "",
        rr: editingTrade.rr || "",
        result: editingTrade.result,
        emotion: editingTrade.emotion,
        confluencesPro: editingTrade.confluencesPro,
        confluencesContro: editingTrade.confluencesContro,
        imageUrls: editingTrade.imageUrls,
        notes: editingTrade.notes,
      };
    }
    return {
      date: new Date().toISOString().split("T")[0],
      time: new Date().toTimeString().slice(0, 5),
      pair: "",
      direction: "long",
      target: "",
      stopLoss: "1.00", // Default Risk
      slPips: "",
      tpPips: "",
      rr: "",
      result: "target",
      emotion: "Neutrale",
      confluencesPro: [],
      confluencesContro: [],
      imageUrls: [],
      notes: "",
    };
  };

  const [formData, setFormData] = useState<TradeFormData>(getInitialFormData);

  useEffect(() => {
    setFormData(getInitialFormData());
  }, [editingTrade?.id]);

  // Calcola RR matematico puro (TP pips / SL pips)
  const calculateRR = (sl: string, tp: string): number => {
    const slVal = parseFloat(sl);
    const tpVal = parseFloat(tp);
    if (slVal > 0 && tpVal > 0) {
      return tpVal / slVal;
    }
    return 0;
  };

  // Aggiorna SL Pips e ricalcola Target basandosi sul Rischio attuale
  const handleSlPipsChange = (value: string) => {
    const rrValue = calculateRR(value, formData.tpPips);
    const riskValue = parseFloat(formData.stopLoss) || 0;
    
    // Target = RR * Rischio
    const newTarget = rrValue > 0 && riskValue > 0 ? (rrValue * riskValue).toFixed(2) : formData.target;

    setFormData((prev) => ({ 
      ...prev, 
      slPips: value, 
      rr: rrValue > 0 ? rrValue.toFixed(2) : "",
      target: newTarget
    }));
  };

  // Aggiorna TP Pips e ricalcola Target basandosi sul Rischio attuale
  const handleTpPipsChange = (value: string) => {
    const rrValue = calculateRR(formData.slPips, value);
    const riskValue = parseFloat(formData.stopLoss) || 0;

    const newTarget = rrValue > 0 && riskValue > 0 ? (rrValue * riskValue).toFixed(2) : formData.target;

    setFormData((prev) => ({ 
      ...prev, 
      tpPips: value, 
      rr: rrValue > 0 ? rrValue.toFixed(2) : "",
      target: newTarget
    }));
  };

  // Gestisce il cambio manuale del Rischio (Stop Loss R)
  // Ricalcola il Target mantenendo costante l'RR dei pips
  const handleRiskChange = (value: string) => {
    const riskValue = parseFloat(value);
    const rrValue = parseFloat(formData.rr);

    let newTarget = formData.target;
    if (!isNaN(riskValue) && !isNaN(rrValue) && rrValue > 0) {
      newTarget = (rrValue * riskValue).toFixed(2);
    }

    setFormData((prev) => ({ ...prev, stopLoss: value, target: newTarget }));
  };

  const [newProTag, setNewProTag] = useState("");
  const [newControTag, setNewControTag] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");

  const addImageUrl = (url: string) => {
    if (!url.trim()) return;
    if (!formData.imageUrls.includes(url)) {
      setFormData((prev) => ({ ...prev, imageUrls: [...prev.imageUrls, url] }));
    }
    setNewImageUrl("");
  };

  const removeImageUrl = (url: string) => {
    setFormData((prev) => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((u) => u !== url),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.pair || formData.pair.trim() === "") {
      alert("Seleziona una coppia prima di salvare.");
      return;
    }
    onSubmit?.(formData);
  };

  const addConfluence = (type: "pro" | "contro", value: string) => {
    if (!value.trim()) return;
    const key = type === "pro" ? "confluencesPro" : "confluencesContro";
    if (!formData[key].includes(value)) {
      setFormData((prev) => ({ ...prev, [key]: [...prev[key], value] }));
    }
    if (type === "pro") setNewProTag("");
    else setNewControTag("");
  };

  const removeConfluence = (type: "pro" | "contro", value: string) => {
    const key = type === "pro" ? "confluencesPro" : "confluencesContro";
    setFormData((prev) => ({
      ...prev,
      [key]: prev[key].filter((c) => c !== value),
    }));
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="text-lg font-medium">{editingTrade ? "Modifica Operazione" : "Nuova Operazione"}</h2>
          {!editingTrade && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onDuplicate}
              data-testid="button-duplicate-trade"
            >
              <Copy className="w-4 h-4 mr-2" />
              Duplica Ultima
            </Button>
          )}
        </div>

        {/* SECTION 1: GENERAL INFO (Manual) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date">Data</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
              data-testid="input-date"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="time">Ora</Label>
            <Input
              id="time"
              type="time"
              value={formData.time}
              onChange={(e) => setFormData((prev) => ({ ...prev, time: e.target.value }))}
              data-testid="input-time"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pair">Coppia</Label>
            <Select
              value={formData.pair}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, pair: value }))}
            >
              <SelectTrigger id="pair" data-testid="select-pair">
                <SelectValue placeholder="Seleziona" />
              </SelectTrigger>
              <SelectContent>
                {pairs.map((pair) => (
                  <SelectItem key={pair} value={pair}>
                    {pair}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Direzione</Label>
            <div className="flex gap-1">
              <Button
                type="button"
                variant={formData.direction === "long" ? "default" : "outline"}
                size="sm"
                className={`flex-1 ${formData.direction === "long" ? "bg-emerald-600" : ""}`}
                onClick={() => setFormData((prev) => ({ ...prev, direction: "long" }))}
                data-testid="button-direction-long"
              >
                Long
              </Button>
              <Button
                type="button"
                variant={formData.direction === "short" ? "default" : "outline"}
                size="sm"
                className={`flex-1 ${formData.direction === "short" ? "bg-red-600" : ""}`}
                onClick={() => setFormData((prev) => ({ ...prev, direction: "short" }))}
                data-testid="button-direction-short"
              >
                Short
              </Button>
            </div>
          </div>
        </div>

        {/* SECTION 2: TECHNICAL PARAMETERS */}
        <div className="p-4 bg-muted/20 rounded-lg border border-border/50 flex flex-col gap-4">
          {/* Row A: Manual Inputs (Risk, Pips) */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
             <div className="space-y-2">
              <Label htmlFor="stopLoss">Rischio (€/$)</Label>
              <Input
                id="stopLoss"
                type="number"
                step="0.01"
                placeholder="1.00"
                value={formData.stopLoss}
                onChange={(e) => handleRiskChange(e.target.value)}
                className="font-mono bg-background"
                data-testid="input-stop-loss"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slPips" className="text-xs uppercase text-muted-foreground">SL (pips)</Label>
              <Input
                id="slPips"
                type="number"
                step="0.1"
                placeholder="es. 10"
                value={formData.slPips}
                onChange={(e) => handleSlPipsChange(e.target.value)}
                className="font-mono bg-background"
                data-testid="input-sl-pips"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tpPips" className="text-xs uppercase text-muted-foreground">TP (pips)</Label>
              <Input
                id="tpPips"
                type="number"
                step="0.1"
                placeholder="es. 30"
                value={formData.tpPips}
                onChange={(e) => handleTpPipsChange(e.target.value)}
                className="font-mono bg-background"
                data-testid="input-tp-pips"
              />
            </div>
          </div>
          
          <div className="border-t border-border/50 w-full my-1"></div>

          {/* Row B: Automated Outputs (Target, RR) - VISUALLY SEPARATED */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="target" className="text-emerald-600 font-medium">Target (Auto)</Label>
              <Input
                id="target"
                type="number"
                step="0.01"
                placeholder="Auto"
                value={formData.target}
                onChange={(e) => setFormData((prev) => ({ ...prev, target: e.target.value }))}
                className="font-mono bg-muted/50 border-emerald-500/30"
                data-testid="input-target"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rr" className="text-emerald-600 font-medium">RR Matematico</Label>
              <Input
                id="rr"
                type="number"
                readOnly
                value={formData.rr}
                className="font-mono bg-muted/50 border-emerald-500/30 text-muted-foreground"
                data-testid="input-rr"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: RESULT & EMOTION */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="space-y-2 col-span-2 md:col-span-2">
            <Label>Risultato</Label>
            <div className="flex gap-1">
              {(["target", "stop_loss", "breakeven"] as const).map((result) => (
                <Button
                  key={result}
                  type="button"
                  variant={formData.result === result ? "default" : "outline"}
                  size="sm"
                  className={`flex-1 ${
                    formData.result === result
                      ? result === "target"
                        ? "bg-emerald-600"
                        : result === "stop_loss"
                        ? "bg-red-600"
                        : "bg-yellow-600"
                      : ""
                  }`}
                  onClick={() => setFormData((prev) => ({ ...prev, result }))}
                  data-testid={`button-result-${result}`}
                >
                  {result === "target" ? "Target" : result === "stop_loss" ? "Stop" : "BE"}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2 col-span-2 md:col-span-1">
            <Label htmlFor="emotion">Emozione</Label>
            <Select
              value={formData.emotion}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, emotion: value }))}
            >
              <SelectTrigger id="emotion" data-testid="select-emotion">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {emotions.map((emotion) => (
                  <SelectItem key={emotion} value={emotion}>
                    {emotion}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label>Confluenze PRO</Label>
            <div className="flex flex-wrap gap-2">
              {formData.confluencesPro.map((tag) => (
                <ConfluenceTag
                  key={tag}
                  label={tag}
                  type="pro"
                  onRemove={() => removeConfluence("pro", tag)}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <Select onValueChange={(v) => addConfluence("pro", v)}>
                <SelectTrigger className="flex-1" data-testid="select-confluence-pro">
                  <SelectValue placeholder="Aggiungi..." />
                </SelectTrigger>
                <SelectContent>
                  {availableConfluencesPro
                    .filter((c) => !formData.confluencesPro.includes(c))
                    .map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <div className="flex gap-1">
                <Input
                  placeholder="Custom..."
                  value={newProTag}
                  onChange={(e) => setNewProTag(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addConfluence("pro", newProTag))}
                  className="w-28"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={() => addConfluence("pro", newProTag)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Confluenze CONTRO</Label>
            <div className="flex flex-wrap gap-2">
              {formData.confluencesContro.map((tag) => (
                <ConfluenceTag
                  key={tag}
                  label={tag}
                  type="contro"
                  onRemove={() => removeConfluence("contro", tag)}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <Select onValueChange={(v) => addConfluence("contro", v)}>
                <SelectTrigger className="flex-1" data-testid="select-confluence-contro">
                  <SelectValue placeholder="Aggiungi..." />
                </SelectTrigger>
                <SelectContent>
                  {availableConfluencesContro
                    .filter((c) => !formData.confluencesContro.includes(c))
                    .map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <div className="flex gap-1">
                <Input
                  placeholder="Custom..."
                  value={newControTag}
                  onChange={(e) => setNewControTag(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addConfluence("contro", newControTag))}
                  className="w-28"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={() => addConfluence("contro", newControTag)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Label htmlFor="notes">Note</Label>
          <Textarea
            id="notes"
            placeholder="Analisi pre e post trade..."
            value={formData.notes}
            onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
            className="resize-none"
            rows={2}
          />
        </div>

        <div className="space-y-3">
          <Label>Screenshot / Immagini</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Incolla URL immagine..."
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addImageUrl(newImageUrl))}
              className="flex-1"
            />
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={() => addImageUrl(newImageUrl)}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {formData.imageUrls.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.imageUrls.map((url, index) => (
                <div
                  key={index}
                  className="relative group w-20 h-20 rounded-md overflow-hidden border border-border"
                >
                  <img
                    src={url}
                    alt={`Screenshot ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Crect fill='%23333' width='80' height='80'/%3E%3Ctext fill='%23888' x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-size='10'%3EError%3C/text%3E%3C/svg%3E";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => removeImageUrl(url)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          {editingTrade && (
            <Button type="button" variant="outline" onClick={onCancelEdit}>
              Annulla
            </Button>
          )}
          <Button type="submit">
            {editingTrade ? "Salva Modifiche" : "Salva Operazione"}
          </Button>
        </div>
      </form>
    </Card>
  );
}