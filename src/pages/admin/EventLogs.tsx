import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { directApi, EventLog } from '@/lib/directApi';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  Activity,
  Calendar as CalendarIcon,
  MapPin,
  Trophy,
  User,
  CreditCard,
  Shield,
  ChevronDown,
  FileText,
  Clock,
} from 'lucide-react';

const EVENT_TYPES = [
  'booking_confirmed',
  'payment_initiated',
  'payment_completed',
  'booking_cancelled_admin',
  'booking_cancelled_user',
  'venue_created',
  'venue_updated',
  'event_cancelled',
  'event_deleted',
  'user_deactivated',
  'user_signup',
  'slot_blocked',
  'slot_unblocked',
  'event_registration',
  'host_event_request_submitted',
] as const;

const TARGET_TYPES = [
  'booking',
  'venue',
  'event',
  'user',
  'slot',
  'payment',
  'host_request',
] as const;

const getTargetIcon = (targetType: string) => {
  switch (targetType) {
    case 'booking': return CalendarIcon;
    case 'venue': return MapPin;
    case 'event': return Trophy;
    case 'user': return User;
    case 'slot': return Clock;
    case 'payment': return CreditCard;
    case 'host_request': return Shield;
    default: return Activity;
  }
};

const getEventBadgeVariant = (eventType: string): 'default' | 'destructive' | 'outline' | 'secondary' => {
  if (eventType.includes('cancel') || eventType.includes('delete') || eventType.includes('deactivat')) {
    return 'destructive';
  }
  if (eventType.includes('confirm') || eventType.includes('created') || eventType.includes('signup') || eventType.includes('registration') || eventType.includes('completed')) {
    return 'default';
  }
  return 'secondary';
};

const formatEventType = (type: string) =>
  type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

const formatLogDate = (dateString: string) => {
  try {
    return format(new Date(dateString), 'MMM d, HH:mm');
  } catch {
    return 'Invalid date';
  }
};

export default function EventLogs() {
  const [page, setPage] = useState(1);
  const [eventType, setEventType] = useState<string>('');
  const [targetType, setTargetType] = useState<string>('');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['event-logs', { page, eventType, targetType, startDate: startDate?.toISOString(), endDate: endDate?.toISOString() }],
    queryFn: () =>
      directApi.getEventLogs({
        page,
        limit,
        eventType: eventType || undefined,
        targetType: targetType || undefined,
        startDate: startDate?.toISOString(),
        endDate: endDate ? new Date(endDate.getTime() + 86400000).toISOString() : undefined,
      }),
  });

  const actorIds = useMemo(() => data?.logs.map(l => l.actor_id) || [], [data?.logs]);

  const { data: actorMap } = useQuery({
    queryKey: ['actor-profiles', actorIds],
    queryFn: () => directApi.getActorProfiles(actorIds),
    enabled: actorIds.length > 0,
  });

  const clearFilters = () => {
    setEventType('');
    setTargetType('');
    setStartDate(undefined);
    setEndDate(undefined);
    setPage(1);
  };

  const hasFilters = eventType || targetType || startDate || endDate;

  return (
    <AdminLayout title="Event Logs">
      <div className="space-y-4">
        {/* Filters */}
        <Card className="card-elevated">
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Select value={eventType} onValueChange={v => { setEventType(v === 'all' ? '' : v); setPage(1); }}>
                <SelectTrigger className="rounded-xl text-sm">
                  <SelectValue placeholder="Event Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  {EVENT_TYPES.map(t => (
                    <SelectItem key={t} value={t}>{formatEventType(t)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={targetType} onValueChange={v => { setTargetType(v === 'all' ? '' : v); setPage(1); }}>
                <SelectTrigger className="rounded-xl text-sm">
                  <SelectValue placeholder="Target Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Targets</SelectItem>
                  {TARGET_TYPES.map(t => (
                    <SelectItem key={t} value={t} className="capitalize">{t.replace(/_/g, ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("rounded-xl text-sm justify-start", !startDate && "text-muted-foreground")}>
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {startDate ? format(startDate, 'MMM d') : 'From'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={startDate} onSelect={d => { setStartDate(d); setPage(1); }} className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("rounded-xl text-sm justify-start", !endDate && "text-muted-foreground")}>
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {endDate ? format(endDate, 'MMM d') : 'To'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={endDate} onSelect={d => { setEndDate(d); setPage(1); }} className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
            </div>

            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs text-muted-foreground">
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Log Cards */}
        <div className="space-y-3">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="card-elevated">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Skeleton className="h-10 w-10 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : data?.logs && data.logs.length > 0 ? (
            data.logs.map(log => <EventLogCard key={log.id} log={log} actorName={actorMap?.get(log.actor_id)} />)
          ) : (
            <Card className="card-elevated">
              <CardContent className="py-12 text-center text-muted-foreground">
                <Activity className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                <p>No event logs found</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Pagination */}
        {data && data.total > limit && (
          <div className="flex justify-center gap-2 pt-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)} className="rounded-xl">
              Previous
            </Button>
            <span className="flex items-center px-4 text-sm text-muted-foreground">
              {page} / {Math.ceil(data.total / limit)}
            </span>
            <Button variant="outline" size="sm" disabled={page >= Math.ceil(data.total / limit)} onClick={() => setPage(page + 1)} className="rounded-xl">
              Next
            </Button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function EventLogCard({ log, actorName }: { log: EventLog; actorName?: string }) {
  const Icon = getTargetIcon(log.target_type);
  const metadataEntries = Object.entries(log.metadata).filter(([_, v]) => v != null);
  const metadata = log.metadata as Record<string, unknown>;

  const actorFromMetadata = [
    metadata.user_name,
    metadata.booking_user_name,
    metadata.user_display_name,
    metadata.display_name,
    metadata.username,
  ].find(v => typeof v === 'string' && v.trim().length > 0) as string | undefined;

  const bookingId =
    (metadata.booking_id as string | undefined) ||
    (metadata.bookingId as string | undefined) ||
    (log.target_type === 'booking' ? log.target_id : undefined);

  return (
    <Card className="card-elevated">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="icon-container bg-muted">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge variant={getEventBadgeVariant(log.event_type)} className="text-[10px]">
                {formatEventType(log.event_type)}
              </Badge>
              <Badge variant="outline" className="text-[10px] capitalize">
                {log.target_type}
              </Badge>
            </div>
            <p className="text-sm text-foreground">
              by <span className="font-medium">{actorName || actorFromMetadata || 'System'}</span>
            </p>
            {bookingId && (
              <p className="text-xs text-muted-foreground">
                Booking ID: <span className="font-mono break-all">{String(bookingId)}</span>
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {formatLogDate(log.created_at)}
            </p>

            {metadataEntries.length > 0 && (
              <Collapsible>
                <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground mt-2 hover:text-foreground transition-colors">
                  <ChevronDown className="h-3 w-3" />
                  <span>Details ({metadataEntries.length})</span>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-2 p-2 rounded-lg bg-muted/50 space-y-1">
                    {metadataEntries.map(([key, value]) => (
                      <div key={key} className="flex justify-between text-xs gap-2">
                        <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                        <span className="text-foreground font-medium text-right truncate max-w-[60%]">
                          {String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
