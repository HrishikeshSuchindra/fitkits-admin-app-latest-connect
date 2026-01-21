import React from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './dialog';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { ToggleGroup, ToggleGroupItem } from './toggle-group';
import { cn } from '@/lib/utils';

interface BlockSlotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | null;
  selectedSlots: string[];
  blockMode: 'time' | 'fullDay';
  onBlockModeChange: (mode: 'time' | 'fullDay') => void;
  reason: string;
  onReasonChange: (reason: string) => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function BlockSlotDialog({
  open,
  onOpenChange,
  selectedDate,
  selectedSlots,
  blockMode,
  onBlockModeChange,
  reason,
  onReasonChange,
  onConfirm,
  isLoading = false,
}: BlockSlotDialogProps) {
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const canConfirm = blockMode === 'fullDay' || selectedSlots.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Block Slots
          </DialogTitle>
          <DialogDescription>
            Block time slots to prevent new bookings
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Selected Date Display */}
          {selectedDate && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                {format(selectedDate, 'EEEE, d MMMM yyyy')}
              </span>
            </div>
          )}

          {/* Block Mode Toggle */}
          <div className="space-y-2">
            <Label>Block Type</Label>
            <ToggleGroup
              type="single"
              value={blockMode}
              onValueChange={(value) => value && onBlockModeChange(value as 'time' | 'fullDay')}
              className="justify-start"
            >
              <ToggleGroupItem
                value="time"
                className={cn(
                  'flex items-center gap-2 px-4',
                  blockMode === 'time' && 'bg-primary text-primary-foreground'
                )}
              >
                <Clock className="h-4 w-4" />
                Block Time
              </ToggleGroupItem>
              <ToggleGroupItem
                value="fullDay"
                className={cn(
                  'flex items-center gap-2 px-4',
                  blockMode === 'fullDay' && 'bg-primary text-primary-foreground'
                )}
              >
                <Calendar className="h-4 w-4" />
                Full Day
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Selected Slots Display */}
          {blockMode === 'time' && (
            <div className="space-y-2">
              <Label>Selected Slots</Label>
              {selectedSlots.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedSlots.sort().map((time) => (
                    <span
                      key={time}
                      className="px-2.5 py-1 bg-destructive/10 text-destructive rounded-full text-sm font-medium"
                    >
                      {formatTime(time)}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Click on available time slots to select them
                </p>
              )}
            </div>
          )}

          {/* Full Day Warning */}
          {blockMode === 'fullDay' && (
            <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg">
              <p className="text-sm text-warning">
                This will block all time slots for the entire day. Existing bookings will not be affected.
              </p>
            </div>
          )}

          {/* Reason Input */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason (optional)</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              placeholder="e.g., Private Tournament, Maintenance..."
              className="w-full"
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={!canConfirm || isLoading}
          >
            {isLoading ? 'Blocking...' : blockMode === 'fullDay' ? 'Block Full Day' : `Block ${selectedSlots.length} Slot${selectedSlots.length !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
