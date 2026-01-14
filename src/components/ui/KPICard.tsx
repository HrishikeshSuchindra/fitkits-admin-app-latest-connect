import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface KPICardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconBgColor?: string;
  iconColor?: string;
  growth?: number;
  growthLabel?: string;
  className?: string;
}

export function KPICard({
  label,
  value,
  icon: Icon,
  iconBgColor = "bg-primary-light",
  iconColor = "text-primary",
  growth,
  growthLabel = "vs last period",
  className,
}: KPICardProps) {
  const isPositive = growth !== undefined && growth >= 0;

  return (
    <div className={cn("card-elevated p-4 animate-fade-in", className)}>
      <div className="flex items-start justify-between mb-3">
        <div className={cn("icon-container", iconBgColor)}>
          <Icon className={cn("w-5 h-5", iconColor)} />
        </div>
      </div>
      
      <p className="metric-label mb-1">{label}</p>
      <p className="metric-value">{value}</p>
      
      {growth !== undefined && (
        <div className={cn("mt-2 flex items-center gap-1", isPositive ? "growth-positive" : "growth-negative")}>
          {isPositive ? (
            <TrendingUp className="w-3.5 h-3.5" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5" />
          )}
          <span>{isPositive ? "+" : ""}{growth}%</span>
          <span className="text-muted-foreground ml-1">{growthLabel}</span>
        </div>
      )}
    </div>
  );
}
