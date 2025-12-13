import {
  TradeDistributionChart,
  DirectionChart,
  WinRateChart,
  EquityCurveChart,
  EmotionalFrequencyChart,
} from "../Charts";

// todo: remove mock functionality
const tradeDistributionData = { target: 11, stopLoss: 4, breakeven: 2 };
const directionData = { long: 9, short: 8 };
const winRateData = { wins: 11, losses: 4 };
const equityData = [
  { date: "01/12", equity: 1000 },
  { date: "03/12", equity: 1050 },
  { date: "05/12", equity: 1020 },
  { date: "07/12", equity: 1150 },
  { date: "09/12", equity: 1200 },
  { date: "11/12", equity: 1180 },
  { date: "13/12", equity: 1250 },
];
const emotionData = [
  { emotion: "FOMO", count: 2 },
  { emotion: "Rabbia", count: 1 },
  { emotion: "Neutrale", count: 5 },
  { emotion: "Vendetta", count: 0 },
  { emotion: "Speranza", count: 1 },
  { emotion: "Fiducioso", count: 4 },
  { emotion: "Impaziente", count: 2 },
  { emotion: "Paura", count: 0 },
  { emotion: "Sicuro", count: 2 },
  { emotion: "Stress", count: 0 },
];

export default function ChartsExample() {
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <TradeDistributionChart data={tradeDistributionData} />
      <DirectionChart data={directionData} />
      <WinRateChart data={winRateData} />
      <div className="lg:col-span-2">
        <EquityCurveChart data={equityData} />
      </div>
      <div className="lg:col-span-2">
        <EmotionalFrequencyChart data={emotionData} />
      </div>
    </div>
  );
}
