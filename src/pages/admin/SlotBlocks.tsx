import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { edgeFunctionApi, Venue, SlotBlock } from '@/lib/edgeFunctionApi';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Calendar as CalendarIcon,
  Clock,
  Lock,
  Unlock,
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { format, addDays, startOfWeek, isSameDay, parseISO } from 'date-fns';

// Generate time slots from opening to closing time
function generateTimeSlots(openingTime: string = '07:00', closingTime: string = '21:00'): string[] {
  const slots: string[] = [];
  const [openHour] = openingTime.split(':').map(Number);
  const [closeHour] = closingTime.split(':').map(Number);
  
  for (let hour = openHour; hour < closeHour; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
  }
  
  return slots;
}

export default function SlotBlocksPage() {
  const [selectedVenueId, setSelectedVenueId] = useState<string>('');
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [blockDialog, setBlockDialog] = useState<{
    open: boolean;
    date: string;
    time: string;
    isBlocked: boolean;
    blockId?: string;
  }>({ open: false, date: '', time: '', isBlocked: false });
  const [blockReason, setBlockReason] = useState('');

  const queryClient = useQueryClient();

  // Fetch user's venues
  const { data: venuesData, isLoading: venuesLoading } = useQuery({
    queryKey: ['venues'],
    queryFn: () => edgeFunctionApi.getVenues({ limit: 100 }),
  });

  const venues = venuesData?.venues || [];
  const selectedVenue = venues.find(v => v.id === selectedVenueId);

  // Auto-select first venue
  useState(() => {
    if (venues.length > 0 && !selectedVenueId) {
      setSelectedVenueId(venues[0].id);
    }
  });

  // Fetch blocked slots for selected venue
  const { data: blocksData, isLoading: blocksLoading } = useQuery({
    queryKey: ['slot-blocks', selectedVenueId, format(weekStart, 'yyyy-MM-dd')],
    queryFn: () => edgeFunctionApi.getBlockedSlots({
      venue_id: selectedVenueId,
      date_from: format(weekStart, 'yyyy-MM-dd'),
      date_to: format(addDays(weekStart, 6), 'yyyy-MM-dd'),
      limit: 200,
    }),
    enabled: !!selectedVenueId,
  });

  const blocks = blocksData?.blocks || [];

  // Block mutation
  const blockMutation = useMutation({
    mutationFn: ({ venueId, date, time, reason }: { venueId: string; date: string; time: string; reason: string }) =>
      edgeFunctionApi.blockSlot(venueId, date, time, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slot-blocks'] });
      toast.success('Slot blocked');
      closeBlockDialog();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Unblock mutation
  const unblockMutation = useMutation({
    mutationFn: ({ venueId, date, time }: { venueId: string; date: string; time: string }) =>
      edgeFunctionApi.unblockSlot(venueId, date, time),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slot-blocks'] });
      toast.success('Slot unblocked');
      closeBlockDialog();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const closeBlockDialog = () => {
    setBlockDialog({ open: false, date: '', time: '', isBlocked: false });
    setBlockReason('');
  };

  const handleSlotClick = (date: string, time: string) => {
    const block = blocks.find(b => b.slot_date === date && b.slot_time === time);
    setBlockDialog({
      open: true,
      date,
      time,
      isBlocked: !!block,
      blockId: block?.id,
    });
    if (block?.reason) {
      setBlockReason(block.reason);
    }
  };

  const handleConfirmAction = () => {
    if (blockDialog.isBlocked) {
      unblockMutation.mutate({
        venueId: selectedVenueId,
        date: blockDialog.date,
        time: blockDialog.time,
      });
    } else {
      blockMutation.mutate({
        venueId: selectedVenueId,
        date: blockDialog.date,
        time: blockDialog.time,
        reason: blockReason || 'Blocked by admin',
      });
    }
  };

  const isActionLoading = blockMutation.isPending || unblockMutation.isPending;

  // Generate week days
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  // Generate time slots based on venue hours
  const timeSlots = useMemo(() => {
    return generateTimeSlots(
      selectedVenue?.opening_time || '07:00',
      selectedVenue?.closing_time || '21:00'
    );
  }, [selectedVenue]);

  // Check if a slot is blocked
  const isSlotBlocked = (date: string, time: string): boolean => {
    return blocks.some(b => b.slot_date === date && b.slot_time === time);
  };

  // Auto-select first venue when data loads
  if (venues.length > 0 && !selectedVenueId) {
    setSelectedVenueId(venues[0].id);
  }

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

        {/* Week Navigation */}
        {selectedVenueId && (
          <Card className="card-elevated">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setWeekStart(prev => addDays(prev, -7))}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <div className="text-center">
                  <p className="font-semibold text-foreground">
                    {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
                  </p>
                  <p className="text-xs text-muted-foreground">Click on a slot to block/unblock</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setWeekStart(prev => addDays(prev, 7))}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Calendar Grid */}
        {selectedVenueId && (
          <Card className="card-elevated overflow-hidden">
            <CardContent className="p-0">
              {blocksLoading ? (
                <div className="p-8 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                  <p className="text-muted-foreground mt-2">Loading slots...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="border-b">
                        <th className="p-2 text-left text-xs font-medium text-muted-foreground w-16">
                          <Clock className="h-4 w-4" />
                        </th>
                        {weekDays.map((day) => (
                          <th key={day.toISOString()} className="p-2 text-center">
                            <p className="text-xs font-medium text-muted-foreground">
                              {format(day, 'EEE')}
                            </p>
                            <p className={`text-sm font-semibold ${isSameDay(day, new Date()) ? 'text-primary' : 'text-foreground'}`}>
                              {format(day, 'd')}
                            </p>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {timeSlots.map((time) => (
                        <tr key={time} className="border-b last:border-0">
                          <td className="p-2 text-xs text-muted-foreground font-medium">
                            {time}
                          </td>
                          {weekDays.map((day) => {
                            const dateStr = format(day, 'yyyy-MM-dd');
                            const blocked = isSlotBlocked(dateStr, time);
                            const isPast = day < new Date() && !isSameDay(day, new Date());
                            
                            return (
                              <td key={`${dateStr}-${time}`} className="p-1">
                                <button
                                  onClick={() => !isPast && handleSlotClick(dateStr, time)}
                                  disabled={isPast}
                                  className={`w-full h-10 rounded-lg flex items-center justify-center transition-colors ${
                                    isPast
                                      ? 'bg-muted/30 cursor-not-allowed'
                                      : blocked
                                      ? 'bg-destructive/10 hover:bg-destructive/20 border border-destructive/30'
                                      : 'bg-success/10 hover:bg-success/20 border border-success/30'
                                  }`}
                                >
                                  {blocked ? (
                                    <Lock className="h-4 w-4 text-destructive" />
                                  ) : !isPast ? (
                                    <span className="w-2 h-2 rounded-full bg-success" />
                                  ) : null}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Legend */}
        {selectedVenueId && (
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-success" />
              <span className="text-muted-foreground">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="h-3 w-3 text-destructive" />
              <span className="text-muted-foreground">Blocked</span>
            </div>
          </div>
        )}
      </div>

      {/* Block/Unblock Dialog */}
      <Dialog open={blockDialog.open} onOpenChange={(open) => !open && closeBlockDialog()}>
        <DialogContent className="mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              {blockDialog.isBlocked ? 'Unblock Slot' : 'Block Slot'}
            </DialogTitle>
            <DialogDescription>
              {blockDialog.date && blockDialog.time && (
                <>
                  {format(parseISO(blockDialog.date), 'EEEE, MMMM d, yyyy')} at {blockDialog.time}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {!blockDialog.isBlocked && (
            <div className="space-y-2">
              <Label>Reason (optional)</Label>
              <Input
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="e.g., Maintenance, Private Event"
                className="rounded-xl"
              />
            </div>
          )}

          {blockDialog.isBlocked && blockReason && (
            <div className="p-3 bg-muted rounded-xl">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Blocked reason:</span> {blockReason}
              </p>
            </div>
          )}

          <DialogFooter className="flex-row gap-2">
            <Button variant="outline" onClick={closeBlockDialog} className="flex-1 rounded-xl">
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmAction}
              disabled={isActionLoading}
              variant={blockDialog.isBlocked ? 'default' : 'destructive'}
              className="flex-1 rounded-xl"
            >
              {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {blockDialog.isBlocked ? (
                <>
                  <Unlock className="h-4 w-4 mr-1" />
                  Unblock
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-1" />
                  Block
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
