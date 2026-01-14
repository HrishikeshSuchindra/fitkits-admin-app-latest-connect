import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { directApi, Booking } from '@/lib/directApi';
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
  XCircle, 
  RefreshCw,
  Loader2,
  Clock,
  Phone,
  MapPin
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';

export default function BookingsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [actionDialog, setActionDialog] = useState<{
    type: 'cancel' | 'refund' | null;
    booking: Booking | null;
  }>({ type: null, booking: null });
  const [actionReason, setActionReason] = useState('');

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['bookings', { status: statusFilter, page }],
    queryFn: () => directApi.getBookings({
      status: statusFilter !== 'all' ? statusFilter : undefined,
      page,
      limit: 20,
    }),
  });

  const cancelMutation = useMutation({
    mutationFn: ({ bookingId, reason }: { bookingId: string; reason: string }) =>
      directApi.cancelBooking(bookingId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('Booking cancelled');
      closeDialog();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const refundMutation = useMutation({
    mutationFn: ({ bookingId, reason }: { bookingId: string; reason: string }) =>
      directApi.refundBooking(bookingId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('Refund processed');
      closeDialog();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const closeDialog = () => {
    setActionDialog({ type: null, booking: null });
    setActionReason('');
  };

  const handleAction = () => {
    if (!actionDialog.booking) return;

    switch (actionDialog.type) {
      case 'cancel':
        cancelMutation.mutate({ bookingId: actionDialog.booking.id, reason: actionReason });
        break;
      case 'refund':
        refundMutation.mutate({ bookingId: actionDialog.booking.id, reason: actionReason });
        break;
    }
  };

  const isActionLoading = cancelMutation.isPending || refundMutation.isPending;

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'badge-success';
      case 'pending':
        return 'badge-warning';
      case 'cancelled':
        return 'badge-danger';
      default:
        return 'badge-muted';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      return format(date, 'MMM d, yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <AdminLayout title="Live Bookings">
      <div className="space-y-4">
        {/* Filter */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-11 rounded-xl">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Bookings</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        {/* Bookings List */}
        <div className="space-y-3">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
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
          ) : data?.bookings && data.bookings.length > 0 ? (
            data.bookings.map((booking) => (
              <Card key={booking.id} className="card-elevated">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary-light flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-semibold">
                        {booking.user?.full_name?.[0]?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-foreground truncate">
                          {booking.user?.full_name || 'Unknown User'}
                        </p>
                        <span className={getStatusBadgeClass(booking.status)}>
                          {booking.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{booking.venue?.name || 'Unknown Venue'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{formatDate(booking.booking_date)} • {booking.start_time || 'N/A'} - {booking.end_time || 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="font-bold text-success text-lg">
                          {formatCurrency(booking.total_amount)}
                        </span>
                        {booking.status !== 'cancelled' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 rounded-lg"
                              onClick={() => setActionDialog({ type: 'refund', booking })}
                            >
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Refund
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-8 rounded-lg"
                              onClick={() => setActionDialog({ type: 'cancel', booking })}
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="card-elevated">
              <CardContent className="py-12 text-center text-muted-foreground">
                No bookings found
              </CardContent>
            </Card>
          )}
        </div>

        {/* Pagination */}
        {data && data.total > 20 && (
          <div className="flex justify-center gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="rounded-xl"
            >
              Previous
            </Button>
            <span className="flex items-center px-4 text-sm text-muted-foreground">
              {page} / {Math.ceil(data.total / 20)}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= Math.ceil(data.total / 20)}
              onClick={() => setPage(page + 1)}
              className="rounded-xl"
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* Action Dialog */}
      <Dialog open={actionDialog.type !== null} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              {actionDialog.type === 'cancel' ? 'Cancel Booking' : 'Refund Booking'}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.type === 'cancel' 
                ? 'This will cancel the booking and notify the user.' 
                : 'Process a refund for this booking.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label>Reason</Label>
            <Textarea
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              placeholder="Enter reason..."
              className="rounded-xl"
            />
          </div>

          <DialogFooter className="flex-row gap-2">
            <Button variant="outline" onClick={closeDialog} className="flex-1 rounded-xl">
              Cancel
            </Button>
            <Button 
              onClick={handleAction}
              disabled={isActionLoading || !actionReason}
              variant={actionDialog.type === 'cancel' ? 'destructive' : 'default'}
              className="flex-1 rounded-xl"
            >
              {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {actionDialog.type === 'cancel' ? 'Cancel Booking' : 'Process Refund'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
