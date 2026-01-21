import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { edgeFunctionApi, Booking } from '@/lib/edgeFunctionApi';
import { supabase } from '@/lib/supabase';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  XCircle, 
  Phone,
  Loader2,
  Clock,
  MapPin,
  Users
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format, subDays } from 'date-fns';

// Helper to get booking date from either field format
function getBookingDate(booking: Booking): string | undefined {
  return booking.slot_date || booking.booking_date;
}

// Helper to get booking time from either field format
function getBookingTime(booking: Booking): string {
  if (booking.slot_time) {
    // Format slot_time + duration if available
    if (booking.duration_minutes) {
      const [hours, mins] = booking.slot_time.split(':').map(Number);
      const endMins = hours * 60 + mins + booking.duration_minutes;
      const endHours = Math.floor(endMins / 60);
      const endMinutes = endMins % 60;
      return `${booking.slot_time} - ${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
    }
    return booking.slot_time;
  }
  if (booking.start_time && booking.end_time) {
    return `${booking.start_time} - ${booking.end_time}`;
  }
  return booking.start_time || 'N/A';
}

// Helper to get amount from either field format
function getBookingAmount(booking: Booking): number {
  return booking.price ?? booking.total_amount ?? 0;
}

// Helper to get user display name
function getUserName(booking: Booking): string {
  return booking.user_profile?.display_name || booking.user?.full_name || 'Unknown User';
}

// Helper to get user initials
function getUserInitials(booking: Booking): string {
  const name = getUserName(booking);
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
}

// Helper to get user avatar
function getUserAvatar(booking: Booking): string | undefined {
  return booking.user_profile?.avatar_url || booking.user?.avatar_url;
}

// Helper to get venue name
function getVenueName(booking: Booking): string {
  return booking.venue_name || booking.venue?.name || 'Unknown Venue';
}

// Helper to get user phone number
function getUserPhone(booking: Booking): string | null {
  return booking.user_profile?.phone_number || booking.user?.phone || null;
}

export default function BookingsPage() {
  const [activeTab, setActiveTab] = useState<'live' | 'previous'>('live');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [venueFilter, setVenueFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [actionDialog, setActionDialog] = useState<{
    type: 'cancel' | null;
    booking: Booking | null;
  }>({ type: null, booking: null });
  const [actionReason, setActionReason] = useState('');

  const queryClient = useQueryClient();

  // Fetch venues for filter dropdown
  const { data: venuesData } = useQuery({
    queryKey: ['venues'],
    queryFn: () => edgeFunctionApi.getVenues({ limit: 100 }),
  });

  const venues = venuesData?.venues || [];

  // Determine date filters based on active tab
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data, isLoading } = useQuery({
    queryKey: ['bookings', { tab: activeTab, status: statusFilter, venue: venueFilter, page }],
    queryFn: () => edgeFunctionApi.getBookings({
      status: statusFilter !== 'all' ? statusFilter : undefined,
      venue_id: venueFilter !== 'all' ? venueFilter : undefined,
      date_from: activeTab === 'live' ? today : undefined,
      date_to: activeTab === 'previous' ? format(subDays(new Date(), 1), 'yyyy-MM-dd') : undefined,
      page,
      limit: 20,
    }),
  });

  // Real-time subscription for booking updates
  useEffect(() => {
    const channel = supabase
      .channel('admin-booking-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bookings',
      }, () => {
        // Refresh bookings on any change
        queryClient.invalidateQueries({ queryKey: ['bookings'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const closeDialog = () => {
    setActionDialog({ type: null, booking: null });
    setActionReason('');
  };

  const cancelMutation = useMutation({
    mutationFn: ({ bookingId, reason }: { bookingId: string; reason: string }) =>
      edgeFunctionApi.cancelBooking(bookingId, reason),
    onSuccess: () => {
      // Invalidate all related queries for immediate UI update
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['slot-availability'] });
      queryClient.invalidateQueries({ queryKey: ['booked-days'] });
      toast.success('Booking cancelled. User will be notified.');
      closeDialog();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleAction = () => {
    if (!actionDialog.booking || !actionDialog.type) return;
    
    if (actionDialog.type === 'cancel') {
      cancelMutation.mutate({
        bookingId: actionDialog.booking.id,
        reason: actionReason || 'Cancelled by admin',
      });
    }
  };

  // Handle call action
  const handleCall = (booking: Booking) => {
    const phone = getUserPhone(booking);
    if (phone) {
      window.location.href = `tel:${phone}`;
    } else {
      toast.error('No phone number available for this user');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return 'N/A';
    try {
      return format(new Date(dateStr), 'MMM d, yyyy');
    } catch {
      return dateStr;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
      case 'completed':
        return 'bg-success/10 text-success';
      case 'pending':
        return 'bg-warning/10 text-warning';
      case 'cancelled':
        return 'bg-destructive/10 text-destructive';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <AdminLayout title="Bookings">
      <div className="space-y-4">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'live' | 'previous')}>
          <TabsList className="grid w-full grid-cols-2 rounded-xl h-11">
            <TabsTrigger value="live" className="rounded-lg">Live Bookings</TabsTrigger>
            <TabsTrigger value="previous" className="rounded-lg">Previous</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Filters */}
        <div className="flex gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="flex-1 h-10 rounded-xl">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-background">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={venueFilter} onValueChange={setVenueFilter}>
            <SelectTrigger className="flex-1 h-10 rounded-xl">
              <SelectValue placeholder="Venue" />
            </SelectTrigger>
            <SelectContent className="bg-background">
              <SelectItem value="all">All Venues</SelectItem>
              {venues.map((venue) => (
                <SelectItem key={venue.id} value={venue.id}>
                  {venue.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Bookings List */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
        ) : !data?.bookings?.length ? (
          <Card className="card-elevated">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No bookings found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {data.bookings.map((booking) => (
              <Card key={booking.id} className="card-elevated overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* User Avatar */}
                    <Avatar className="h-12 w-12 shrink-0">
                      <AvatarImage src={getUserAvatar(booking)} alt={getUserName(booking)} />
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">
                        {getUserInitials(booking)}
                      </AvatarFallback>
                    </Avatar>

                    {/* Booking Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-foreground truncate">
                            {getUserName(booking)}
                          </h3>
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                            <MapPin className="h-3.5 w-3.5" />
                            <span className="truncate">{getVenueName(booking)}</span>
                            {booking.court_number && (
                              <span className="text-xs">• Court {booking.court_number}</span>
                            )}
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full shrink-0 ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                      </div>

                      {/* Players & Time */}
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        {booking.player_count && (
                          <div className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            <span>{booking.player_count} players</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{getBookingTime(booking)}</span>
                        </div>
                      </div>

                      {/* Date & Amount */}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm text-muted-foreground">
                          {formatDate(getBookingDate(booking))}
                        </span>
                        <span className="font-semibold text-foreground">
                          {formatCurrency(getBookingAmount(booking))}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 rounded-lg flex-1 gap-1.5"
                          onClick={() => handleCall(booking)}
                        >
                          <Phone className="h-3.5 w-3.5" />
                          Call
                        </Button>
                        {booking.status !== 'cancelled' && (
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-8 rounded-lg flex-1 gap-1.5"
                            onClick={() => setActionDialog({ type: 'cancel', booking })}
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {data?.total && data.total > 20 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {Math.ceil(data.total / 20)}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => p + 1)}
              disabled={page >= Math.ceil(data.total / 20)}
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* Cancel Dialog */}
      <Dialog open={actionDialog.type === 'cancel'} onOpenChange={() => closeDialog()}>
        <DialogContent className="rounded-xl">
          <DialogHeader>
            <DialogTitle>Cancel Booking</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this booking? The user will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Reason for cancellation</Label>
              <Textarea
                placeholder="Enter reason..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                className="mt-2 rounded-xl"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closeDialog} className="rounded-xl">
              Keep Booking
            </Button>
            <Button
              variant="destructive"
              onClick={handleAction}
              disabled={cancelMutation.isPending}
              className="rounded-xl gap-2"
            >
              {cancelMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Cancel Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
