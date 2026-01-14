import { cn } from "@/lib/utils";
import { Check, LucideIcon } from "lucide-react";

interface Step {
  id: number;
  label: string;
  icon: LucideIcon;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export function StepIndicator({ steps, currentStep, className }: StepIndicatorProps) {
  const progressWidth = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <div className={cn("w-full", className)}>
      {/* Step Counter */}
      <div className="text-center mb-4">
        <span className="text-sm text-muted-foreground">
          Step {currentStep} of {steps.length}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="relative h-1 bg-muted rounded-full mb-6 overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full bg-primary rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressWidth}%` }}
        />
      </div>

      {/* Step Icons */}
      <div className="flex justify-between relative">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const Icon = step.icon;

          return (
            <div key={step.id} className="flex flex-col items-center gap-2 relative z-10">
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300",
                  isCompleted && "bg-success text-success-foreground",
                  isCurrent && "bg-primary text-primary-foreground shadow-lg shadow-primary/30",
                  !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>
              <span
                className={cn(
                  "text-xs font-medium transition-colors",
                  isCurrent ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
