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

const PAIRS = ["EURUSD", "GBPUSD", "USDJPY", "USDCAD", "AUDUSD", "XAUUSD", "GBPJPY", "EURJPY"];
const EMOTIONS = ["Neutrale", "FOMO", "Rabbia", "Vendetta", "Speranza", "Fiducioso", "Impaziente", "Paura", "Sicuro", "Stress"];

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
  result: TradeResult;
  emotion: string;
  confluencesPro: string[];
  confluencesContro: string[];
  imageUrls: string[];
  notes: string;
}

const defaultConfluencesPro = ["Trend forte", "Supporto testato", "Volume alto", "Pattern chiaro", "Livello chiave"];
const defaultConfluencesContro = ["Notizie in arrivo", "Pattern debole", "Contro trend", "Bassa liquidità", "Orario sfavorevole"];

export default function TradeForm({ onSubmit, onDuplicate, editingTrade, onCancelEdit }: TradeFormProps) {
  const getInitialFormData = (): TradeFormData => {
    if (editingTrade) {
      return {
        date: editingTrade.date,
        time: editingTrade.time,
        pair: editingTrade.pair,
        direction: editingTrade.direction,
        target: editingTrade.target,
        stopLoss: editingTrade.stopLoss,
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
      stopLoss: "",
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
    onSubmit?.(formData);
    console.log("Trade submitted:", formData);
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

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
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
                {PAIRS.map((pair) => (
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

          <div className="space-y-2">
            <Label htmlFor="target">Target</Label>
            <Input
              id="target"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.target}
              onChange={(e) => setFormData((prev) => ({ ...prev, target: e.target.value }))}
              className="font-mono"
              data-testid="input-target"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stopLoss">Stop Loss</Label>
            <Input
              id="stopLoss"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.stopLoss}
              onChange={(e) => setFormData((prev) => ({ ...prev, stopLoss: e.target.value }))}
              className="font-mono"
              data-testid="input-stop-loss"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="space-y-2">
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

          <div className="space-y-2">
            <Label htmlFor="emotion">Emozione</Label>
            <Select
              value={formData.emotion}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, emotion: value }))}
            >
              <SelectTrigger id="emotion" data-testid="select-emotion">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EMOTIONS.map((emotion) => (
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
                  <SelectValue placeholder="Aggiungi confluenza..." />
                </SelectTrigger>
                <SelectContent>
                  {defaultConfluencesPro
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
                  data-testid="input-custom-pro-tag"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={() => addConfluence("pro", newProTag)}
                  data-testid="button-add-pro-tag"
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
                  <SelectValue placeholder="Aggiungi confluenza..." />
                </SelectTrigger>
                <SelectContent>
                  {defaultConfluencesContro
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
                  data-testid="input-custom-contro-tag"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={() => addConfluence("contro", newControTag)}
                  data-testid="button-add-contro-tag"
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
            placeholder="Aggiungi note sul trade..."
            value={formData.notes}
            onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
            className="resize-none"
            rows={2}
            data-testid="input-notes"
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
              data-testid="input-image-url"
            />
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={() => addImageUrl(newImageUrl)}
              data-testid="button-add-image"
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
                    data-testid={`button-remove-image-${index}`}
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
            <Button type="button" variant="outline" onClick={onCancelEdit} data-testid="button-cancel-edit">
              Annulla
            </Button>
          )}
          <Button type="submit" data-testid="button-submit-trade">
            {editingTrade ? "Salva Modifiche" : "Salva Operazione"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
