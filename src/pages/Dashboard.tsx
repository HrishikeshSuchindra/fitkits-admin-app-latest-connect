import { useState } from "react";
import { DollarSign, CalendarCheck, Percent, Users } from "lucide-react";
import { MobileHeader } from "@/components/ui/MobileHeader";
import { KPICard } from "@/components/ui/KPICard";
import { DateRangeSelector } from "@/components/ui/DateRangeSelector";
import { HeatmapGrid } from "@/components/ui/HeatmapGrid";
import { TopUsersList } from "@/components/ui/TopUsersList";
import { BottomNav } from "@/components/ui/BottomNav";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const venuePerformanceData = [
  { name: "Studio A", value: 4200, fill: "hsl(var(--primary))" },
  { name: "Loft B", value: 3100, fill: "hsl(var(--success))" },
  { name: "Hall C", value: 2800, fill: "hsl(var(--warning))" },
  { name: "Room D", value: 1900, fill: "hsl(var(--primary)/0.6)" },
];

const heatmapData = [
  [20, 40, 80, 60, 40, 20], // Mon
  [30, 50, 90, 70, 50, 30], // Tue
  [40, 60, 100, 80, 60, 40], // Wed
  [35, 55, 85, 65, 45, 25], // Thu
  [50, 70, 95, 75, 55, 35], // Fri
  [60, 80, 100, 90, 70, 50], // Sat
  [40, 50, 70, 60, 40, 20], // Sun
];

const topUsers = [
  { id: "1", name: "Sarah Johnson", bookings: 24, revenue: 4820, avatar: "" },
  { id: "2", name: "Michael Chen", bookings: 18, revenue: 3650, avatar: "" },
  { id: "3", name: "Emma Wilson", bookings: 15, revenue: 2940, avatar: "" },
  { id: "4", name: "James Brown", bookings: 12, revenue: 2280, avatar: "" },
];

const dateRangeOptions = ["Last 7 Days", "Last 30 Days", "Last 90 Days", "This Year"];

export default function Dashboard() {
  const [dateRange, setDateRange] = useState("Last 7 Days");

  return (
    <div className="mobile-container pb-24">
      <MobileHeader title="Business Insights" showNotification />

      <div className="mobile-padding space-y-6 py-4">
        {/* Date Range Selector */}
        <DateRangeSelector
          value={dateRange}
          options={dateRangeOptions}
          onChange={setDateRange}
        />

        {/* KPI Grid */}
        <div className="grid grid-cols-2 gap-3">
          <KPICard
            label="Total Revenue"
            value="$12,540"
            icon={DollarSign}
            iconBgColor="bg-success-light"
            iconColor="text-success"
            growth={12.5}
          />
          <KPICard
            label="Total Bookings"
            value="156"
            icon={CalendarCheck}
            iconBgColor="bg-primary-light"
            iconColor="text-primary"
            growth={8.2}
          />
          <KPICard
            label="Occupancy Rate"
            value="78%"
            icon={Percent}
            iconBgColor="bg-warning-light"
            iconColor="text-warning"
            growth={-2.1}
          />
          <KPICard
            label="New Users"
            value="42"
            icon={Users}
            iconBgColor="bg-accent"
            iconColor="text-accent-foreground"
            growth={15.8}
          />
        </div>

        {/* Heatmap */}
        <HeatmapGrid data={heatmapData} />

        {/* Venue Performance */}
        <div className="card-elevated p-4">
          <h3 className="font-semibold text-foreground mb-4">Performance by Venue</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={venuePerformanceData}
                layout="vertical"
                margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  width={70}
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    boxShadow: "var(--shadow-md)",
                  }}
                  formatter={(value: number) => [`$${value}`, "Revenue"]}
                />
                <Bar
                  dataKey="value"
                  radius={[0, 6, 6, 0]}
                  maxBarSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Users */}
        <TopUsersList users={topUsers} />
      </div>

      <BottomNav />
    </div>
  );
}
