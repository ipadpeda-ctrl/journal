import TradesTable, { Trade } from "../TradesTable";

// todo: remove mock functionality
const mockTrades: Trade[] = [
  {
    id: "1",
    date: "2024-12-10",
    time: "09:30",
    pair: "EURUSD",
    direction: "long",
    target: 1.75,
    stopLoss: 0.5,
    result: "target",
    emotion: "Fiducioso",
    confluencesPro: ["Trend forte", "Supporto testato"],
    confluencesContro: ["Notizie in arrivo"],
  },
  {
    id: "2",
    date: "2024-12-10",
    time: "14:15",
    pair: "GBPUSD",
    direction: "short",
    target: 1.5,
    stopLoss: 0.75,
    result: "stop_loss",
    emotion: "FOMO",
    confluencesPro: ["Pattern chiaro"],
    confluencesContro: ["Contro trend", "Bassa liquidità"],
  },
  {
    id: "3",
    date: "2024-12-11",
    time: "10:00",
    pair: "USDJPY",
    direction: "long",
    target: 2.0,
    stopLoss: 0.6,
    result: "breakeven",
    emotion: "Neutrale",
    confluencesPro: ["Volume alto", "Livello chiave"],
    confluencesContro: [],
  },
  {
    id: "4",
    date: "2024-12-11",
    time: "16:45",
    pair: "EURUSD",
    direction: "short",
    target: 1.25,
    stopLoss: 0.4,
    result: "target",
    emotion: "Sicuro",
    confluencesPro: ["Trend forte", "Pattern chiaro", "Volume alto"],
    confluencesContro: ["Orario sfavorevole"],
  },
];

export default function TradesTableExample() {
  return (
    <TradesTable
      trades={mockTrades}
      onEdit={(trade) => console.log("Edit trade:", trade)}
      onDelete={(id) => console.log("Delete trade:", id)}
    />
  );
}
