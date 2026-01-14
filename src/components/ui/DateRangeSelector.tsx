import { Calendar, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface DateRangeSelectorProps {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  className?: string;
}

export function DateRangeSelector({
  value,
  options,
  onChange,
  className,
}: DateRangeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="card-elevated w-full px-4 py-3 flex items-center justify-between gap-3 transition-all hover:shadow-elevated"
      >
        <div className="flex items-center gap-3">
          <div className="icon-container-sm bg-primary-light">
            <Calendar className="w-4 h-4 text-primary" />
          </div>
          <span className="font-medium text-foreground">{value}</span>
        </div>
        <ChevronDown
          className={cn(
            "w-5 h-5 text-muted-foreground transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 card-elevated overflow-hidden z-50 animate-scale-in">
          {options.map((option) => (
            <button
              key={option}
              onClick={() => {
                onChange(option);
                setIsOpen(false);
              }}
              className={cn(
                "w-full px-4 py-3 text-left text-sm transition-colors hover:bg-muted",
                value === option && "bg-primary-light text-primary font-medium"
              )}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
