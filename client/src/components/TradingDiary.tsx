import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, Trash2, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import type { TradingDiary as DiaryType } from "@shared/schema";

const moods = [
  { value: "ottimo", label: "Ottimo", color: "bg-emerald-500" },
  { value: "buono", label: "Buono", color: "bg-green-500" },
  { value: "neutrale", label: "Neutrale", color: "bg-yellow-500" },
  { value: "difficile", label: "Difficile", color: "bg-orange-500" },
  { value: "pessimo", label: "Pessimo", color: "bg-red-500" },
];

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function formatDisplayDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export default function TradingDiary() {
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("");

  const { data: diaryEntries = [], isLoading } = useQuery<DiaryType[]>({
    queryKey: ["/api/diary"],
  });

  const currentEntry = diaryEntries.find((d) => d.date === selectedDate);

  const saveMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/diary", {
        date: selectedDate,
        content,
        mood,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/diary"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/diary/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/diary"] });
      setContent("");
      setMood("");
    },
  });

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    const entry = diaryEntries.find((d) => d.date === newDate);
    if (entry) {
      setContent(entry.content || "");
      setMood(entry.mood || "");
    } else {
      setContent("");
      setMood("");
    }
  };

  const navigateDay = (direction: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + direction);
    handleDateChange(formatDate(date));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-chart-1" />
          <h2 className="text-xl font-semibold">Diario di Trading</h2>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {diaryEntries.length} note salvate
          </Badge>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigateDay(-1)}
                    data-testid="button-prev-day"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="w-40"
                    data-testid="input-diary-date"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigateDay(1)}
                    data-testid="button-next-day"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
                <span className="text-sm text-muted-foreground">
                  {formatDisplayDate(selectedDate)}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Come ti sei sentito oggi?</Label>
                <Select value={mood} onValueChange={setMood}>
                  <SelectTrigger data-testid="select-mood">
                    <SelectValue placeholder="Seleziona il tuo stato d'animo" />
                  </SelectTrigger>
                  <SelectContent>
                    {moods.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${m.color}`} />
                          {m.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Note del giorno</Label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Scrivi le tue riflessioni sulla giornata di trading...&#10;&#10;- Cosa hai fatto bene?&#10;- Cosa potresti migliorare?&#10;- Lezioni apprese?"
                  className="min-h-[200px] resize-none"
                  data-testid="input-diary-content"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <div>
                  {currentEntry && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(currentEntry.id)}
                      disabled={deleteMutation.isPending}
                      className="text-destructive"
                      data-testid="button-delete-diary"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Elimina
                    </Button>
                  )}
                </div>
                <Button
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending || (!content && !mood)}
                  data-testid="button-save-diary"
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Salva
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Note Recenti</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {diaryEntries.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nessuna nota salvata
                  </p>
                ) : (
                  diaryEntries.slice(0, 10).map((entry) => {
                    const moodInfo = moods.find((m) => m.value === entry.mood);
                    return (
                      <button
                        key={entry.id}
                        onClick={() => handleDateChange(entry.date)}
                        className={`w-full text-left p-3 rounded-md border transition-colors hover-elevate ${
                          entry.date === selectedDate ? "bg-accent" : ""
                        }`}
                        data-testid={`diary-entry-${entry.id}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium">{entry.date}</span>
                          {moodInfo && (
                            <div className={`w-2 h-2 rounded-full ${moodInfo.color}`} />
                          )}
                        </div>
                        {entry.content && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {entry.content}
                          </p>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
