import { User, Settings, Bell, HelpCircle, LogOut, ChevronRight, Shield, CreditCard } from "lucide-react";
import { MobileHeader } from "@/components/ui/MobileHeader";
import { BottomNav } from "@/components/ui/BottomNav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const menuItems = [
  { icon: User, label: "Edit Profile", href: "#" },
  { icon: Bell, label: "Notifications", href: "#", badge: "3" },
  { icon: CreditCard, label: "Payment Methods", href: "#" },
  { icon: Shield, label: "Security", href: "#" },
  { icon: Settings, label: "Settings", href: "#" },
  { icon: HelpCircle, label: "Help & Support", href: "#" },
];

export default function Profile() {
  return (
    <div className="mobile-container pb-nav">
      <MobileHeader title="Profile" showMenu={false} showNotification={false} />

      <div className="mobile-padding space-y-6 py-6">
        {/* Profile Header */}
        <div className="card-elevated p-6 text-center animate-fade-in">
          <Avatar className="w-20 h-20 mx-auto mb-4">
            <AvatarImage src="" alt="Profile" />
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-semibold">
              JD
            </AvatarFallback>
          </Avatar>
          <h2 className="text-xl font-bold text-foreground">John Doe</h2>
          <p className="text-sm text-muted-foreground">john.doe@example.com</p>
          <div className="mt-4 pt-4 border-t border-border grid grid-cols-3 gap-4">
            <div>
              <p className="text-lg font-bold text-foreground">3</p>
              <p className="text-xs text-muted-foreground">Venues</p>
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">156</p>
              <p className="text-xs text-muted-foreground">Bookings</p>
            </div>
            <div>
              <p className="text-lg font-bold text-success">$12.5k</p>
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
                {item.badge && (
                  <span className="badge-primary">{item.badge}</span>
                )}
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            );
          })}
        </div>

        {/* Logout */}
        <button className="card-elevated w-full px-4 py-4 flex items-center gap-3 hover:bg-destructive-light transition-colors">
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
