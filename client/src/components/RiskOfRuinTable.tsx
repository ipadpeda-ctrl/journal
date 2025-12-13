import { Card } from "@/components/ui/card";
import { Trade } from "./TradesTable";

interface RiskOfRuinTableProps {
  trades: Trade[];
}

export default function RiskOfRuinTable({ trades }: RiskOfRuinTableProps) {
  const winTrades = trades.filter((t) => t.result === "target" || t.result === "parziale");
  const lossTrades = trades.filter((t) => t.result === "stop_loss");
  const totalTrades = winTrades.length + lossTrades.length;

  const winRate = totalTrades > 0 ? winTrades.length / totalTrades : 0.5;
  const avgWin = winTrades.length > 0
    ? winTrades.reduce((sum, t) => sum + (t.result === "parziale" ? t.target * 0.5 : t.target), 0) / winTrades.length
    : 2;
  const avgLoss = lossTrades.length > 0
    ? lossTrades.reduce((sum, t) => sum + t.stopLoss, 0) / lossTrades.length
    : 1;

  const payoffRatio = avgLoss > 0 ? avgWin / avgLoss : 2;

  const calculateRiskOfRuin = (riskPercent: number): number => {
    if (totalTrades === 0) return 0;
    
    const p = winRate;
    const q = 1 - p;
    const R = payoffRatio;
    
    const edge = (p * R) - q;
    if (edge <= 0) return 100;
    
    const unitsToRuin = Math.floor(100 / riskPercent);
    
    if (R === 1) {
      const a = q / p;
      if (a >= 1) return 100;
      return Math.min(100, Math.pow(a, unitsToRuin) * 100);
    }
    
    const lossProb = q / (p * R);
    if (lossProb >= 1) return 100;
    
    const ror = Math.pow(lossProb, unitsToRuin);
    return Math.min(100, ror * 100);
  };

  const riskLevels = [0.5, 1, 2, 3, 5];
  const ruinData = riskLevels.map((risk) => ({
    risk: `${risk}%`,
    ror: calculateRiskOfRuin(risk),
  }));

  const getRiskColor = (ror: number): string => {
    if (ror < 1) return "text-emerald-500";
    if (ror < 5) return "text-emerald-400";
    if (ror < 10) return "text-yellow-500";
    if (ror < 25) return "text-orange-500";
    return "text-red-500";
  };

  const getRiskBgColor = (ror: number): string => {
    if (ror < 1) return "bg-emerald-500/10";
    if (ror < 5) return "bg-emerald-400/10";
    if (ror < 10) return "bg-yellow-500/10";
    if (ror < 25) return "bg-orange-500/10";
    return "bg-red-500/10";
  };

  return (
    <Card className="p-4" data-testid="risk-of-ruin">
      <h3 className="text-sm font-medium mb-4">Risk of Ruin</h3>
      <div className="space-y-3">
        <div className="grid grid-cols-5 gap-2 text-center">
          {ruinData.map((item, index) => (
            <div key={index} className={`p-3 rounded-md ${getRiskBgColor(item.ror)}`}>
              <p className="text-xs text-muted-foreground mb-1">Rischio</p>
              <p className="text-sm font-medium">{item.risk}</p>
              <p className={`text-lg font-bold mt-1 ${getRiskColor(item.ror)}`}>
                {item.ror < 0.01 ? "<0.01" : item.ror.toFixed(2)}%
              </p>
            </div>
          ))}
        </div>
        <div className="pt-3 border-t">
          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Win Rate</p>
              <p className="font-mono font-medium">{(winRate * 100).toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avg Win</p>
              <p className="font-mono font-medium text-emerald-500">+{avgWin.toFixed(2)}%</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avg Loss</p>
              <p className="font-mono font-medium text-red-500">-{avgLoss.toFixed(2)}%</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
