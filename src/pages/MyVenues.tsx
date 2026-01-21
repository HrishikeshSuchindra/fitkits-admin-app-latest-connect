import { useNavigate } from "react-router-dom";
import { Building2, CalendarCheck, Plus } from "lucide-react";
import { MobileHeader } from "@/components/ui/MobileHeader";
import { KPICard } from "@/components/ui/KPICard";
import { VenueCard } from "@/components/ui/VenueCard";
import { BottomNav } from "@/components/ui/BottomNav";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";

export default function MyVenues() {
  const navigate = useNavigate();

  // Fetch only active venues from the database
  const { data: venues = [], isLoading } = useQuery({
    queryKey: ['user-venues'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('venues')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Helper to format category/type for display
      const formatLabel = (value: string): string => {
        if (!value) return 'Venue';
        // Handle kebab-case (e.g., "martial-arts" -> "Martial Arts")
        return value
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
      };
      
      return data.map(venue => ({
        id: venue.id,
        name: venue.name,
        // Display category and type (sport) together if available
        category: venue.sport 
          ? `${formatLabel(venue.category || 'courts')} • ${formatLabel(venue.sport)}`
          : formatLabel(venue.category || 'Venue'),
        image: venue.image_url || 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop',
        pricePerHour: venue.price_per_hour || 0,
        rating: 4.5, // Default rating since we don't have ratings yet
        location: venue.city || venue.location || '',
        isActive: venue.is_active,
      }));
    },
  });

  // Fetch today's bookings count
  const { data: todayBookingsCount = 0 } = useQuery({
    queryKey: ['today-bookings-count'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { count, error } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('slot_date', today)
        .eq('status', 'confirmed');

      if (error) throw error;
      return count || 0;
    },
  });

  const handleToggleActive = (id: string, active: boolean) => {
    console.log("Toggle venue:", id, active);
    // This would need to update the database, but for user view we just show active venues
  };

  const handleEdit = (id: string) => {
    console.log("Edit venue:", id);
  };

  const activeVenues = venues.filter((v) => v.isActive).length;

  return (
    <div className="mobile-container pb-24">
      <MobileHeader title="Management" showNotification />

      <div className="mobile-padding space-y-6 py-4">
        {/* KPI Summary */}
        <div className="grid grid-cols-2 gap-3">
          <KPICard
            label="Active Venues"
            value={activeVenues}
            icon={Building2}
            iconBgColor="bg-primary-light"
            iconColor="text-primary"
          />
          <KPICard
            label="Today's Bookings"
            value={todayBookingsCount}
            icon={CalendarCheck}
            iconBgColor="bg-success-light"
            iconColor="text-success"
          />
        </div>

        {/* My Venues Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Available Venues</h2>
            <Button
              size="sm"
              onClick={() => navigate("/add-venue")}
              className="gap-1.5 bg-success hover:bg-success/90"
            >
              <Plus className="w-4 h-4" />
              Add New
            </Button>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-xl overflow-hidden border">
                  <Skeleton className="h-40 w-full" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ))
            ) : venues.length > 0 ? (
              venues.map((venue) => (
                <VenueCard
                  key={venue.id}
                  {...venue}
                  onToggleActive={handleToggleActive}
                  onEdit={handleEdit}
                />
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No venues available
              </div>
            )}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
