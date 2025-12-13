import { Card } from "@/components/ui/card";

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: "up" | "down" | "neutral";
}

export default function StatCard({ label, value, subValue, trend }: StatCardProps) {
  const trendColor = trend === "up" 
    ? "text-emerald-500" 
    : trend === "down" 
    ? "text-red-500" 
    : "text-muted-foreground";

  return (
    <Card className="p-4" data-testid={`stat-card-${label.toLowerCase().replace(/\s+/g, '-')}`}>
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
        {label}
      </p>
      <p className="text-3xl font-bold font-mono">{value}</p>
      {subValue && (
        <p className={`text-sm mt-1 ${trendColor}`}>{subValue}</p>
      )}
    </Card>
  );
}
