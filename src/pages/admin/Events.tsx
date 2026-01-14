import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, Event } from '@/lib/adminApi';
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
  Star,
  Trash2,
  Loader2,
  Calendar,
  Users,
  MapPin
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';

export default function EventsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [actionDialog, setActionDialog] = useState<{
    type: 'cancel' | 'delete' | null;
    event: Event | null;
  }>({ type: null, event: null });
  const [actionReason, setActionReason] = useState('');

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['events', { status: statusFilter, page }],
    queryFn: () => adminApi.getEvents({
      status: statusFilter !== 'all' ? statusFilter : undefined,
      page,
      limit: 20,
    }),
  });

  const cancelMutation = useMutation({
    mutationFn: ({ eventId, reason }: { eventId: string; reason: string }) =>
      adminApi.cancelEvent(eventId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Event cancelled');
      closeDialog();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const toggleFeaturedMutation = useMutation({
    mutationFn: (eventId: string) => adminApi.toggleEventFeatured(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Featured status updated');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (eventId: string) => adminApi.deleteEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Event deleted');
      closeDialog();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const closeDialog = () => {
    setActionDialog({ type: null, event: null });
    setActionReason('');
  };

  const handleAction = () => {
    if (!actionDialog.event) return;

    switch (actionDialog.type) {
      case 'cancel':
        cancelMutation.mutate({ eventId: actionDialog.event.id, reason: actionReason });
        break;
      case 'delete':
        deleteMutation.mutate(actionDialog.event.id);
        break;
    }
  };

  const isActionLoading = cancelMutation.isPending || deleteMutation.isPending;

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'badge-primary';
      case 'ongoing':
        return 'badge-success';
      case 'completed':
        return 'badge-muted';
      case 'cancelled':
        return 'badge-danger';
      default:
        return 'badge-muted';
    }
  };

  const formatEventDate = (dateString: string | undefined | null) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      return format(date, 'MMM d');
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <AdminLayout title="Events">
      <div className="space-y-4">
        {/* Filter */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-11 rounded-xl">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="ongoing">Ongoing</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        {/* Events List */}
        <div className="space-y-3">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="card-elevated">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : data?.events && data.events.length > 0 ? (
            data.events.map((event) => (
              <Card key={event.id} className="card-elevated">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{event.title}</h3>
                      {event.is_featured && (
                        <Star className="h-4 w-4 fill-warning text-warning" />
                      )}
                    </div>
                    <span className={getStatusBadgeClass(event.status)}>
                      {event.status}
                    </span>
                  </div>
                  
                  <div className="space-y-1 mb-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {formatEventDate(event.start_date)}
                        {event.end_date !== event.start_date && ` - ${formatEventDate(event.end_date)}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{event.venue?.name || 'TBD'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>{event.max_participants} participants max</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {event.sport}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {event.event_type}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg flex-1"
                      onClick={() => toggleFeaturedMutation.mutate(event.id)}
                    >
                      <Star className={`h-3 w-3 mr-1 ${event.is_featured ? 'fill-warning text-warning' : ''}`} />
                      {event.is_featured ? 'Unfeature' : 'Feature'}
                    </Button>
                    {event.status !== 'cancelled' && event.status !== 'completed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg text-destructive"
                        onClick={() => setActionDialog({ type: 'cancel', event })}
                      >
                        <XCircle className="h-3 w-3 mr-1" />
                        Cancel
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => setActionDialog({ type: 'delete', event })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="card-elevated">
              <CardContent className="py-12 text-center text-muted-foreground">
                No events found
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
              {actionDialog.type === 'cancel' ? 'Cancel Event' : 'Delete Event'}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.type === 'cancel' 
                ? 'This will cancel the event and notify all participants.' 
                : `Delete "${actionDialog.event?.title}"? This cannot be undone.`}
            </DialogDescription>
          </DialogHeader>

          {actionDialog.type === 'cancel' && (
            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Enter cancellation reason..."
                className="rounded-xl"
              />
            </div>
          )}

          <DialogFooter className="flex-row gap-2">
            <Button variant="outline" onClick={closeDialog} className="flex-1 rounded-xl">
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleAction}
              disabled={isActionLoading || (actionDialog.type === 'cancel' && !actionReason)}
              className="flex-1 rounded-xl"
            >
              {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {actionDialog.type === 'cancel' ? 'Cancel Event' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
