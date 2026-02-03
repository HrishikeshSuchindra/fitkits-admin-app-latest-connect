import { User, Settings, Bell, HelpCircle, LogOut, ChevronRight, Shield, CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MobileHeader } from "@/components/ui/MobileHeader";
import { BottomNav } from "@/components/ui/BottomNav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

const menuItems = [
  { icon: User, label: "Edit Profile", href: "/settings/edit-profile" },
  { icon: Bell, label: "Notifications", href: "/notifications" },
  { icon: Shield, label: "Security", href: "/security" },
  { icon: Settings, label: "Settings", href: "/app-settings" },
  { icon: HelpCircle, label: "Help & Support", href: "/help" },
];

const formatCurrency = (amount: number) => {
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}k`;
  }
  return `₹${amount}`;
};

export default function Profile() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  // Fetch owner stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['profile-stats', user?.id],
    queryFn: async () => {
      if (!user) return { venuesCount: 0, bookingsCount: 0, totalRevenue: 0 };
      
      // Get venues count
      const { count: venuesCount } = await supabase
        .from('venues')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', user.id);
      
      // Get venue IDs for bookings query
      const { data: venues } = await supabase
        .from('venues')
        .select('id')
        .eq('owner_id', user.id);
      
      const venueIds = venues?.map(v => v.id) || [];
      
      if (venueIds.length === 0) {
        return { venuesCount: venuesCount || 0, bookingsCount: 0, totalRevenue: 0 };
      }
      
      // Get bookings stats
      const { data: bookings } = await supabase
        .from('bookings')
        .select('price')
        .in('venue_id', venueIds)
        .neq('status', 'cancelled');
      
      return {
        venuesCount: venuesCount || 0,
        bookingsCount: bookings?.length || 0,
        totalRevenue: bookings?.reduce((sum, b) => sum + (b.price || 0), 0) || 0,
      };
    },
    enabled: !!user,
  });

  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'User';
  const avatarInitial = displayName[0]?.toUpperCase() || 'U';

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const handleMenuClick = (href: string) => {
    if (href !== '#') {
      navigate(href);
    }
  };

  return (
    <div className="mobile-container pb-nav">
      <MobileHeader title="Profile" showMenu={false} showNotification={false} />

      <div className="mobile-padding space-y-6 py-6">
        {/* Profile Header */}
        <div className="card-elevated p-6 text-center animate-fade-in">
          <Avatar className="w-20 h-20 mx-auto mb-4">
            <AvatarImage src="" alt="Profile" />
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-semibold">
              {avatarInitial}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-xl font-bold text-foreground">{displayName}</h2>
          <p className="text-sm text-muted-foreground">{user?.email || ''}</p>
          <div className="mt-4 pt-4 border-t border-border grid grid-cols-3 gap-4">
            <div>
              {statsLoading ? (
                <Skeleton className="h-6 w-8 mx-auto mb-1" />
              ) : (
                <p className="text-lg font-bold text-foreground">{stats?.venuesCount || 0}</p>
              )}
              <p className="text-xs text-muted-foreground">Venues</p>
            </div>
            <div>
              {statsLoading ? (
                <Skeleton className="h-6 w-10 mx-auto mb-1" />
              ) : (
                <p className="text-lg font-bold text-foreground">{stats?.bookingsCount || 0}</p>
              )}
              <p className="text-xs text-muted-foreground">Bookings</p>
            </div>
            <div>
              {statsLoading ? (
                <Skeleton className="h-6 w-12 mx-auto mb-1" />
              ) : (
                <p className="text-lg font-bold text-success">{formatCurrency(stats?.totalRevenue || 0)}</p>
              )}
              <p className="text-xs text-muted-foreground">Revenue</p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="card-elevated overflow-hidden">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={() => handleMenuClick(item.href)}
                className={cn(
                  "w-full px-4 py-4 flex items-center gap-3 hover:bg-muted transition-colors animate-fade-in",
                  index !== menuItems.length - 1 && "border-b border-border"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="icon-container-sm bg-muted">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <span className="flex-1 text-left font-medium text-foreground">
                  {item.label}
                </span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            );
          })}
        </div>

        {/* Logout */}
        <button 
          onClick={handleLogout}
          className="card-elevated w-full px-4 py-4 flex items-center gap-3 hover:bg-destructive-light transition-colors"
        >
          <div className="icon-container-sm bg-destructive-light">
            <LogOut className="w-4 h-4 text-destructive" />
          </div>
          <span className="flex-1 text-left font-medium text-destructive">
            Log Out
          </span>
        </button>

        {/* Version */}
        <p className="text-center text-xs text-muted-foreground">
          Version 1.0.0
        </p>
      </div>

      <BottomNav />
    </div>
  );
}
