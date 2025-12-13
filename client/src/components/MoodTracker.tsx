import { Card } from "@/components/ui/card";
import { Trade } from "./TradesTable";

interface MoodTrackerProps {
  trades: Trade[];
}

export default function MoodTracker({ trades }: MoodTrackerProps) {
  const emotionCounts: Record<string, number> = {};
  
  for (const trade of trades) {
    emotionCounts[trade.emotion] = (emotionCounts[trade.emotion] || 0) + 1;
  }

  const total = trades.length;
  const emotions = Object.entries(emotionCounts)
    .map(([emotion, count]) => ({
      emotion,
      count,
      percent: total > 0 ? ((count / total) * 100).toFixed(0) : "0",
    }))
    .sort((a, b) => b.count - a.count);

  const getBarColor = (emotion: string): string => {
    const colors: Record<string, string> = {
      "Neutrale": "bg-emerald-500",
      "Fiducioso": "bg-emerald-400",
      "Sicuro": "bg-emerald-600",
      "FOMO": "bg-blue-500",
      "Impaziente": "bg-blue-400",
      "Speranza": "bg-yellow-500",
      "Paura": "bg-orange-500",
      "Stress": "bg-orange-400",
      "Rabbia": "bg-red-500",
      "Vendetta": "bg-red-600",
    };
    return colors[emotion] || "bg-chart-3";
  };

  return (
    <Card className="p-4">
      <h3 className="text-sm font-medium mb-1">Mood Tracker</h3>
      <p className="text-xs text-muted-foreground mb-4">Percentuale di trade per ogni MoodTag</p>

      <div className="space-y-3">
        {emotions.map(({ emotion, count, percent }) => (
          <div key={emotion} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span>{emotion}</span>
              <span className="text-muted-foreground">{percent}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full ${getBarColor(emotion)} rounded-full transition-all`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        ))}

        {emotions.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nessun dato disponibile
          </p>
        )}
      </div>
    </Card>
  );
}
