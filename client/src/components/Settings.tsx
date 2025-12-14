import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Save, Wallet, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SettingsProps {
  pairs: string[];
  emotions: string[];
  confluencesPro: string[];
  confluencesContro: string[];
  initialCapital?: number;
  onSave?: (settings: SettingsData) => void;
}

export interface SettingsData {
  pairs: string[];
  emotions: string[];
  confluencesPro: string[];
  confluencesContro: string[];
}

export default function Settings({
  pairs: initialPairs,
  emotions: initialEmotions,
  confluencesPro: initialConfluencesPro,
  confluencesContro: initialConfluencesContro,
  initialCapital = 10000,
  onSave,
}: SettingsProps) {
  const { toast } = useToast();
  const [pairs, setPairs] = useState(initialPairs);
  const [emotions, setEmotions] = useState(initialEmotions);
  const [confluencesPro, setConfluencesPro] = useState(initialConfluencesPro);
  const [confluencesContro, setConfluencesContro] = useState(initialConfluencesContro);
  const [capital, setCapital] = useState(initialCapital);

  useEffect(() => {
    setCapital(initialCapital);
  }, [initialCapital]);

  const [newPair, setNewPair] = useState("");
  const [newEmotion, setNewEmotion] = useState("");
  const [newProConfluence, setNewProConfluence] = useState("");
  const [newControConfluence, setNewControConfluence] = useState("");

  const updateCapitalMutation = useMutation({
    mutationFn: async (newCapital: number) => {
      const res = await apiRequest("PATCH", "/api/auth/user/capital", { initialCapital: newCapital });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Capitale iniziale salvato" });
    },
    onError: () => {
      toast({ title: "Errore nel salvare il capitale", variant: "destructive" });
    },
  });

  const addItem = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    value: string,
    clearInput: () => void
  ) => {
    if (value.trim()) {
      setter((prev) => [...prev, value.trim()]);
      clearInput();
    }
  };

  const removeItem = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    value: string
  ) => {
    setter((prev) => prev.filter((item) => item !== value));
  };

  const handleSave = () => {
    onSave?.({ pairs, emotions, confluencesPro, confluencesContro });
    console.log("Settings saved:", { pairs, emotions, confluencesPro, confluencesContro });
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Wallet className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-medium">Capitale Iniziale</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Inserisci il tuo capitale iniziale. Questo valore sarà usato per calcolare statistiche, proiezioni e grafici.
        </p>
        <div className="flex gap-2 items-end">
          <div className="flex-1 max-w-xs">
            <Label htmlFor="initial-capital">Capitale (EUR)</Label>
            <Input
              id="initial-capital"
              type="number"
              min={0}
              step={100}
              value={capital}
              onChange={(e) => setCapital(parseFloat(e.target.value) || 0)}
              data-testid="input-initial-capital"
            />
          </div>
          <Button
            onClick={() => updateCapitalMutation.mutate(capital)}
            disabled={updateCapitalMutation.isPending}
            data-testid="button-save-capital"
          >
            {updateCapitalMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Salva
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-medium mb-4">Coppie di Trading</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {pairs.map((pair) => (
            <Badge key={pair} variant="secondary" className="gap-1" data-testid={`badge-pair-${pair}`}>
              {pair}
              <button onClick={() => removeItem(setPairs, pair)} className="hover:opacity-70">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Nuova coppia (es. EURJPY)"
            value={newPair}
            onChange={(e) => setNewPair(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && addItem(setPairs, newPair, () => setNewPair(""))}
            className="max-w-xs"
            data-testid="input-new-pair"
          />
          <Button
            variant="outline"
            onClick={() => addItem(setPairs, newPair, () => setNewPair(""))}
            data-testid="button-add-pair"
          >
            <Plus className="w-4 h-4 mr-2" />
            Aggiungi
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-medium mb-4">Emozioni</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {emotions.map((emotion) => (
            <Badge key={emotion} variant="secondary" className="gap-1" data-testid={`badge-emotion-${emotion}`}>
              {emotion}
              <button onClick={() => removeItem(setEmotions, emotion)} className="hover:opacity-70">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Nuova emozione"
            value={newEmotion}
            onChange={(e) => setNewEmotion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addItem(setEmotions, newEmotion, () => setNewEmotion(""))}
            className="max-w-xs"
            data-testid="input-new-emotion"
          />
          <Button
            variant="outline"
            onClick={() => addItem(setEmotions, newEmotion, () => setNewEmotion(""))}
            data-testid="button-add-emotion"
          >
            <Plus className="w-4 h-4 mr-2" />
            Aggiungi
          </Button>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-medium mb-4">Confluenze PRO</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {confluencesPro.map((conf) => (
              <Badge
                key={conf}
                variant="secondary"
                className="gap-1 bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                data-testid={`badge-pro-${conf}`}
              >
                {conf}
                <button onClick={() => removeItem(setConfluencesPro, conf)} className="hover:opacity-70">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Nuova confluenza PRO"
              value={newProConfluence}
              onChange={(e) => setNewProConfluence(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && addItem(setConfluencesPro, newProConfluence, () => setNewProConfluence(""))
              }
              className="flex-1"
              data-testid="input-new-pro-confluence"
            />
            <Button
              size="icon"
              variant="outline"
              onClick={() => addItem(setConfluencesPro, newProConfluence, () => setNewProConfluence(""))}
              data-testid="button-add-pro-confluence"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-medium mb-4">Confluenze CONTRO</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {confluencesContro.map((conf) => (
              <Badge
                key={conf}
                variant="secondary"
                className="gap-1 bg-red-500/20 text-red-400 border-red-500/30"
                data-testid={`badge-contro-${conf}`}
              >
                {conf}
                <button onClick={() => removeItem(setConfluencesContro, conf)} className="hover:opacity-70">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Nuova confluenza CONTRO"
              value={newControConfluence}
              onChange={(e) => setNewControConfluence(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && addItem(setConfluencesContro, newControConfluence, () => setNewControConfluence(""))
              }
              className="flex-1"
              data-testid="input-new-contro-confluence"
            />
            <Button
              size="icon"
              variant="outline"
              onClick={() => addItem(setConfluencesContro, newControConfluence, () => setNewControConfluence(""))}
              data-testid="button-add-contro-confluence"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} data-testid="button-save-settings">
          <Save className="w-4 h-4 mr-2" />
          Salva Impostazioni
        </Button>
      </div>
    </div>
  );
}
