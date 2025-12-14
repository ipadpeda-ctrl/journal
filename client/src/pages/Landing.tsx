import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, BarChart3, Target, BookOpen } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">Trading Journal</span>
          </div>
          <Button asChild data-testid="button-login">
            <a href="/api/login">Accedi</a>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4" data-testid="text-hero-title">
            Migliora il tuo trading con dati concreti
          </h1>
          <p className="text-xl text-muted-foreground mb-8" data-testid="text-hero-description">
            Registra le tue operazioni, analizza le tue performance e sviluppa strategie vincenti con il nostro diario di trading professionale.
          </p>
          <Button size="lg" asChild data-testid="button-cta">
            <a href="/api/login">Inizia Ora</a>
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
          <Card>
            <CardHeader>
              <BarChart3 className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Statistiche Avanzate</CardTitle>
              <CardDescription>
                Win rate, drawdown, streak e performance dettagliate per ogni periodo
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Target className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Obiettivi Mensili</CardTitle>
              <CardDescription>
                Imposta e monitora i tuoi obiettivi di trading con tracciamento in tempo reale
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <BookOpen className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Diario Personale</CardTitle>
              <CardDescription>
                Annota pensieri, emozioni e lezioni apprese per migliorare costantemente
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <TrendingUp className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Analisi Confluenze</CardTitle>
              <CardDescription>
                Traccia i fattori pro e contro di ogni operazione per affinare la tua strategia
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>
    </div>
  );
}
