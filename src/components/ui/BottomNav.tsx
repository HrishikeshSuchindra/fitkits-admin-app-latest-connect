import { cn } from "@/lib/utils";
import { LucideIcon, LayoutDashboard, Building2, Calendar, PlusCircle, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

interface NavItem {
  icon: LucideIcon;
  label: string;
  path: string;
  isSpecial?: boolean;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Insights", path: "/" },
  { icon: Building2, label: "Venues", path: "/venues" },
  { icon: PlusCircle, label: "Add", path: "/add-venue", isSpecial: true },
  { icon: Calendar, label: "Bookings", path: "/bookings" },
  { icon: User, label: "Profile", path: "/profile" },
];

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-bottom z-50">
      <div className="max-w-md mx-auto flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          if (item.isSpecial) {
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center -mt-4"
              >
                <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 transition-transform active:scale-95">
                  <Icon className="w-7 h-7 text-primary-foreground" />
                </div>
              </button>
            );
          }

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center gap-1 py-1 px-3 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive && "animate-bounce-gentle")} />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
