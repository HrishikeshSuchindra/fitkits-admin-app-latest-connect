import React from 'react';
import { Lock, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SlotAvailability } from '@/lib/edgeFunctionApi';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';

interface TimeSlotGridProps {
  slots: SlotAvailability[];
  selectedSlots: string[];
  onSlotToggle: (time: string) => void;
  maxCourts?: number;
  isLoading?: boolean;
  className?: string;
}

export function TimeSlotGrid({
  slots,
  selectedSlots,
  onSlotToggle,
  maxCourts = 3,
  isLoading = false,
  className,
}: TimeSlotGridProps) {
  if (isLoading) {
    return (
      <div className={cn('grid grid-cols-4 gap-2', className)}>
        {Array.from({ length: 24 }).map((_, i) => (
          <div
            key={i}
            className="h-16 rounded-xl bg-muted animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No time slots available for this venue
      </div>
    );
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getSlotState = (slot: SlotAvailability) => {
    if (slot.is_blocked) return 'blocked';
    if (slot.booked_courts === maxCourts) return 'full';
    if (slot.booked_courts > 0) return 'partial';
    return 'available';
  };

  const getCourtBadgeClass = (bookedCourts: number) => {
    if (bookedCourts === 0) return 'court-badge-available';
    if (bookedCourts < maxCourts) return 'court-badge-partial';
    return 'court-badge-full';
  };

  return (
    <TooltipProvider>
      <div className={cn('grid grid-cols-4 gap-2', className)}>
        {slots.map((slot) => {
          const state = getSlotState(slot);
          const isSelected = selectedSlots.includes(slot.time);
          const isClickable = state !== 'blocked';

          return (
            <Tooltip key={slot.time}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => isClickable && onSlotToggle(slot.time)}
                  disabled={!isClickable}
                  className={cn(
                    'slot-button',
                    state === 'available' && 'slot-available',
                    state === 'partial' && 'slot-partial',
                    state === 'full' && 'slot-full',
                    state === 'blocked' && 'slot-blocked',
                    isSelected && 'slot-selected'
                  )}
                >
                  {/* Time Label */}
                  <span className={cn(
                    'text-sm font-medium',
                    state === 'blocked' ? 'text-destructive' : 'text-foreground'
                  )}>
                    {formatTime(slot.time)}
                  </span>

                  {/* Status Indicator */}
                  {state === 'blocked' ? (
                    <Lock className="h-3.5 w-3.5 text-destructive" />
                  ) : (
                    <span className={cn('court-badge', getCourtBadgeClass(slot.booked_courts))}>
                      {slot.booked_courts}/{maxCourts}
                    </span>
                  )}

                  {/* Selection Checkmark */}
                  {isSelected && (
                    <div className="absolute top-1 right-1">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                  )}
                </button>
              </TooltipTrigger>
              {slot.is_blocked && slot.block_reason && (
                <TooltipContent>
                  <p className="text-xs">Blocked: {slot.block_reason}</p>
                </TooltipContent>
              )}
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
