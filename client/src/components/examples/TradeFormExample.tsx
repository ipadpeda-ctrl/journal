import TradeForm from "../TradeForm";

export default function TradeFormExample() {
  return (
    <TradeForm
      onSubmit={(data) => console.log("Trade submitted:", data)}
      onDuplicate={() => console.log("Duplicate last trade")}
    />
  );
}
