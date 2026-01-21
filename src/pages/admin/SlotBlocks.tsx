import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { edgeFunctionApi, Venue, SlotAvailability } from '@/lib/edgeFunctionApi';
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
  Unlock,
  Loader2,
  AlertCircle,
  X
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
import { cn } from '@/lib/utils';

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

export default function SlotBlocksPage() {
  const [selectedVenueId, setSelectedVenueId] = useState<string>('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [blockMode, setBlockMode] = useState<'time' | 'fullDay'>('time');
  const [blockReason, setBlockReason] = useState('');
  const [showBlockDialog, setShowBlockDialog] = useState(false);

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
  const { data: slotAvailabilityData, isLoading: slotsLoading } = useQuery({
    queryKey: ['slot-availability', selectedVenueId, selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''],
    queryFn: () => edgeFunctionApi.getSlotAvailability({
      venue_id: selectedVenueId,
      date: format(selectedDate!, 'yyyy-MM-dd'),
    }),
    enabled: !!selectedVenueId && !!selectedDate,
  });

  // Generate slots based on venue hours, merge with availability data
  const timeSlots = useMemo(() => {
    const generatedSlots = generate30MinSlots(
      selectedVenue?.opening_time || '07:00',
      selectedVenue?.closing_time || '21:00'
    );

    const availabilityMap = new Map(
      (slotAvailabilityData?.slots || []).map(s => [s.time, s])
    );

    return generatedSlots.map(time => {
      const existing = availabilityMap.get(time);
      return existing || {
        time,
        booked_courts: 0,
        is_blocked: false,
      };
    });
  }, [selectedVenue, slotAvailabilityData]);

  // Block multiple slots mutation
  const blockSlotsMutation = useMutation({
    mutationFn: async ({ slots, reason }: { slots: string[]; reason: string }) => {
      const dateStr = format(selectedDate!, 'yyyy-MM-dd');
      return edgeFunctionApi.blockMultipleSlots(
        slots.map(time => ({
          venue_id: selectedVenueId,
          slot_date: dateStr,
          slot_time: time,
          reason: reason || 'Blocked by admin',
        }))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slot-availability'] });
      queryClient.invalidateQueries({ queryKey: ['blocked-days'] });
      toast.success(`${selectedSlots.length} slot(s) blocked`);
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['slot-availability'] });
      queryClient.invalidateQueries({ queryKey: ['blocked-days'] });
      toast.success(`Full day blocked (${data.blocks_created} slots)`);
      handleCloseBlockDialog();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Unblock slot mutation
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
  };

  const handleSlotToggle = (time: string) => {
    const slot = timeSlots.find(s => s.time === time);
    
    // If slot is blocked, unblock it
    if (slot?.is_blocked) {
      unblockSlotMutation.mutate(time);
      return;
    }

    // Toggle selection for available slots
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
    setBlockReason('');
    setSelectedSlots([]);
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

  return (
    <AdminLayout title="Slot Blocks">
      <div className="space-y-4">
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
                <SelectContent>
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
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Block Type</Label>
                <ToggleGroup
                  type="single"
                  value={blockMode}
                  onValueChange={(value) => {
                    if (value) {
                      setBlockMode(value as 'time' | 'fullDay');
                      if (value === 'fullDay') {
                        setSelectedSlots([]);
                      }
                    }
                  }}
                  className="justify-start"
                >
                  <ToggleGroupItem
                    value="time"
                    className={cn(
                      'px-4 rounded-xl',
                      blockMode === 'time' && 'bg-primary text-primary-foreground data-[state=on]:bg-primary data-[state=on]:text-primary-foreground'
                    )}
                  >
                    Block Time
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="fullDay"
                    className={cn(
                      'px-4 rounded-xl',
                      blockMode === 'fullDay' && 'bg-primary text-primary-foreground data-[state=on]:bg-primary data-[state=on]:text-primary-foreground'
                    )}
                  >
                    Full Day
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              {/* Time Slot Grid */}
              {blockMode === 'time' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-muted-foreground">
                      Select slots to block (tap blocked slots to unblock)
                    </Label>
                    {selectedSlots.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedSlots([])}
                        className="h-7 text-xs"
                      >
                        Clear selection
                      </Button>
                    )}
                  </div>
                  <TimeSlotGrid
                    slots={timeSlots}
                    selectedSlots={selectedSlots}
                    onSlotToggle={handleSlotToggle}
                    maxCourts={selectedVenue?.courts_count || 3}
                    isLoading={slotsLoading}
                  />
                </div>
              )}

              {/* Full Day Warning */}
              {blockMode === 'fullDay' && (
                <div className="p-4 bg-warning/10 border border-warning/30 rounded-xl">
                  <p className="text-sm text-warning font-medium">
                    This will block all {timeSlots.length} time slots for the entire day.
                  </p>
                  <p className="text-xs text-warning/80 mt-1">
                    Existing bookings will not be affected, but no new bookings can be made.
                  </p>
                </div>
              )}

              {/* Reason Input */}
              <div className="space-y-2">
                <Label htmlFor="block-reason">Reason (optional)</Label>
                <Input
                  id="block-reason"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="e.g., Private Tournament, Maintenance..."
                  className="rounded-xl"
                />
                <p className="text-xs text-muted-foreground">
                  This will be shown on blocked slots
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
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
                  variant="destructive"
                  className="flex-1 rounded-xl"
                  onClick={handleOpenBlockDialog}
                  disabled={isActionLoading || (blockMode === 'time' && selectedSlots.length === 0)}
                >
                  {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Lock className="h-4 w-4 mr-1" />
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
            <CardContent className="py-8 text-center">
              <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-medium text-foreground mb-2">Select a Date</h3>
              <p className="text-sm text-muted-foreground">
                Tap on a date in the calendar above to view and manage time slots
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Block Confirmation Dialog */}
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
    </AdminLayout>
  );
}
