import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, CalendarCheck, Plus } from "lucide-react";
import { MobileHeader } from "@/components/ui/MobileHeader";
import { KPICard } from "@/components/ui/KPICard";
import { VenueCard } from "@/components/ui/VenueCard";
import { BottomNav } from "@/components/ui/BottomNav";
import { Button } from "@/components/ui/button";

const mockVenues = [
  {
    id: "1",
    name: "Creative Studio Downtown",
    category: "Photography Studio",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop",
    pricePerHour: 85,
    rating: 4.8,
    location: "Downtown, NYC",
    isActive: true,
  },
  {
    id: "2",
    name: "Industrial Loft Space",
    category: "Event Space",
    image: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=600&h=400&fit=crop",
    pricePerHour: 120,
    rating: 4.6,
    location: "Brooklyn, NYC",
    isActive: true,
  },
  {
    id: "3",
    name: "Rooftop Garden Venue",
    category: "Outdoor Space",
    image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600&h=400&fit=crop",
    pricePerHour: 200,
    rating: 4.9,
    location: "Manhattan, NYC",
    isActive: false,
  },
];

export default function MyVenues() {
  const navigate = useNavigate();
  const [venues, setVenues] = useState(mockVenues);

  const handleToggleActive = (id: string, active: boolean) => {
    setVenues((prev) =>
      prev.map((venue) =>
        venue.id === id ? { ...venue, isActive: active } : venue
      )
    );
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
            value="8"
            icon={CalendarCheck}
            iconBgColor="bg-success-light"
            iconColor="text-success"
          />
        </div>

        {/* My Venues Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">My Venues</h2>
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
            {venues.map((venue) => (
              <VenueCard
                key={venue.id}
                {...venue}
                onToggleActive={handleToggleActive}
                onEdit={handleEdit}
              />
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
