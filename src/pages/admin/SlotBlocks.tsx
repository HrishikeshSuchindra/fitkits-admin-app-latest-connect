import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { edgeFunctionApi, SlotAvailability } from '@/lib/edgeFunctionApi';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Calendar as CalendarIcon,
  Lock,
  Loader2,
  AlertCircle,
  X,
  Undo2
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { format, getMonth, getYear } from 'date-fns';
import { AvailabilityCalendar } from '@/components/ui/AvailabilityCalendar';
import { TimeSlotGrid } from '@/components/ui/TimeSlotGrid';
import { BlockSlotDialog } from '@/components/ui/BlockSlotDialog';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

// Generate 30-minute time slots from opening to closing time
function generate30MinSlots(openingTime: string = '07:00', closingTime: string = '21:00'): string[] {
  const slots: string[] = [];
  const [openHour, openMin] = openingTime.split(':').map(Number);
  const [closeHour, closeMin] = closingTime.split(':').map(Number);
  
  let currentHour = openHour;
  let currentMin = openMin || 0;
  
  const closeTimeMinutes = closeHour * 60 + (closeMin || 0);
  
  while (currentHour * 60 + currentMin < closeTimeMinutes) {
    slots.push(`${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`);
    currentMin += 30;
    if (currentMin >= 60) {
      currentMin = 0;
      currentHour++;
    }
  }
  
  return slots;
}

// Type for tracking last block action for undo (permanent, no timeout)
interface LastBlockAction {
  type: 'slots' | 'fullDay';
  slots: string[];
  date: string;
  venueId: string;
  reason: string;
}

export default function SlotBlocksPage() {
  const [selectedVenueId, setSelectedVenueId] = useState<string>('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [blockMode, setBlockMode] = useState<'time' | 'fullDay'>('time');
  const [blockReason, setBlockReason] = useState('');
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  
  // Undo mechanism state - permanent, no timeout
  const [lastBlockAction, setLastBlockAction] = useState<LastBlockAction | null>(null);

  const queryClient = useQueryClient();

  // Fetch user's venues
  const { data: venuesData, isLoading: venuesLoading } = useQuery({
    queryKey: ['venues'],
    queryFn: () => edgeFunctionApi.getVenues({ limit: 100 }),
  });

  const venues = venuesData?.venues || [];
  const selectedVenue = venues.find(v => v.id === selectedVenueId);

  // Auto-select first venue when data loads
  useEffect(() => {
    if (venues.length > 0 && !selectedVenueId) {
      setSelectedVenueId(venues[0].id);
    }
  }, [venues, selectedVenueId]);

  // Fetch blocked days in current month
  const { data: blockedDaysData, isLoading: blockedDaysLoading } = useQuery({
    queryKey: ['blocked-days', selectedVenueId, getYear(currentMonth), getMonth(currentMonth) + 1],
    queryFn: () => edgeFunctionApi.getBlockedDaysInMonth({
      venue_id: selectedVenueId,
      year: getYear(currentMonth),
      month: getMonth(currentMonth) + 1,
    }),
    enabled: !!selectedVenueId,
  });

  const blockedDates = blockedDaysData?.dates || [];

  // Fetch booked days in current month
  const { data: bookedDaysData, isLoading: bookedDaysLoading } = useQuery({
    queryKey: ['booked-days', selectedVenueId, getYear(currentMonth), getMonth(currentMonth) + 1],
    queryFn: () => edgeFunctionApi.getBookedDaysInMonth({
      venue_id: selectedVenueId,
      year: getYear(currentMonth),
      month: getMonth(currentMonth) + 1,
    }),
    enabled: !!selectedVenueId,
  });

  const bookedDates = bookedDaysData?.dates || [];

  // Fetch slot availability for selected date
  const { data: slotAvailability, isLoading: slotsLoading } = useQuery({
    queryKey: ['slot-availability', selectedVenueId, selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null],
    queryFn: () => edgeFunctionApi.getSlotAvailability({
      venue_id: selectedVenueId,
      date: format(selectedDate!, 'yyyy-MM-dd'),
    }),
    enabled: !!selectedVenueId && !!selectedDate,
  });

  // Generate time slots based on venue hours or defaults
  const allTimeSlots = useMemo(() => {
    return generate30MinSlots(
      selectedVenue?.opening_time || '07:00',
      selectedVenue?.closing_time || '21:00'
    );
  }, [selectedVenue?.opening_time, selectedVenue?.closing_time]);

  // Merge slot availability with generated slots - use only SlotAvailability fields
  const timeSlots: SlotAvailability[] = useMemo(() => {
    const availabilityMap = new Map(
      (slotAvailability?.slots || []).map(s => [s.time, s])
    );

    return allTimeSlots.map(time => {
      const slot = availabilityMap.get(time);
      return {
        time,
        is_blocked: slot?.is_blocked || false,
        booked_courts: slot?.booked_courts || 0,
        block_reason: slot?.block_reason,
      };
    });
  }, [allTimeSlots, slotAvailability?.slots]);

  // Undo helpers
  const performUndo = async (action: LastBlockAction) => {
    try {
      if (action.type === 'fullDay') {
        await edgeFunctionApi.unblockFullDay(action.venueId, action.date);
        toast.success('Full day block undone');
      } else {
        await Promise.all(
          action.slots.map(time => edgeFunctionApi.unblockSlot(action.venueId, action.date, time))
        );
        toast.success(`${action.slots.length} slot(s) unblocked`);
      }

      queryClient.invalidateQueries({ queryKey: ['slot-availability'] });
      queryClient.invalidateQueries({ queryKey: ['blocked-days'] });
      setLastBlockAction(null);
    } catch (error) {
      toast.error('Failed to undo block action');
      console.error('Undo error:', error);
    }
  };

  // Handle undo - permanent, available anytime
  const handleUndo = async () => {
    if (!lastBlockAction) return;
    await performUndo(lastBlockAction);
  };

  // Clear last action manually
  const dismissUndo = () => {
    setLastBlockAction(null);
  };

  // Block multiple slots mutation - use correct function signature
  const blockSlotsMutation = useMutation({
    mutationFn: async ({ slots, reason }: { slots: string[]; reason: string }) => {
      const dateStr = format(selectedDate!, 'yyyy-MM-dd');
      // Convert to the expected array format
      const slotsArray = slots.map(slot_time => ({
        venue_id: selectedVenueId,
        slot_date: dateStr,
        slot_time,
        reason: reason || undefined,
      }));
      return edgeFunctionApi.blockMultipleSlots(slotsArray);
    },
    onSuccess: (_, { slots, reason }) => {
      const action: LastBlockAction = {
        type: 'slots',
        slots,
        date: format(selectedDate!, 'yyyy-MM-dd'),
        venueId: selectedVenueId,
        reason,
      };

      // Store action for permanent undo
      setLastBlockAction(action);
      
      queryClient.invalidateQueries({ queryKey: ['slot-availability'] });
      queryClient.invalidateQueries({ queryKey: ['blocked-days'] });
      
      // Show toast with undo button
      toast.success(`${slots.length} slot(s) blocked`, {
        action: {
          label: 'Undo',
          // Use a captured action so "Undo" works even if clicked immediately
          // before React finishes committing state.
          onClick: () => performUndo(action),
        },
      });
      
      handleCloseBlockDialog();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Block full day mutation
  const blockFullDayMutation = useMutation({
    mutationFn: async ({ reason }: { reason: string }) => {
      const dateStr = format(selectedDate!, 'yyyy-MM-dd');
      return edgeFunctionApi.blockFullDay(selectedVenueId, dateStr, reason);
    },
    onSuccess: (_, { reason }) => {
      const action: LastBlockAction = {
        type: 'fullDay',
        slots: allTimeSlots,
        date: format(selectedDate!, 'yyyy-MM-dd'),
        venueId: selectedVenueId,
        reason,
      };

      // Store action for permanent undo
      setLastBlockAction(action);
      
      queryClient.invalidateQueries({ queryKey: ['slot-availability'] });
      queryClient.invalidateQueries({ queryKey: ['blocked-days'] });
      
      // Show toast with undo button
      toast.success('Full day blocked', {
        action: {
          label: 'Undo',
          onClick: () => performUndo(action),
        },
      });
      
      handleCloseBlockDialog();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Unblock individual slot mutation
  const unblockSlotMutation = useMutation({
    mutationFn: async (time: string) => {
      const dateStr = format(selectedDate!, 'yyyy-MM-dd');
      return edgeFunctionApi.unblockSlot(selectedVenueId, dateStr, time);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slot-availability'] });
      queryClient.invalidateQueries({ queryKey: ['blocked-days'] });
      toast.success('Slot unblocked');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedSlots([]);
    setBlockMode('time');
    setBlockReason('');
  };

  const handleSlotToggle = (time: string) => {
    const slot = timeSlots.find(s => s.time === time);
    
    // If slot is blocked, unblock it
    if (slot?.is_blocked) {
      unblockSlotMutation.mutate(time);
      return;
    }

    // Otherwise toggle selection for blocking
    setSelectedSlots(prev => 
      prev.includes(time) 
        ? prev.filter(t => t !== time)
        : [...prev, time]
    );
  };

  const handleOpenBlockDialog = () => {
    if (blockMode === 'time' && selectedSlots.length === 0) {
      toast.error('Please select at least one time slot');
      return;
    }
    setShowBlockDialog(true);
  };

  const handleCloseBlockDialog = () => {
    setShowBlockDialog(false);
    setSelectedSlots([]);
    setBlockReason('');
  };

  const handleConfirmBlock = () => {
    if (blockMode === 'fullDay') {
      blockFullDayMutation.mutate({ reason: blockReason });
    } else {
      blockSlotsMutation.mutate({ slots: selectedSlots, reason: blockReason });
    }
  };

  const isActionLoading = blockSlotsMutation.isPending || blockFullDayMutation.isPending || unblockSlotMutation.isPending;

  // Count blocked and available slots for the selected date
  const blockedCount = timeSlots.filter(s => s.is_blocked).length;
  const availableCount = timeSlots.length - blockedCount;
  const maxCourts = selectedVenue?.courts_count || 3;

  return (
    <AdminLayout title="Slot Blocks">
      <div className="space-y-4">
        {/* Undo Banner - shown permanently when undo is available */}
        {lastBlockAction && (
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2 text-sm">
              <Lock className="h-4 w-4 text-primary" />
              <span>
                {lastBlockAction.type === 'fullDay' 
                  ? `Full day blocked on ${lastBlockAction.date}`
                  : `${lastBlockAction.slots.length} slot(s) blocked`
                }
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5"
                onClick={handleUndo}
              >
                <Undo2 className="h-3.5 w-3.5" />
                Undo
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={dismissUndo}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* Venue Selector */}
        <Card className="card-elevated">
          <CardContent className="p-4">
            <Label className="text-sm text-muted-foreground mb-2 block">Select Venue</Label>
            {venuesLoading ? (
              <Skeleton className="h-11 w-full" />
            ) : venues.length === 0 ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">No venues found</span>
              </div>
            ) : (
              <Select value={selectedVenueId} onValueChange={setSelectedVenueId}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Select a venue" />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  {venues.map((venue) => (
                    <SelectItem key={venue.id} value={venue.id}>
                      {venue.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>

        {/* Availability Calendar */}
        {selectedVenueId && (
          <AvailabilityCalendar
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
            blockedDates={blockedDates}
            bookedDates={bookedDates}
            className="card-elevated"
          />
        )}

        {/* Block Slot Card */}
        {selectedVenueId && selectedDate && (
          <Card className="card-elevated">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                  {format(selectedDate, 'EEEE, d MMMM yyyy')}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setSelectedDate(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-success" />
                  {availableCount} available
                </span>
                <span className="flex items-center gap-1.5">
                  <Lock className="h-3 w-3 text-destructive" />
                  {blockedCount} blocked
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Block Mode Toggle */}
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">Block Mode</Label>
                <ToggleGroup
                  type="single"
                  value={blockMode}
                  onValueChange={(value) => value && setBlockMode(value as 'time' | 'fullDay')}
                  className="justify-start"
                >
                  <ToggleGroupItem
                    value="time"
                    className="rounded-l-xl data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                  >
                    Block Time
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="fullDay"
                    className="rounded-r-xl data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                  >
                    Full Day
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              {/* Time Slot Grid */}
              {blockMode === 'time' && (
                <div>
                  <Label className="text-sm text-muted-foreground mb-2 block">
                    Select slots to block (tap blocked slots to unblock)
                  </Label>
                  <TimeSlotGrid
                    slots={timeSlots}
                    selectedSlots={selectedSlots}
                    onSlotToggle={handleSlotToggle}
                    maxCourts={maxCourts}
                    isLoading={slotsLoading}
                  />
                </div>
              )}

              {/* Full Day Warning */}
              {blockMode === 'fullDay' && (
                <div className="bg-warning/10 border border-warning/20 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Block entire day</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        This will block all {timeSlots.length} time slots for {format(selectedDate, 'MMMM d, yyyy')}.
                        Existing bookings will not be affected.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Reason Input */}
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">
                  Reason (optional)
                </Label>
                <Input
                  placeholder="e.g., Maintenance, Private event..."
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={() => {
                    setSelectedSlots([]);
                    setBlockReason('');
                  }}
                  disabled={isActionLoading}
                >
                  Reset
                </Button>
                <Button
                  className="flex-1 rounded-xl gap-2"
                  onClick={handleOpenBlockDialog}
                  disabled={isActionLoading || (blockMode === 'time' && selectedSlots.length === 0)}
                >
                  {isActionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  <Lock className="h-4 w-4" />
                  {blockMode === 'fullDay' 
                    ? 'Block Full Day' 
                    : `Block ${selectedSlots.length} Slot${selectedSlots.length !== 1 ? 's' : ''}`
                  }
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions when no date selected */}
        {selectedVenueId && !selectedDate && (
          <Card className="card-elevated">
            <CardContent className="p-6 text-center">
              <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">
                Select a date from the calendar above to manage slot availability
              </p>
            </CardContent>
          </Card>
        )}

        {/* Block Confirmation Dialog - use correct props */}
        <BlockSlotDialog
          open={showBlockDialog}
          onOpenChange={setShowBlockDialog}
          selectedDate={selectedDate}
          selectedSlots={selectedSlots}
          blockMode={blockMode}
          onBlockModeChange={setBlockMode}
          reason={blockReason}
          onReasonChange={setBlockReason}
          onConfirm={handleConfirmBlock}
          isLoading={blockSlotsMutation.isPending || blockFullDayMutation.isPending}
        />
      </div>
    </AdminLayout>
  );
}
