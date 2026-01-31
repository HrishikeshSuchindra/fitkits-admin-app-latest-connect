import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { edgeFunctionApi, Venue } from '@/lib/edgeFunctionApi';
import { directApi } from '@/lib/directApi';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
  Plus,
  Pencil, 
  Trash2,
  MapPin,
  DollarSign,
  Loader2
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const defaultVenue: Partial<Venue> = {
  name: '',
  slug: '',
  category: 'courts',
  sport: '',
  location: '',
  address: '',
  price_per_hour: 0,
  is_active: true,
  image_url: '',
  amenities: [],
};

export default function VenuesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    venue: Partial<Venue> | null;
    isNew: boolean;
  }>({ open: false, venue: null, isNew: false });
  const [deleteDialog, setDeleteDialog] = useState<Venue | null>(null);

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['venues', { search, category: categoryFilter, page }],
    queryFn: () => edgeFunctionApi.getVenues({
      search: search || undefined,
      category: categoryFilter !== 'all' ? categoryFilter : undefined,
      page,
      limit: 20,
    }),
  });

  const createMutation = useMutation({
    mutationFn: (venue: Partial<Venue>) => edgeFunctionApi.createVenue(venue),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['venues'] });
      toast.success('Venue created');
      setEditDialog({ open: false, venue: null, isNew: false });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ venueId, updates }: { venueId: string; updates: Partial<Venue> }) =>
      edgeFunctionApi.updateVenue(venueId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['venues'] });
      toast.success('Venue updated');
      setEditDialog({ open: false, venue: null, isNew: false });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (venueId: string) => {
      // Hard delete - permanently removes from database
      const result = await directApi.deleteVenue(venueId);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['venues'] });
      queryClient.refetchQueries({ queryKey: ['venues'] });
      toast.success('Venue permanently deleted');
      setDeleteDialog(null);
    },
    onError: (error: Error) => {
      console.error('Delete venue error:', error);
      toast.error(`Failed to delete venue: ${error.message}`);
    },
  });

  const handleSave = () => {
    if (!editDialog.venue) return;

    const venue = editDialog.venue;

    // Validate required fields
    if (!venue.name?.trim()) {
      toast.error('Venue name is required');
      return;
    }
    if (!venue.location?.trim()) {
      toast.error('Location (city) is required');
      return;
    }
    if (!venue.address?.trim()) {
      toast.error('Address is required');
      return;
    }
    if (!venue.sport?.trim()) {
      toast.error('Sport is required');
      return;
    }

    // Auto-generate slug if empty
    const slug = venue.slug?.trim() || venue.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const venueToSave = {
      ...venue,
      slug,
    };

    if (editDialog.isNew) {
      createMutation.mutate(venueToSave);
    } else {
      updateMutation.mutate({
        venueId: venue.id!,
        updates: venueToSave,
      });
    }
  };

  const isSaveLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <AdminLayout title="My Venues">
      <div className="space-y-4">
        {/* Header with Add Button */}
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">Manage your venues</p>
          <Button 
            size="sm" 
            className="rounded-full px-4"
            onClick={() => navigate('/add-venue')}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add New
          </Button>
        </div>

        {/* Search & Filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search venues..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 rounded-xl"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-10 rounded-xl">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="courts">Courts</SelectItem>
              <SelectItem value="studio">Studio</SelectItem>
              <SelectItem value="recovery">Recovery</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Venues List */}
        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="card-elevated overflow-hidden">
                <Skeleton className="h-40 w-full" />
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))
          ) : data?.venues && data.venues.length > 0 ? (
            data.venues.map((venue) => (
              <Card key={venue.id} className="card-elevated overflow-hidden">
                <div className="relative h-40 bg-muted">
                  {venue.image_url ? (
                    <img 
                      src={venue.image_url} 
                      alt={venue.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <MapPin className="h-12 w-12 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <Badge 
                      variant={venue.is_active ? 'default' : 'secondary'}
                      className="rounded-full"
                    >
                      {venue.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="absolute top-3 right-3">
                    <Switch
                      checked={venue.is_active}
                      onCheckedChange={(checked) => {
                        updateMutation.mutate({
                          venueId: venue.id,
                          updates: { is_active: checked }
                        });
                      }}
                    />
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{venue.name}</h3>
                      <p className="text-sm text-muted-foreground capitalize">
                        {venue.category} • {venue.sport}
                      </p>
                      <div className="flex items-center gap-1 mt-2 text-success font-bold">
                        <span>₹{venue.price_per_hour}/hr</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg"
                        onClick={() => navigate(`/edit-venue/${venue.id}`)}
                      >
                        <Pencil className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => setDeleteDialog(venue)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="card-elevated">
              <CardContent className="py-12 text-center text-muted-foreground">
                No venues found
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

      {/* Edit/Create Dialog */}
      <Dialog 
        open={editDialog.open} 
        onOpenChange={(open) => !open && setEditDialog({ open: false, venue: null, isNew: false })}
      >
        <DialogContent className="mx-4 rounded-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editDialog.isNew ? 'Add New Venue' : 'Edit Venue'}</DialogTitle>
            <DialogDescription>
              {editDialog.isNew ? 'Create a new venue listing' : 'Update venue information'}
            </DialogDescription>
          </DialogHeader>

          {editDialog.venue && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Venue Name *</Label>
                <Input
                  value={editDialog.venue.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const autoSlug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                    setEditDialog(prev => ({
                      ...prev,
                      venue: { 
                        ...prev.venue!, 
                        name,
                        // Auto-generate slug if it's empty or matches previous auto-generated pattern
                        slug: !prev.venue?.slug || prev.venue.slug === prev.venue.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
                          ? autoSlug 
                          : prev.venue.slug
                      }
                    }));
                  }}
                  placeholder="Enter venue name"
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label>Slug (URL-friendly name)</Label>
                <Input
                  value={editDialog.venue.slug}
                  onChange={(e) => setEditDialog(prev => ({
                    ...prev,
                    venue: { ...prev.venue!, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }
                  }))}
                  placeholder="venue-name"
                  className="rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select 
                    value={editDialog.venue.category}
                    onValueChange={(value) => setEditDialog(prev => ({
                      ...prev,
                      venue: { ...prev.venue!, category: value }
                    }))}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="courts">Courts</SelectItem>
                      <SelectItem value="studio">Studio</SelectItem>
                      <SelectItem value="recovery">Recovery</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Sport *</Label>
                  <Input
                    value={editDialog.venue.sport}
                    onChange={(e) => setEditDialog(prev => ({
                      ...prev,
                      venue: { ...prev.venue!, sport: e.target.value }
                    }))}
                    placeholder="e.g., Badminton"
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Location (City) *</Label>
                <Input
                  value={editDialog.venue.location}
                  onChange={(e) => setEditDialog(prev => ({
                    ...prev,
                    venue: { ...prev.venue!, location: e.target.value }
                  }))}
                  placeholder="City or area"
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label>Full Address *</Label>
                <Textarea
                  value={editDialog.venue.address}
                  onChange={(e) => setEditDialog(prev => ({
                    ...prev,
                    venue: { ...prev.venue!, address: e.target.value }
                  }))}
                  placeholder="Full address"
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label>Price per Hour (₹)</Label>
                <Input
                  type="number"
                  value={editDialog.venue.price_per_hour}
                  onChange={(e) => setEditDialog(prev => ({
                    ...prev,
                    venue: { ...prev.venue!, price_per_hour: parseFloat(e.target.value) || 0 }
                  }))}
                  placeholder="0.00"
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label>Image URL</Label>
                <Input
                  value={editDialog.venue.image_url || ''}
                  onChange={(e) => setEditDialog(prev => ({
                    ...prev,
                    venue: { ...prev.venue!, image_url: e.target.value }
                  }))}
                  placeholder="https://..."
                  className="rounded-xl"
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <Label>Active</Label>
                <Switch
                  checked={editDialog.venue.is_active}
                  onCheckedChange={(checked) => setEditDialog(prev => ({
                    ...prev,
                    venue: { ...prev.venue!, is_active: checked }
                  }))}
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => setEditDialog({ open: false, venue: null, isNew: false })}
              className="flex-1 rounded-xl"
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaveLoading} className="flex-1 rounded-xl">
              {isSaveLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editDialog.isNew ? 'Create' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog !== null} onOpenChange={(open) => !open && setDeleteDialog(null)}>
        <DialogContent className="mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle>Delete Venue</DialogTitle>
            <DialogDescription>
              Delete "{deleteDialog?.name}"? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2">
            <Button variant="outline" onClick={() => setDeleteDialog(null)} className="flex-1 rounded-xl">
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteDialog && deleteMutation.mutate(deleteDialog.id)}
              disabled={deleteMutation.isPending}
              className="flex-1 rounded-xl"
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
