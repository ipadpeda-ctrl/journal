import { Card } from "@/components/ui/card";
import { Trade } from "./TradesTable";
import { CheckCircle, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface MetricsCardsProps {
  trades: Trade[];
}

interface MetricCardProps {
  label: string;
  value: string;
  color: "green" | "blue" | "teal" | "red";
  tooltip: string;
}

function MetricCard({ label, value, color, tooltip }: MetricCardProps) {
  const colorClasses = {
    green: "bg-emerald-600",
    blue: "bg-blue-600",
    teal: "bg-teal-600",
    red: "bg-red-800",
  };

  return (
    <Card className={`p-4 ${colorClasses[color]} text-white`}>
      <div className="flex items-center justify-center mb-2">
        <CheckCircle className="w-5 h-5" />
      </div>
      <p className="text-3xl font-bold text-center font-mono">{value}</p>
      <div className="flex items-center justify-center gap-1 mt-2">
        <span className="text-sm opacity-90">{label}</span>
        <Tooltip>
          <TooltipTrigger>
            <Info className="w-3 h-3 opacity-70" />
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-48 text-xs">{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </Card>
  );
}

export default function MetricsCards({ trades }: MetricsCardsProps) {
  const wins = trades.filter((t) => t.result === "target" || t.result === "parziale");
  const losses = trades.filter((t) => t.result === "stop_loss");

  const totalWinAmount = wins.reduce((acc, t) => {
    if (t.result === "target") return acc + t.target;
    return acc + (t.target * 0.5);
  }, 0);

  const totalLossAmount = losses.reduce((acc, t) => acc + t.stopLoss, 0);

  const profitFactor = totalLossAmount > 0 
    ? (totalWinAmount / totalLossAmount).toFixed(2) 
    : totalWinAmount > 0 ? "∞" : "0.00";

  const avgWin = wins.length > 0 
    ? (totalWinAmount / wins.length).toFixed(2) 
    : "0.00";

  const avgLoss = losses.length > 0 
    ? (totalLossAmount / losses.length).toFixed(2) 
    : "0.00";

  const riskReward = parseFloat(avgLoss) > 0 
    ? (parseFloat(avgWin) / parseFloat(avgLoss)).toFixed(2) 
    : avgWin;

  const winRate = trades.length > 0 
    ? (wins.length / trades.length) 
    : 0;

  const expectancy = trades.length > 0
    ? ((winRate * parseFloat(avgWin)) - ((1 - winRate) * parseFloat(avgLoss))).toFixed(2)
    : "0.00";

  const avgLossPercent = losses.length > 0
    ? `-${(totalLossAmount / losses.length).toFixed(0)}%`
    : "0%";

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        label="Profit Factor"
        value={profitFactor}
        color="green"
        tooltip="Rapporto tra profitti totali e perdite totali. Un valore sopra 1.5 è considerato buono."
      />
      <MetricCard
        label="Risk Reward medio"
        value={riskReward}
        color="blue"
        tooltip="Rapporto medio tra guadagno e rischio per trade. Un valore sopra 2 indica un buon risk management."
      />
      <MetricCard
        label="Expectancy"
        value={`${parseFloat(expectancy) >= 0 ? "" : ""}${expectancy}%`}
        color="teal"
        tooltip="Guadagno medio atteso per ogni trade. Valore positivo indica strategia profittevole."
      />
      <MetricCard
        label="Perdita media"
        value={avgLossPercent}
        color="red"
        tooltip="Perdita media per ogni trade in perdita."
      />
    </div>
  );
}
