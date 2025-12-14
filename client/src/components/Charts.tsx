import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  Brush,
  ReferenceArea,
} from "recharts";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

function ChartCard({ title, children, className = "" }: ChartCardProps) {
  return (
    <Card className={`p-4 ${className}`}>
      <h3 className="text-sm font-medium mb-4">{title}</h3>
      <div className="h-64">{children}</div>
    </Card>
  );
}

interface TradeDistributionData {
  target: number;
  stopLoss: number;
  breakeven: number;
}

export function TradeDistributionChart({ data }: { data: TradeDistributionData }) {
  const chartData = [
    { name: "Target", value: data.target, fill: "hsl(142, 71%, 45%)" },
    { name: "Stop Loss", value: data.stopLoss, fill: "hsl(0, 84%, 60%)" },
    { name: "Breakeven", value: data.breakeven, fill: "hsl(45, 93%, 47%)" },
  ];

  return (
    <ChartCard title="Distribuzione Trade">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} width={80} />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "6px",
            }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

interface DirectionData {
  long: number;
  short: number;
}

export function DirectionChart({ data }: { data: DirectionData }) {
  const chartData = [
    { name: "Long", value: data.long, fill: "hsl(142, 71%, 45%)" },
    { name: "Short", value: data.short, fill: "hsl(0, 84%, 60%)" },
  ];
  const total = data.long + data.short;

  return (
    <ChartCard title="Distribuzione Direzione (Long vs Short)">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "6px",
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

interface WinRateData {
  wins: number;
  losses: number;
}

export function WinRateChart({ data }: { data: WinRateData }) {
  const total = data.wins + data.losses;
  const winRate = total > 0 ? ((data.wins / total) * 100).toFixed(1) : "0";
  const chartData = [
    { name: "Win", value: data.wins, fill: "hsl(142, 71%, 45%)" },
    { name: "Loss", value: data.losses, fill: "hsl(0, 84%, 60%)" },
  ];

  return (
    <ChartCard title="Win Rate">
      <div className="relative h-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-3xl font-bold font-mono">{winRate}%</span>
        </div>
      </div>
    </ChartCard>
  );
}

interface EquityPoint {
  date: string;
  equity: number;
  fullDate?: string;
}

interface EquityCurveChartProps {
  data: EquityPoint[];
  startDate?: string;
  endDate?: string;
  onDateRangeChange?: (start: string, end: string) => void;
}

export function EquityCurveChart({ data, startDate, endDate, onDateRangeChange }: EquityCurveChartProps) {
  const [localStartDate, setLocalStartDate] = useState(startDate || "");
  const [localEndDate, setLocalEndDate] = useState(endDate || "");
  const [refAreaLeft, setRefAreaLeft] = useState<string | null>(null);
  const [refAreaRight, setRefAreaRight] = useState<string | null>(null);
  const [zoomedData, setZoomedData] = useState<EquityPoint[] | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  const displayData = zoomedData || data;

  const handleMouseDown = (e: any) => {
    if (e && e.activeLabel) {
      setRefAreaLeft(e.activeLabel);
      setIsSelecting(true);
    }
  };

  const handleMouseMove = (e: any) => {
    if (isSelecting && e && e.activeLabel) {
      setRefAreaRight(e.activeLabel);
    }
  };

  const handleMouseUp = () => {
    if (refAreaLeft && refAreaRight) {
      const leftIndex = data.findIndex((d) => d.date === refAreaLeft);
      const rightIndex = data.findIndex((d) => d.date === refAreaRight);
      
      if (leftIndex !== -1 && rightIndex !== -1) {
        const startIdx = Math.min(leftIndex, rightIndex);
        const endIdx = Math.max(leftIndex, rightIndex);
        
        if (endIdx - startIdx >= 1) {
          setZoomedData(data.slice(startIdx, endIdx + 1));
        }
      }
    }
    setRefAreaLeft(null);
    setRefAreaRight(null);
    setIsSelecting(false);
  };

  const handleResetZoom = () => {
    setZoomedData(null);
  };

  const handleApplyFilter = () => {
    if (onDateRangeChange && localStartDate && localEndDate) {
      onDateRangeChange(localStartDate, localEndDate);
    }
  };

  const handleResetFilter = () => {
    setLocalStartDate("");
    setLocalEndDate("");
    setZoomedData(null);
    if (onDateRangeChange) {
      onDateRangeChange("", "");
    }
  };

  return (
    <Card className="p-4 lg:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h3 className="text-sm font-medium">Equity Curve</h3>
        
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="startDate" className="text-xs text-muted-foreground">Da:</Label>
            <Input
              id="startDate"
              type="date"
              value={localStartDate}
              onChange={(e) => setLocalStartDate(e.target.value)}
              className="h-8 w-32 text-xs"
              data-testid="input-chart-start-date"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="endDate" className="text-xs text-muted-foreground">A:</Label>
            <Input
              id="endDate"
              type="date"
              value={localEndDate}
              onChange={(e) => setLocalEndDate(e.target.value)}
              className="h-8 w-32 text-xs"
              data-testid="input-chart-end-date"
            />
          </div>
          
          {zoomedData && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetZoom}
              className="h-8"
              data-testid="button-reset-zoom"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Reset Zoom
            </Button>
          )}
        </div>
      </div>
      
      <p className="text-xs text-muted-foreground mb-2">
        Trascina sul grafico per zoomare in un'area specifica
      </p>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={displayData}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={['auto', 'auto']} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
              }}
              formatter={(value: number) => [`${value.toFixed(2)} EUR`, "Equity"]}
            />
            <Line
              type="monotone"
              dataKey="equity"
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
              dot={{ fill: "hsl(var(--chart-1))", strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5, fill: "hsl(var(--chart-1))" }}
            />
            {refAreaLeft && refAreaRight && (
              <ReferenceArea
                x1={refAreaLeft}
                x2={refAreaRight}
                strokeOpacity={0.3}
                fill="hsl(var(--primary))"
                fillOpacity={0.2}
              />
            )}
            <Brush
              dataKey="date"
              height={25}
              stroke="hsl(var(--primary))"
              fill="hsl(var(--muted))"
              tickFormatter={(val) => val}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

interface EmotionData {
  emotion: string;
  count: number;
}

export function EmotionalFrequencyChart({ data }: { data: EmotionData[] }) {
  return (
    <ChartCard title="Frequenza Emotiva" className="lg:col-span-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="emotion" stroke="hsl(var(--muted-foreground))" fontSize={11} angle={-45} textAnchor="end" height={60} />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "6px",
            }}
          />
          <Bar dataKey="count" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
