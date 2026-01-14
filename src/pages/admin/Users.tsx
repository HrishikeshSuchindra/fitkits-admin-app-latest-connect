import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { directApi, User } from '@/lib/directApi';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Search, 
  MoreVertical, 
  UserX, 
  UserCheck, 
  Shield,
  Loader2,
  Phone,
  Mail
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [actionDialog, setActionDialog] = useState<{
    type: 'deactivate' | 'reactivate' | 'role' | null;
    user: User | null;
  }>({ type: null, user: null });
  const [actionReason, setActionReason] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('');

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['users', { search, status: statusFilter, page }],
    queryFn: () => directApi.getUsers({
      search: search || undefined,
      status: statusFilter !== 'all' ? statusFilter as 'active' | 'inactive' : undefined,
      page,
      limit: 20,
    }),
  });

  const deactivateMutation = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
      directApi.deactivateUser(userId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deactivated successfully');
      closeDialog();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: (userId: string) => directApi.reactivateUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User reactivated successfully');
      closeDialog();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const setRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: 'admin' | 'moderator' | 'user' }) =>
      directApi.setUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User role updated successfully');
      closeDialog();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const closeDialog = () => {
    setActionDialog({ type: null, user: null });
    setActionReason('');
    setSelectedRole('');
  };

  const handleAction = () => {
    if (!actionDialog.user) return;

    switch (actionDialog.type) {
      case 'deactivate':
        deactivateMutation.mutate({ userId: actionDialog.user.id, reason: actionReason });
        break;
      case 'reactivate':
        reactivateMutation.mutate(actionDialog.user.id);
        break;
      case 'role':
        if (selectedRole) {
          setRoleMutation.mutate({ 
            userId: actionDialog.user.id, 
            role: selectedRole as 'admin' | 'moderator' | 'user' 
          });
        }
        break;
    }
  };

  const isActionLoading = deactivateMutation.isPending || reactivateMutation.isPending || setRoleMutation.isPending;

  return (
    <AdminLayout title="Users">
      <div className="space-y-4">
        {/* Search & Filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 rounded-xl"
            />
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-10 rounded-xl flex-1">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Users List */}
        <div className="space-y-3">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="card-elevated">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                    <Skeleton className="h-8 w-8" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : data?.users && data.users.length > 0 ? (
            data.users.map((user) => (
              <Card key={user.id} className="card-elevated">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary-light flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-semibold text-lg">
                        {user.full_name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-foreground truncate">
                          {user.full_name || 'No name'}
                        </p>
                        <Badge 
                          variant={user.is_active ? 'default' : 'secondary'}
                          className="text-[10px] px-2 py-0"
                        >
                          {user.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{user.email}</span>
                      </div>
                      {user.phone && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          <span>{user.phone}</span>
                        </div>
                      )}
                      <Badge variant="outline" className="mt-2 text-[10px]">
                        {user.role || 'user'}
                      </Badge>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => setActionDialog({ type: 'role', user })}
                        >
                          <Shield className="mr-2 h-4 w-4" />
                          Change Role
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {user.is_active ? (
                          <DropdownMenuItem
                            onClick={() => setActionDialog({ type: 'deactivate', user })}
                            className="text-destructive"
                          >
                            <UserX className="mr-2 h-4 w-4" />
                            Deactivate
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => setActionDialog({ type: 'reactivate', user })}
                          >
                            <UserCheck className="mr-2 h-4 w-4" />
                            Reactivate
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="card-elevated">
              <CardContent className="py-12 text-center text-muted-foreground">
                No users found
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
              {actionDialog.type === 'deactivate' && 'Deactivate User'}
              {actionDialog.type === 'reactivate' && 'Reactivate User'}
              {actionDialog.type === 'role' && 'Change User Role'}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.type === 'deactivate' && 
                `Deactivate ${actionDialog.user?.full_name || actionDialog.user?.email}?`}
              {actionDialog.type === 'reactivate' && 
                `Reactivate ${actionDialog.user?.full_name || actionDialog.user?.email}?`}
              {actionDialog.type === 'role' && 
                `Change role for ${actionDialog.user?.full_name || actionDialog.user?.email}`}
            </DialogDescription>
          </DialogHeader>

          {actionDialog.type === 'deactivate' && (
            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Enter reason..."
                className="rounded-xl"
              />
            </div>
          )}

          {actionDialog.type === 'role' && (
            <div className="space-y-2">
              <Label>New Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter className="flex-row gap-2">
            <Button variant="outline" onClick={closeDialog} className="flex-1 rounded-xl">
              Cancel
            </Button>
            <Button 
              onClick={handleAction}
              disabled={isActionLoading || (actionDialog.type === 'role' && !selectedRole)}
              variant={actionDialog.type === 'deactivate' ? 'destructive' : 'default'}
              className="flex-1 rounded-xl"
            >
              {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
