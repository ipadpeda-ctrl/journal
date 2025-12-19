import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ConfluenceTag from "./ConfluenceTag";
import { Plus, Save, Copy, X } from "lucide-react";
import { useState, useEffect } from "react";

const tradeSchema = z.object({
  date: z.string().min(1, "Data richiesta"),
  time: z.string().optional(),
  // NEW: Exit fields
  exitDate: z.string().optional(),
  exitTime: z.string().optional(),
  pair: z.string().min(1, "Coppia richiesta"),
  direction: z.enum(["long", "short"]),
  target: z.string().min(1, "Target richiesto"),
  stopLoss: z.string().min(1, "Stop loss richiesto"),
  slPips: z.string().optional(),
  tpPips: z.string().optional(),
  rr: z.string().optional(),
  result: z.enum(["target", "stop_loss", "breakeven", "parziale", "non_fillato"]),
  pnl: z.string().optional(), // Now crucial
  emotion: z.string().optional(),
  confluencesPro: z.array(z.string()).default([]),
  confluencesContro: z.array(z.string()).default([]),
  imageUrls: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

export type TradeFormData = z.infer<typeof tradeSchema>;

interface TradeFormProps {
  onSubmit: (data: TradeFormData) => void;
  onDuplicate: (data: TradeFormData) => void;
  editingTrade?: TradeFormData & { id: string };
  onCancelEdit?: () => void;
  // FIX: Dynamic lists from props
  availablePairs: string[];
  availableEmotions: string[];
}

export default function TradeForm({ onSubmit, onDuplicate, editingTrade, onCancelEdit, availablePairs, availableEmotions }: TradeFormProps) {
  const form = useForm<TradeFormData>({
    resolver: zodResolver(tradeSchema),
    defaultValues: editingTrade || {
      date: new Date().toISOString().split("T")[0],
      time: new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }),
      exitDate: "",
      exitTime: "",
      pair: "",
      direction: "long",
      target: "",
      stopLoss: "",
      slPips: "",
      tpPips: "",
      rr: "",
      result: "non_fillato",
      pnl: "",
      emotion: "",
      confluencesPro: [],
      confluencesContro: [],
      imageUrls: [],
      notes: "",
    },
  });

  const [activeTab, setActiveTab] = useState("generale");
  const [confluenceProInput, setConfluenceProInput] = useState("");
  const [confluenceControInput, setConfluenceControInput] = useState("");
  const [imageUrlInput, setImageUrlInput] = useState("");

  useEffect(() => {
    if (editingTrade) {
      form.reset(editingTrade);
    }
  }, [editingTrade, form]);

  const addConfluence = (type: "pro" | "contro") => {
    const value = type === "pro" ? confluenceProInput : confluenceControInput;
    if (!value.trim()) return;
    const field = type === "pro" ? "confluencesPro" : "confluencesContro";
    const current = form.getValues(field);
    form.setValue(field, [...current, value.trim()]);
    if (type === "pro") setConfluenceProInput(""); else setConfluenceControInput("");
  };

  const removeConfluence = (type: "pro" | "contro", index: number) => {
    const field = type === "pro" ? "confluencesPro" : "confluencesContro";
    const current = form.getValues(field);
    form.setValue(field, current.filter((_, i) => i !== index));
  };

  const addImage = () => {
    if (!imageUrlInput.trim()) return;
    const current = form.getValues("imageUrls");
    form.setValue("imageUrls", [...current, imageUrlInput.trim()]);
    setImageUrlInput("");
  };

  return (
    <Card className="w-full max-w-4xl mx-auto border-t-4 border-t-primary shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between bg-muted/20 pb-4">
        <CardTitle>{editingTrade ? "Modifica Operazione" : "Nuova Operazione"}</CardTitle>
        <div className="flex gap-2">
          {editingTrade && (
            <Button variant="outline" size="sm" onClick={() => onDuplicate(form.getValues())}><Copy className="w-4 h-4 mr-2" />Duplica</Button>
          )}
          {onCancelEdit && (
            <Button variant="ghost" size="sm" onClick={onCancelEdit}><X className="w-4 h-4 mr-2" />Annulla</Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="generale">Dati Principali</TabsTrigger>
                <TabsTrigger value="analisi">Analisi & Confluenze</TabsTrigger>
                <TabsTrigger value="risultato">Esito & Note</TabsTrigger>
              </TabsList>

              <TabsContent value="generale" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <FormField control={form.control} name="date" render={({ field }) => (<FormItem><FormLabel>Data Ingresso</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="time" render={({ field }) => (<FormItem><FormLabel>Ora Ingresso</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  {/* NEW: Exit fields */}
                  <FormField control={form.control} name="exitDate" render={({ field }) => (<FormItem><FormLabel className="text-muted-foreground">Data Uscita</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="exitTime" render={({ field }) => (<FormItem><FormLabel className="text-muted-foreground">Ora Uscita</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <FormField control={form.control} name="pair" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Coppia</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Seleziona" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {availablePairs.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  
                  <FormField control={form.control} name="direction" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Direzione</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger className={field.value === "long" ? "text-emerald-500 font-medium" : "text-red-500 font-medium"}><SelectValue placeholder="Seleziona" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="long" className="text-emerald-500">Long (Buy)</SelectItem>
                          <SelectItem value="short" className="text-red-500">Short (Sell)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="result" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stato/Risultato</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Seleziona" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="non_fillato">In Corso / Pending</SelectItem>
                          <SelectItem value="target" className="text-emerald-500">Take Profit</SelectItem>
                          <SelectItem value="stop_loss" className="text-red-500">Stop Loss</SelectItem>
                          <SelectItem value="breakeven" className="text-yellow-500">Breakeven</SelectItem>
                          <SelectItem value="parziale" className="text-blue-500">Chiusura Parziale</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField control={form.control} name="target" render={({ field }) => (<FormItem><FormLabel>Target ($)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="stopLoss" render={({ field }) => (<FormItem><FormLabel>Stop Loss ($)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="pnl" render={({ field }) => (<FormItem><FormLabel className="font-bold text-primary">P&L Reale ($)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="Opzionale se aperto" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
              </TabsContent>

              <TabsContent value="analisi" className="space-y-6">
                 {/* (Existing analysis fields kept essentially the same but using availableEmotions) */}
                 <FormField control={form.control} name="emotion" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Emozione Prevalente</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Come ti sentivi?" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {availableEmotions.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <FormLabel className="text-emerald-500">Confluenze A Favore (Pro)</FormLabel>
                    <div className="flex gap-2">
                      <Input value={confluenceProInput} onChange={e => setConfluenceProInput(e.target.value)} placeholder="Es. Trendline..." onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addConfluence("pro"))} />
                      <Button type="button" size="icon" onClick={() => addConfluence("pro")} className="bg-emerald-500 hover:bg-emerald-600"><Plus className="w-4 h-4" /></Button>
                    </div>
                    <div className="flex flex-wrap gap-2 min-h-[40px] p-2 bg-muted/20 rounded-md">
                      {form.watch("confluencesPro").map((tag, i) => (<ConfluenceTag key={i} text={tag} type="pro" onRemove={() => removeConfluence("pro", i)} />))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <FormLabel className="text-red-500">Confluenze Contro</FormLabel>
                    <div className="flex gap-2">
                      <Input value={confluenceControInput} onChange={e => setConfluenceControInput(e.target.value)} placeholder="Es. Contro trend..." onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addConfluence("contro"))} />
                      <Button type="button" size="icon" onClick={() => addConfluence("contro")} variant="destructive"><Plus className="w-4 h-4" /></Button>
                    </div>
                    <div className="flex flex-wrap gap-2 min-h-[40px] p-2 bg-muted/20 rounded-md">
                      {form.watch("confluencesContro").map((tag, i) => (<ConfluenceTag key={i} text={tag} type="contro" onRemove={() => removeConfluence("contro", i)} />))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="risultato" className="space-y-4">
                 <FormField control={form.control} name="notes" render={({ field }) => (<FormItem><FormLabel>Note / Diario del Trade</FormLabel><FormControl><Textarea className="min-h-[150px]" placeholder="Cosa è successo? Cosa hai imparato?" {...field} /></FormControl><FormMessage /></FormItem>)} />
                 <div className="space-y-2"><FormLabel>Screenshot (URL)</FormLabel><div className="flex gap-2"><Input value={imageUrlInput} onChange={e => setImageUrlInput(e.target.value)} placeholder="https://..." /><Button type="button" onClick={addImage}>Aggiungi</Button></div><div className="space-y-2 mt-2">{form.watch("imageUrls").map((url, i) => (<div key={i} className="text-xs text-muted-foreground truncate p-1 bg-muted rounded flex justify-between items-center">{url} <Button type="button" variant="ghost" size="sm" onClick={() => { const curr = form.getValues("imageUrls"); form.setValue("imageUrls", curr.filter((_, idx) => idx !== i)); }}><X className="w-3 h-3" /></Button></div>))}</div></div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end pt-4 border-t">
              <Button type="submit" size="lg" className="w-full sm:w-auto"><Save className="w-4 h-4 mr-2" />{editingTrade ? "Aggiorna Operazione" : "Salva Operazione"}</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}