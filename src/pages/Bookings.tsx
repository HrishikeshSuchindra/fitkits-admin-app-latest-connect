import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Phone, X, Calendar, Clock, MapPin, Users, Loader2 } from "lucide-react";
import { MobileHeader } from "@/components/ui/MobileHeader";
import { BottomNav } from "@/components/ui/BottomNav";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { edgeFunctionApi, Booking } from "@/lib/edgeFunctionApi";
import { supabase } from "@/lib/supabase";
import { format, subDays } from "date-fns";

// Helper functions for field mapping (same as admin page)
function getBookingDate(booking: Booking): string | undefined {
  return booking.slot_date || booking.booking_date;
}

function getBookingTime(booking: Booking): string {
  if (booking.slot_time) {
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

function getUserName(booking: Booking): string {
  return booking.user_profile?.display_name || booking.user?.full_name || 'Unknown User';
}

function getUserInitials(booking: Booking): string {
  const name = getUserName(booking);
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
}

function getUserAvatar(booking: Booking): string | undefined {
  return booking.user_profile?.avatar_url || booking.user?.avatar_url;
}

function getVenueName(booking: Booking): string {
  return booking.venue_name || booking.venue?.name || 'Unknown Venue';
}

function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    return format(date, 'MMM d, yyyy');
  } catch {
    return 'Invalid date';
  }
}

export default function Bookings() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<'live' | 'previous'>('live');
  const [venueFilter, setVenueFilter] = useState<string>('all');

  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  // Fetch venues for filter dropdown
  const { data: venuesData } = useQuery({
    queryKey: ['venues'],
    queryFn: () => edgeFunctionApi.getVenues({ limit: 100 }),
  });

  const venues = venuesData?.venues || [];

  // Fetch bookings based on filters
  const { data: bookingsData, isLoading } = useQuery({
    queryKey: ['my-bookings', activeTab, venueFilter],
    queryFn: () => edgeFunctionApi.getBookings({
      status: activeTab === 'live' ? 'confirmed' : undefined,
      venue_id: venueFilter !== 'all' ? venueFilter : undefined,
      date_from: activeTab === 'live' ? today : undefined,
      date_to: activeTab === 'previous' ? format(subDays(new Date(), 1), 'yyyy-MM-dd') : undefined,
      limit: 50,
    }),
  });

  // Real-time subscription for booking updates
  useEffect(() => {
    const channel = supabase
      .channel('user-booking-updates')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'bookings',
      }, (payload) => {
        const newStatus = payload.new?.status;
        if (newStatus === 'cancelled') {
          toast.info('A booking has been cancelled', {
            description: 'Check your bookings for details.',
          });
        }
        queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const handleCall = (id: string) => {
    console.log("Calling booking:", id);
    toast.info("Call feature coming soon");
  };

  const handleCancel = (id: string) => {
    console.log("Cancelling booking:", id);
    toast.info("Please contact support to cancel your booking");
  };

  // Filter bookings by search query
  const bookings = bookingsData?.bookings || [];
  const filteredBookings = bookings.filter(
    (b) =>
      getUserName(b).toLowerCase().includes(searchQuery.toLowerCase()) ||
      getVenueName(b).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'paid':
        return 'bg-success/10 text-success border-success/20';
      case 'pending':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'cancelled':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="mobile-container pb-24">
      <MobileHeader title="Bookings" showNotification />

      <div className="mobile-padding space-y-4 py-4">
        {/* Tabs for Live/Previous */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'live' | 'previous')}>
          <TabsList className="grid w-full grid-cols-2 rounded-xl bg-muted">
            <TabsTrigger value="live" className="rounded-lg">Live Bookings</TabsTrigger>
            <TabsTrigger value="previous" className="rounded-lg">Previous</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search & Filter Row */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search bookings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-xl"
            />
          </div>
          {venues.length > 1 && (
            <Select value={venueFilter} onValueChange={setVenueFilter}>
              <SelectTrigger className="w-[140px] rounded-xl">
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
          )}
        </div>

        {/* Bookings List */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">
            {activeTab === 'live' ? 'Live Bookings' : 'Previous Bookings'}
          </h2>
          
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="card-elevated">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-40" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredBookings.length > 0 ? (
            filteredBookings.map((booking) => (
              <Card key={booking.id} className="card-elevated animate-fade-in">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={getUserAvatar(booking)} alt={getUserName(booking)} />
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">
                        {getUserInitials(booking)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-foreground truncate">
                          {getUserName(booking)}
                        </h3>
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full border font-medium",
                          getStatusStyle(booking.status)
                        )}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{getVenueName(booking)}</span>
                        {booking.court_number && (
                          <span className="text-xs">• Court {booking.court_number}</span>
                        )}
                      </div>

                      {booking.player_count && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                          <Users className="w-3.5 h-3.5" />
                          <span>Number of Players: {booking.player_count}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{formatDate(getBookingDate(booking))}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{getBookingTime(booking)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {booking.status !== 'cancelled' && (
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1 gap-1.5 rounded-xl"
                        onClick={() => handleCall(booking.id)}
                      >
                        <Phone className="w-4 h-4" />
                        Call
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-1.5 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10"
                        onClick={() => handleCancel(booking.id)}
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="card-elevated">
              <CardContent className="py-12 text-center text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="font-medium mb-1">No bookings found</p>
                <p className="text-sm">
                  {activeTab === 'live' 
                    ? "You don't have any upcoming bookings" 
                    : "No previous bookings to display"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
