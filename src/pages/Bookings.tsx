import { useState } from "react";
import { Search, ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { MobileHeader } from "@/components/ui/MobileHeader";
import { BookingCard } from "@/components/ui/BookingCard";
import { BottomNav } from "@/components/ui/BottomNav";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const mockBookings = [
  {
    id: "1",
    userName: "Sarah Johnson",
    userAvatar: "",
    venueName: "Creative Studio Downtown",
    date: "Jan 15, 2024",
    time: "10:00 AM - 2:00 PM",
    status: "paid" as const,
  },
  {
    id: "2",
    userName: "Michael Chen",
    userAvatar: "",
    venueName: "Industrial Loft Space",
    date: "Jan 15, 2024",
    time: "3:00 PM - 6:00 PM",
    status: "pending" as const,
  },
  {
    id: "3",
    userName: "Emma Wilson",
    userAvatar: "",
    venueName: "Creative Studio Downtown",
    date: "Jan 16, 2024",
    time: "9:00 AM - 12:00 PM",
    status: "paid" as const,
  },
  {
    id: "4",
    userName: "James Brown",
    userAvatar: "",
    venueName: "Rooftop Garden Venue",
    date: "Jan 17, 2024",
    time: "5:00 PM - 9:00 PM",
    status: "pending" as const,
  },
];

const calendarDays = Array.from({ length: 31 }, (_, i) => i + 1);
const blockedDays = [5, 12, 19, 26];
const today = 15;

export default function Bookings() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentMonth, setCurrentMonth] = useState("January 2024");

  const handleCall = (id: string) => {
    console.log("Calling booking:", id);
  };

  const handleCancel = (id: string) => {
    console.log("Cancelling booking:", id);
  };

  const filteredBookings = mockBookings.filter(
    (b) =>
      b.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.venueName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="mobile-container pb-24">
      <MobileHeader title="Bookings" showNotification />

      <div className="mobile-padding space-y-6 py-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search bookings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Live Bookings */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Live Bookings</h2>
          <div className="space-y-3">
            {filteredBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                {...booking}
                onCall={handleCall}
                onCancel={handleCancel}
              />
            ))}
          </div>
        </div>

        {/* Availability Calendar */}
        <div className="card-elevated p-4">
          <div className="flex items-center justify-between mb-4">
            <button className="p-2 hover:bg-muted rounded-lg transition-colors">
              <ChevronLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <h3 className="font-semibold text-foreground">{currentMonth}</h3>
            <button className="p-2 hover:bg-muted rounded-lg transition-colors">
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for first week offset */}
            {[...Array(1)].map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            
            {calendarDays.map((day) => {
              const isToday = day === today;
              const isBlocked = blockedDays.includes(day);

              return (
                <button
                  key={day}
                  className={cn(
                    "aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-colors relative",
                    isToday && "bg-primary text-primary-foreground",
                    isBlocked && !isToday && "bg-destructive-light text-destructive",
                    !isToday && !isBlocked && "hover:bg-muted"
                  )}
                >
                  {day}
                  {isBlocked && (
                    <Lock className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-primary" />
              <span className="text-xs text-muted-foreground">Today</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-destructive-light border border-destructive/30" />
              <span className="text-xs text-muted-foreground">Blocked</span>
            </div>
          </div>

          {/* Block Time CTA */}
          <Button variant="outline" className="w-full mt-4 gap-2">
            <Lock className="w-4 h-4" />
            Block Time
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
