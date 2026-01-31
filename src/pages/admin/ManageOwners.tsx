import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  Eye,
  MapPin,
  IndianRupee,
  Calendar,
  Loader2,
  UserCheck,
  UserX
} from 'lucide-react';

interface OwnerApplication {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  phone: string;
  business_name: string;
  message: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

interface OwnerVenue {
  id: string;
  name: string;
  location: string;
  is_active: boolean;
}

interface OwnerStats {
  user_id: string;
  email: string;
  full_name: string;
  phone: string;
  venue_count: number;
  total_bookings: number;
  total_revenue: number;
  venues?: OwnerVenue[];
}

export default function ManageOwners() {
  const [applications, setApplications] = useState<OwnerApplication[]>([]);
  const [owners, setOwners] = useState<OwnerStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<OwnerApplication | null>(null);
  const [selectedOwner, setSelectedOwner] = useState<OwnerStats | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'application' | 'owner'; id: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch applications
      const { data: apps, error: appsError } = await supabase
        .from('owner_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (appsError) throw appsError;
      setApplications(apps || []);

      // Fetch ALL venue owners from user_roles table (not just from owner_applications)
      // This ensures we see all existing owners, even if they didn't go through the application process
      const { data: roleData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'venue_owner');

      if (rolesError) throw rolesError;

      // Get unique owner user IDs
      const ownerUserIds = [...new Set((roleData || []).map(r => r.user_id))];

      // For each owner, fetch their profile, venues, and stats
      const ownerStats: OwnerStats[] = await Promise.all(
        ownerUserIds.map(async (userId) => {
          // Get profile info (prefer owner_applications, fallback to profiles)
          // NOTE: We must NOT use supabase.auth.admin in the browser.
          let ownerInfo = { email: 'N/A', full_name: 'Unknown', phone: '' };

          const { data: appData } = await supabase
            .from('owner_applications')
            .select('email, full_name, phone')
            .eq('user_id', userId)
            .eq('status', 'approved')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          // Profiles schema differs across environments (some use id, some use user_id)
          const fetchProfile = async (): Promise<any | null> => {
            // Try user_id first
            const byUserId = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', userId)
              .maybeSingle();

            if (!byUserId.error && byUserId.data) return byUserId.data;

            // If the column doesn't exist OR there was no row, try legacy id mapping
            const shouldTryId =
              !!byUserId.error ||
              !byUserId.data ||
              (byUserId.error?.message || '').toLowerCase().includes('column') ||
              (byUserId.error?.message || '').toLowerCase().includes('user_id');

            if (!shouldTryId) return null;

            const byId = await supabase
              .from('profiles')
              .select('*')
              .eq('id', userId)
              .maybeSingle();

            if (!byId.error && byId.data) return byId.data;
            return null;
          };

          const profileData = await fetchProfile();

          ownerInfo = {
            email: appData?.email || profileData?.email || 'N/A',
            full_name:
              appData?.full_name ||
              profileData?.full_name ||
              profileData?.display_name ||
              'Unknown',
            phone: appData?.phone || profileData?.phone || profileData?.phone_number || '',
          };

          // Get venues for this owner
          const { data: venueData, count: venueCount } = await supabase
            .from('venues')
            .select('id, name, city, is_active', { count: 'exact' })
            .eq('owner_id', userId);

          // Get bookings and revenue across all owner's venues
          // Avoid PostgREST embedded joins here because FK relationships may not exist.
          const venueIds = (venueData || []).map(v => v.id);
          let totalBookings = 0;
          let totalRevenue = 0;

          if (venueIds.length > 0) {
            const { data: bookings, error: bookingsError } = await supabase
              .from('bookings')
              .select('total_amount')
              .in('venue_id', venueIds);

            if (bookingsError) {
              console.error('Error fetching bookings for owner:', userId, bookingsError);
            } else {
              totalBookings = bookings?.length || 0;
              totalRevenue = bookings?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;
            }
          }

          return {
            user_id: userId,
            email: ownerInfo.email,
            full_name: ownerInfo.full_name,
            phone: ownerInfo.phone,
            venue_count: venueCount || 0,
            total_bookings: totalBookings,
            total_revenue: totalRevenue,
            venues: (venueData || []).map(v => ({
              id: v.id,
              name: v.name,
              location: v.city || '',
              is_active: v.is_active,
            })),
          };
        })
      );

      setOwners(ownerStats);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (application: OwnerApplication) => {
    setActionLoading(application.id);
    try {
      // Update application status
      const { error: updateError } = await supabase
        .from('owner_applications')
        .update({ status: 'approved' })
        .eq('id', application.id);

      if (updateError) throw updateError;

      // Add venue_owner role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: application.user_id,
          role: 'venue_owner',
        });

      if (roleError && !roleError.message.includes('duplicate')) {
        throw roleError;
      }

      // Sync user to profiles table for user application visibility
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: application.user_id,
          display_name: application.full_name,
          phone_number: application.phone,
          is_active: true,
        }, { onConflict: 'user_id' });

      if (profileError) {
        console.error('Error syncing profile:', profileError);
        // Don't fail the approval, just log the error
      }

      toast.success(`${application.full_name} has been approved as a venue owner`);
      fetchData();
    } catch (error) {
      console.error('Error approving application:', error);
      toast.error('Failed to approve application');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (application: OwnerApplication) => {
    setActionLoading(application.id);
    try {
      const { error } = await supabase
        .from('owner_applications')
        .update({ status: 'rejected' })
        .eq('id', application.id);

      if (error) throw error;

      toast.success(`Application from ${application.full_name} has been rejected`);
      fetchData();
    } catch (error) {
      console.error('Error rejecting application:', error);
      toast.error('Failed to reject application');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    
    setActionLoading(deleteConfirm.id);
    try {
      if (deleteConfirm.type === 'application') {
        const { error } = await supabase
          .from('owner_applications')
          .delete()
          .eq('id', deleteConfirm.id);

        if (error) throw error;
        toast.success('Application deleted');
      } else {
        // Remove venue_owner role
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', deleteConfirm.id)
          .eq('role', 'venue_owner');

        if (error) throw error;

        // Update application status back to rejected
        await supabase
          .from('owner_applications')
          .update({ status: 'rejected' })
          .eq('user_id', deleteConfirm.id);

        toast.success('Owner access revoked');
      }
      fetchData();
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Failed to delete');
    } finally {
      setActionLoading(null);
      setDeleteConfirm(null);
    }
  };

  const pendingCount = applications.filter(a => a.status === 'pending').length;

  return (
    <AdminLayout title="Manage Owners">
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="card-elevated">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 mx-auto rounded-xl bg-warning/10 flex items-center justify-center mb-2">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 mx-auto rounded-xl bg-success/10 flex items-center justify-center mb-2">
                <UserCheck className="h-5 w-5 text-success" />
              </div>
              <p className="text-2xl font-bold">{owners.length}</p>
              <p className="text-xs text-muted-foreground">Active Owners</p>
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 mx-auto rounded-xl bg-destructive/10 flex items-center justify-center mb-2">
                <UserX className="h-5 w-5 text-destructive" />
              </div>
              <p className="text-2xl font-bold">
                {applications.filter(a => a.status === 'rejected').length}
              </p>
              <p className="text-xs text-muted-foreground">Rejected</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending" className="relative">
              Pending
              {pendingCount > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                  {pendingCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="owners">Active Owners</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>

          {/* Pending Applications */}
          <TabsContent value="pending" className="space-y-3">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : applications.filter(a => a.status === 'pending').length === 0 ? (
              <Card className="card-elevated">
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No pending applications</p>
                </CardContent>
              </Card>
            ) : (
              applications
                .filter(a => a.status === 'pending')
                .map(app => (
                  <Card key={app.id} className="card-elevated">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{app.full_name}</p>
                          <p className="text-sm text-muted-foreground truncate">{app.email}</p>
                          <p className="text-sm text-muted-foreground">{app.business_name}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Applied {new Date(app.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setSelectedApplication(app)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-success hover:text-success"
                            onClick={() => handleApprove(app)}
                            disabled={actionLoading === app.id}
                          >
                            {actionLoading === app.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleReject(app)}
                            disabled={actionLoading === app.id}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
            )}
          </TabsContent>

          {/* Active Owners */}
          <TabsContent value="owners" className="space-y-3">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : owners.length === 0 ? (
              <Card className="card-elevated">
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No active venue owners</p>
                </CardContent>
              </Card>
            ) : (
              owners.map(owner => (
                <Card key={owner.user_id} className="card-elevated">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{owner.full_name}</p>
                        <p className="text-sm text-muted-foreground truncate">{owner.email}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            <MapPin className="h-3 w-3 mr-1" />
                            {owner.venue_count} Venues
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            <Calendar className="h-3 w-3 mr-1" />
                            {owner.total_bookings} Bookings
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            <IndianRupee className="h-3 w-3 mr-1" />
                            ₹{owner.total_revenue.toLocaleString()}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setSelectedOwner(owner)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteConfirm({ type: 'owner', id: owner.user_id })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Rejected Applications */}
          <TabsContent value="rejected" className="space-y-3">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : applications.filter(a => a.status === 'rejected').length === 0 ? (
              <Card className="card-elevated">
                <CardContent className="py-8 text-center text-muted-foreground">
                  <XCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No rejected applications</p>
                </CardContent>
              </Card>
            ) : (
              applications
                .filter(a => a.status === 'rejected')
                .map(app => (
                  <Card key={app.id} className="card-elevated">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{app.full_name}</p>
                          <p className="text-sm text-muted-foreground truncate">{app.email}</p>
                          <p className="text-sm text-muted-foreground">{app.business_name}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setSelectedApplication(app)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteConfirm({ type: 'application', id: app.id })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Application Details Dialog */}
      <Dialog open={!!selectedApplication} onOpenChange={() => setSelectedApplication(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Full Name</p>
                  <p className="font-medium">{selectedApplication.full_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedApplication.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p className="font-medium">{selectedApplication.phone}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Business Name</p>
                  <p className="font-medium">{selectedApplication.business_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge variant={
                    selectedApplication.status === 'approved' ? 'default' :
                    selectedApplication.status === 'rejected' ? 'destructive' : 'secondary'
                  }>
                    {selectedApplication.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Applied On</p>
                  <p className="font-medium">
                    {new Date(selectedApplication.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {selectedApplication.message && (
                <div>
                  <p className="text-muted-foreground text-sm">Message</p>
                  <p className="text-sm mt-1 p-3 bg-muted rounded-lg">
                    {selectedApplication.message}
                  </p>
                </div>
              )}
              {selectedApplication.status === 'pending' && (
                <div className="flex gap-2 pt-2">
                  <Button
                    className="flex-1"
                    onClick={() => {
                      handleApprove(selectedApplication);
                      setSelectedApplication(null);
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => {
                      handleReject(selectedApplication);
                      setSelectedApplication(null);
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Owner Details Dialog */}
      <Dialog open={!!selectedOwner} onOpenChange={() => setSelectedOwner(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Owner Details</DialogTitle>
          </DialogHeader>
          {selectedOwner && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Full Name</p>
                  <p className="font-medium">{selectedOwner.full_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedOwner.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p className="font-medium">{selectedOwner.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Venues</p>
                  <p className="font-medium">{selectedOwner.venue_count}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Bookings</p>
                  <p className="font-medium">{selectedOwner.total_bookings}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Revenue</p>
                  <p className="font-medium">₹{selectedOwner.total_revenue.toLocaleString()}</p>
                </div>
              </div>

              {/* Venues List */}
              {selectedOwner.venues && selectedOwner.venues.length > 0 && (
                <div>
                  <p className="text-muted-foreground text-sm mb-2">Venues ({selectedOwner.venues.length})</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedOwner.venues.map((venue) => (
                      <div
                        key={venue.id}
                        className="flex items-center justify-between p-2 bg-muted rounded-lg text-sm"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <MapPin className="h-3 w-3 shrink-0 text-muted-foreground" />
                          <span className="truncate">{venue.name}</span>
                        </div>
                        <Badge variant={venue.is_active ? 'default' : 'secondary'} className="text-xs shrink-0">
                          {venue.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedOwner.venues && selectedOwner.venues.length === 0 && (
                <div className="text-center py-3 text-muted-foreground text-sm bg-muted rounded-lg">
                  <MapPin className="h-5 w-5 mx-auto mb-1 opacity-50" />
                  No venues listed yet
                </div>
              )}

              <Button
                variant="destructive"
                className="w-full"
                onClick={() => {
                  setDeleteConfirm({ type: 'owner', id: selectedOwner.user_id });
                  setSelectedOwner(null);
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Revoke Access
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Action</DialogTitle>
            <DialogDescription>
              {deleteConfirm?.type === 'owner'
                ? 'This will revoke venue owner access. They will no longer be able to manage venues.'
                : 'This will permanently delete the application.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Confirm'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
