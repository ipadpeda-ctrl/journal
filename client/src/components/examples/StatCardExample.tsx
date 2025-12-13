import StatCard from "../StatCard";

export default function StatCardExample() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="Total Operations" value={15} />
      <StatCard label="Win Rate" value="73.3%" trend="up" subValue="+5.2% vs last month" />
      <StatCard label="Profit Factor" value="2.45" trend="up" />
      <StatCard label="Total Equity" value="1,250.00" subValue="EUR" />
    </div>
  );
}
