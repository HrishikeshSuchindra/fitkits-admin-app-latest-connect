import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { directApi, AuditLog } from '@/lib/directApi';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText,
  User,
  Calendar,
  MapPin,
  Trophy,
  Settings
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

const getActionIcon = (targetType: string) => {
  switch (targetType) {
    case 'user':
      return User;
    case 'booking':
      return Calendar;
    case 'venue':
      return MapPin;
    case 'event':
      return Trophy;
    default:
      return Settings;
  }
};

const getActionBadgeClass = (action: string) => {
  if (action.includes('delete') || action.includes('cancel') || action.includes('deactivate')) {
    return 'badge-danger';
  }
  if (action.includes('create') || action.includes('activate') || action.includes('reactivate')) {
    return 'badge-success';
  }
  return 'badge-muted';
};

export default function AuditLogPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', { page }],
    queryFn: () => directApi.getAuditLogs({ page, limit: 20 }),
  });

  const formatAction = (action: string) => {
    return action
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const formatLogDate = (dateString: string | undefined | null) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      return format(date, 'MMM d, HH:mm');
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <AdminLayout title="Audit Log">
      <div className="space-y-4">
        {/* Logs List */}
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
            data.logs.map((log) => {
              const Icon = getActionIcon(log.target_type);
              return (
                <Card key={log.id} className="card-elevated">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="icon-container bg-muted">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={getActionBadgeClass(log.action)}>
                            {formatAction(log.action)}
                          </span>
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {log.target_type}
                          </Badge>
                        </div>
                        <p className="text-sm text-foreground">
                          by <span className="font-medium">{log.admin?.full_name || 'Unknown'}</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatLogDate(log.created_at)}
                        </p>
                        {log.details && Object.keys(log.details).length > 0 && (
                          <p className="text-xs text-muted-foreground mt-2 truncate">
                            {JSON.stringify(log.details)}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card className="card-elevated">
              <CardContent className="py-12 text-center text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                <p>No audit logs found</p>
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
    </AdminLayout>
  );
}
