import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, Venue } from '@/lib/adminApi';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Plus,
  MoreVertical, 
  Pencil, 
  Trash2,
  MapPin,
  DollarSign,
  Loader2
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

const defaultVenue: Partial<Venue> = {
  name: '',
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
    queryFn: () => adminApi.getVenues({
      search: search || undefined,
      category: categoryFilter !== 'all' ? categoryFilter : undefined,
      page,
      limit: 20,
    }),
  });

  const createMutation = useMutation({
    mutationFn: (venue: Partial<Venue>) => adminApi.createVenue(venue),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['venues'] });
      toast.success('Venue created successfully');
      setEditDialog({ open: false, venue: null, isNew: false });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ venueId, updates }: { venueId: string; updates: Partial<Venue> }) =>
      adminApi.updateVenue(venueId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['venues'] });
      toast.success('Venue updated successfully');
      setEditDialog({ open: false, venue: null, isNew: false });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (venueId: string) => adminApi.deleteVenue(venueId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['venues'] });
      toast.success('Venue deleted successfully');
      setDeleteDialog(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleSave = () => {
    if (!editDialog.venue) return;

    if (editDialog.isNew) {
      createMutation.mutate(editDialog.venue);
    } else {
      updateMutation.mutate({
        venueId: editDialog.venue.id!,
        updates: editDialog.venue,
      });
    }
  };

  const isSaveLoading = createMutation.isPending || updateMutation.isPending;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Venues</h1>
            <p className="text-muted-foreground">Manage venue listings</p>
          </div>
          <Button onClick={() => setEditDialog({ open: true, venue: { ...defaultVenue }, isNew: true })}>
            <Plus className="mr-2 h-4 w-4" />
            Add Venue
          </Button>
        </div>

        {/* Filters */}
        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search venues..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
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
          </CardContent>
        </Card>

        {/* Venues Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="shadow-soft">
                <Skeleton className="h-48 w-full rounded-t-lg" />
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : data?.venues && data.venues.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.venues.map((venue) => (
              <Card key={venue.id} className="shadow-soft overflow-hidden">
                <div className="h-48 bg-muted relative">
                  {venue.image_url ? (
                    <img 
                      src={venue.image_url} 
                      alt={venue.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <MapPin className="h-12 w-12 text-muted-foreground/50" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="secondary" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => setEditDialog({ open: true, venue: { ...venue }, isNew: false })}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeleteDialog(venue)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="absolute top-3 left-3">
                    <Badge variant={venue.is_active ? 'default' : 'secondary'}>
                      {venue.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-foreground">{venue.name}</h3>
                  <p className="text-sm text-muted-foreground capitalize">{venue.category} • {venue.sport}</p>
                  <div className="flex items-center gap-1 mt-2 text-muted-foreground text-sm">
                    <MapPin className="h-4 w-4" />
                    <span className="truncate">{venue.location}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-primary font-semibold">
                    <DollarSign className="h-4 w-4" />
                    <span>{venue.price_per_hour}/hr</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="shadow-soft">
            <CardContent className="py-12 text-center text-muted-foreground">
              No venues found
            </CardContent>
          </Card>
        )}

        {/* Pagination */}
        {data && data.total > 20 && (
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <span className="flex items-center px-4 text-sm text-muted-foreground">
              Page {page} of {Math.ceil(data.total / 20)}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= Math.ceil(data.total / 20)}
              onClick={() => setPage(page + 1)}
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editDialog.isNew ? 'Add New Venue' : 'Edit Venue'}</DialogTitle>
            <DialogDescription>
              {editDialog.isNew ? 'Create a new venue listing' : 'Update venue information'}
            </DialogDescription>
          </DialogHeader>

          {editDialog.venue && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Venue Name</Label>
                <Input
                  value={editDialog.venue.name}
                  onChange={(e) => setEditDialog(prev => ({
                    ...prev,
                    venue: { ...prev.venue!, name: e.target.value }
                  }))}
                  placeholder="Enter venue name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select 
                    value={editDialog.venue.category}
                    onValueChange={(value) => setEditDialog(prev => ({
                      ...prev,
                      venue: { ...prev.venue!, category: value }
                    }))}
                  >
                    <SelectTrigger>
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
                  <Label>Sport</Label>
                  <Input
                    value={editDialog.venue.sport}
                    onChange={(e) => setEditDialog(prev => ({
                      ...prev,
                      venue: { ...prev.venue!, sport: e.target.value }
                    }))}
                    placeholder="e.g., Badminton"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  value={editDialog.venue.location}
                  onChange={(e) => setEditDialog(prev => ({
                    ...prev,
                    venue: { ...prev.venue!, location: e.target.value }
                  }))}
                  placeholder="City or area"
                />
              </div>

              <div className="space-y-2">
                <Label>Address</Label>
                <Textarea
                  value={editDialog.venue.address}
                  onChange={(e) => setEditDialog(prev => ({
                    ...prev,
                    venue: { ...prev.venue!, address: e.target.value }
                  }))}
                  placeholder="Full address"
                />
              </div>

              <div className="space-y-2">
                <Label>Price per Hour ($)</Label>
                <Input
                  type="number"
                  value={editDialog.venue.price_per_hour}
                  onChange={(e) => setEditDialog(prev => ({
                    ...prev,
                    venue: { ...prev.venue!, price_per_hour: parseFloat(e.target.value) || 0 }
                  }))}
                  placeholder="0.00"
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
                />
              </div>

              <div className="flex items-center justify-between">
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

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setEditDialog({ open: false, venue: null, isNew: false })}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaveLoading}>
              {isSaveLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editDialog.isNew ? 'Create' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog !== null} onOpenChange={(open) => !open && setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Venue</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteDialog?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteDialog && deleteMutation.mutate(deleteDialog.id)}
              disabled={deleteMutation.isPending}
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
