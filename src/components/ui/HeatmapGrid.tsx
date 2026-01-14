import { cn } from "@/lib/utils";

interface HeatmapGridProps {
  data: number[][]; // 7 days x time slots
  days?: string[];
  timeSlots?: string[];
  className?: string;
}

export function HeatmapGrid({
  data,
  days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  timeSlots = ["6AM", "9AM", "12PM", "3PM", "6PM", "9PM"],
  className,
}: HeatmapGridProps) {
  const getHeatLevel = (value: number): string => {
    if (value === 0) return "bg-muted";
    if (value <= 20) return "bg-primary/20";
    if (value <= 40) return "bg-primary/40";
    if (value <= 60) return "bg-primary/60";
    if (value <= 80) return "bg-primary/80";
    return "bg-primary";
  };

  return (
    <div className={cn("card-elevated p-4", className)}>
      <h3 className="font-semibold text-foreground mb-4">Peak Hours Heatmap</h3>
      
      <div className="overflow-x-auto">
        <div className="min-w-[300px]">
          {/* Days Header */}
          <div className="grid grid-cols-8 gap-1 mb-1">
            <div className="w-10" /> {/* Empty corner */}
            {days.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-muted-foreground py-1"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Time Rows */}
          {timeSlots.map((time, timeIndex) => (
            <div key={time} className="grid grid-cols-8 gap-1 mb-1">
              <div className="w-10 text-xs text-muted-foreground flex items-center justify-end pr-2">
                {time}
              </div>
              {days.map((_, dayIndex) => (
                <div
                  key={`${timeIndex}-${dayIndex}`}
                  className={cn(
                    "aspect-square rounded-md transition-colors",
                    getHeatLevel(data[dayIndex]?.[timeIndex] ?? 0)
                  )}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-border">
        <span className="text-xs text-muted-foreground">Low</span>
        <div className="flex gap-0.5">
          {[0, 20, 40, 60, 80, 100].map((level) => (
            <div
              key={level}
              className={cn("w-4 h-4 rounded", getHeatLevel(level))}
            />
          ))}
        </div>
        <span className="text-xs text-muted-foreground">High</span>
      </div>
    </div>
  );
}
