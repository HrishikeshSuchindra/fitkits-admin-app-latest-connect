import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, CalendarCheck, Percent, Users } from "lucide-react";
import { MobileHeader } from "@/components/ui/MobileHeader";
import { KPICard } from "@/components/ui/KPICard";
import { DateRangeSelector } from "@/components/ui/DateRangeSelector";
import { HeatmapGrid } from "@/components/ui/HeatmapGrid";
import { TopUsersList } from "@/components/ui/TopUsersList";
import { BottomNav } from "@/components/ui/BottomNav";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { subDays, subMonths, startOfYear, parseISO, getDay, getHours } from "date-fns";

const dateRangeOptions = ["Last 7 Days", "Last 30 Days", "Last 90 Days", "This Year"];

const formatCurrency = (amount: number) => {
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}k`;
  }
  return `₹${amount}`;
};

const getDateRange = (range: string): Date => {
  const now = new Date();
  switch (range) {
    case "Last 7 Days":
      return subDays(now, 7);
    case "Last 30 Days":
      return subDays(now, 30);
    case "Last 90 Days":
      return subDays(now, 90);
    case "This Year":
      return startOfYear(now);
    default:
      return subDays(now, 7);
  }
};

export default function Dashboard() {
  const [dateRange, setDateRange] = useState("Last 7 Days");
  const { user } = useAuth();

  const startDate = useMemo(() => getDateRange(dateRange), [dateRange]);

  // Fetch owner's venues
  const { data: venues } = useQuery({
    queryKey: ['owner-venues', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('venues')
        .select('id, name')
        .eq('owner_id', user.id);
      return data || [];
    },
    enabled: !!user,
  });

  const venueIds = venues?.map(v => v.id) || [];

  // Fetch bookings for KPIs, heatmap, top users
  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['dashboard-bookings', venueIds, startDate.toISOString()],
    queryFn: async () => {
      if (venueIds.length === 0) return [];
      const { data } = await supabase
        .from('bookings')
        .select('id, price, slot_date, slot_time, status, user_id, venue_id')
        .in('venue_id', venueIds)
        .gte('slot_date', startDate.toISOString().split('T')[0])
        .neq('status', 'cancelled');
      return data || [];
    },
    enabled: venueIds.length > 0,
  });

  // Fetch user profiles for top users
  const { data: userProfiles } = useQuery({
    queryKey: ['user-profiles', bookings?.map(b => b.user_id)],
    queryFn: async () => {
      if (!bookings || bookings.length === 0) return [];
      const userIds = [...new Set(bookings.map(b => b.user_id))];
      const { data } = await supabase
        .from('user_profiles')
        .select('id, display_name, email')
        .in('id', userIds);
      return data || [];
    },
    enabled: !!bookings && bookings.length > 0,
  });

  // Fetch previous period for growth comparison
  const previousStartDate = useMemo(() => {
    const now = new Date();
    const daysDiff = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return subDays(startDate, daysDiff);
  }, [startDate]);

  const { data: previousBookings } = useQuery({
    queryKey: ['dashboard-bookings-previous', venueIds, previousStartDate.toISOString(), startDate.toISOString()],
    queryFn: async () => {
      if (venueIds.length === 0) return [];
      const { data } = await supabase
        .from('bookings')
        .select('id, price, user_id')
        .in('venue_id', venueIds)
        .gte('slot_date', previousStartDate.toISOString().split('T')[0])
        .lt('slot_date', startDate.toISOString().split('T')[0])
        .neq('status', 'cancelled');
      return data || [];
    },
    enabled: venueIds.length > 0,
  });

  // Calculate KPIs
  const totalRevenue = bookings?.reduce((sum, b) => sum + (b.price || 0), 0) || 0;
  const totalBookings = bookings?.length || 0;
  const uniqueUsers = new Set(bookings?.map(b => b.user_id) || []).size;

  const previousRevenue = previousBookings?.reduce((sum, b) => sum + (b.price || 0), 0) || 0;
  const previousBookingsCount = previousBookings?.length || 0;
  const previousUniqueUsers = new Set(previousBookings?.map(b => b.user_id) || []).size;

  const revenueGrowth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;
  const bookingsGrowth = previousBookingsCount > 0 ? ((totalBookings - previousBookingsCount) / previousBookingsCount) * 100 : 0;
  const usersGrowth = previousUniqueUsers > 0 ? ((uniqueUsers - previousUniqueUsers) / previousUniqueUsers) * 100 : 0;

  // Calculate occupancy (simplified: bookings / (venues * days * slots per day))
  const daysInRange = Math.ceil((new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const slotsPerDay = 6; // Assuming 6 time slots per day
  const totalSlots = (venues?.length || 1) * daysInRange * slotsPerDay;
  const occupancyRate = totalSlots > 0 ? Math.round((totalBookings / totalSlots) * 100) : 0;

  // Calculate venue performance
  const venuePerformanceData = useMemo(() => {
    if (!venues || !bookings) return [];
    return venues.map(venue => {
      const venueBookings = bookings.filter(b => b.venue_id === venue.id);
      const revenue = venueBookings.reduce((sum, b) => sum + (b.price || 0), 0);
      return {
        name: venue.name.length > 12 ? venue.name.substring(0, 12) + '...' : venue.name,
        value: revenue,
        fill: "hsl(var(--primary))",
      };
    }).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [venues, bookings]);

  // Calculate heatmap data (7 days x 6 time slots)
  const heatmapData = useMemo(() => {
    const grid: number[][] = Array(7).fill(null).map(() => Array(6).fill(0));
    const maxBookings = 10; // Normalize to percentage

    bookings?.forEach(booking => {
      try {
        const date = parseISO(booking.slot_date);
        const dayIndex = (getDay(date) + 6) % 7; // Monday = 0
        
        // Parse slot_time to get hour
        const timeParts = booking.slot_time?.split(':');
        if (!timeParts) return;
        const hour = parseInt(timeParts[0], 10);
        
        // Map hour to time slot index (6AM, 9AM, 12PM, 3PM, 6PM, 9PM)
        let slotIndex = 0;
        if (hour >= 6 && hour < 9) slotIndex = 0;
        else if (hour >= 9 && hour < 12) slotIndex = 1;
        else if (hour >= 12 && hour < 15) slotIndex = 2;
        else if (hour >= 15 && hour < 18) slotIndex = 3;
        else if (hour >= 18 && hour < 21) slotIndex = 4;
        else if (hour >= 21) slotIndex = 5;
        
        grid[dayIndex][slotIndex] += 1;
      } catch {
        // Skip invalid dates
      }
    });

    // Normalize to 0-100
    return grid.map(row => 
      row.map(count => Math.min(100, Math.round((count / maxBookings) * 100)))
    );
  }, [bookings]);

  // Calculate top users
  const topUsers = useMemo(() => {
    if (!bookings || !userProfiles) return [];
    
    const userStats = new Map<string, { bookings: number; revenue: number }>();
    
    bookings.forEach(booking => {
      const current = userStats.get(booking.user_id) || { bookings: 0, revenue: 0 };
      userStats.set(booking.user_id, {
        bookings: current.bookings + 1,
        revenue: current.revenue + (booking.price || 0),
      });
    });

    return Array.from(userStats.entries())
      .map(([userId, stats]) => {
        const profile = userProfiles.find(p => p.id === userId);
        return {
          id: userId,
          name: profile?.display_name || profile?.email?.split('@')[0] || 'Unknown User',
          bookings: stats.bookings,
          revenue: stats.revenue,
          avatar: '',
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 4);
  }, [bookings, userProfiles]);

  const isLoading = bookingsLoading;

  return (
    <div className="mobile-container pb-nav">
      <MobileHeader title="Business Insights" showNotification />

      <div className="mobile-padding space-y-6 py-4">
        {/* Date Range Selector */}
        <DateRangeSelector
          value={dateRange}
          options={dateRangeOptions}
          onChange={setDateRange}
        />

        {/* KPI Grid */}
        <div className="grid grid-cols-2 gap-3">
          <KPICard
            label="Total Revenue"
            value={isLoading ? "..." : formatCurrency(totalRevenue)}
            icon={DollarSign}
            iconBgColor="bg-success-light"
            iconColor="text-success"
            growth={isLoading ? undefined : revenueGrowth}
          />
          <KPICard
            label="Total Bookings"
            value={isLoading ? "..." : totalBookings.toString()}
            icon={CalendarCheck}
            iconBgColor="bg-primary-light"
            iconColor="text-primary"
            growth={isLoading ? undefined : bookingsGrowth}
          />
          <KPICard
            label="Occupancy Rate"
            value={isLoading ? "..." : `${occupancyRate}%`}
            icon={Percent}
            iconBgColor="bg-warning-light"
            iconColor="text-warning"
          />
          <KPICard
            label="Unique Users"
            value={isLoading ? "..." : uniqueUsers.toString()}
            icon={Users}
            iconBgColor="bg-accent"
            iconColor="text-accent-foreground"
            growth={isLoading ? undefined : usersGrowth}
          />
        </div>

        {/* Heatmap */}
        <HeatmapGrid data={heatmapData} />

        {/* Venue Performance */}
        <div className="card-elevated p-4">
          <h3 className="font-semibold text-foreground mb-4">Performance by Venue</h3>
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : venuePerformanceData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No venue data available</p>
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={venuePerformanceData}
                  layout="vertical"
                  margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    width={70}
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      boxShadow: "var(--shadow-md)",
                    }}
                    formatter={(value: number) => [formatCurrency(value), "Revenue"]}
                  />
                  <Bar
                    dataKey="value"
                    radius={[0, 6, 6, 0]}
                    maxBarSize={24}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Top Users */}
        {isLoading ? (
          <div className="card-elevated p-4">
            <Skeleton className="h-6 w-24 mb-4" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-5 w-16" />
                </div>
              ))}
            </div>
          </div>
        ) : topUsers.length === 0 ? (
          <div className="card-elevated p-4">
            <h3 className="font-semibold text-foreground mb-4">Top Users</h3>
            <p className="text-sm text-muted-foreground text-center py-4">No booking data available</p>
          </div>
        ) : (
          <TopUsersList users={topUsers} />
        )}
      </div>

      <BottomNav />
    </div>
  );
}
