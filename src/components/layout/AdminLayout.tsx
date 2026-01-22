import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  MapPin, 
  Trophy, 
  FileText, 
  LogOut,
  Menu,
  X,
  User,
  Settings,
  HelpCircle,
  MessageCircle,
  Info,
  Shield,
  FileCheck,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { NotificationDropdown } from '@/components/ui/NotificationDropdown';

// Bottom nav items (main navigation)
const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/venues', label: 'Venues', icon: MapPin },
  { path: '/bookings', label: 'Bookings', icon: Calendar },
  { path: '/slot-blocks', label: 'Slot Blocks', icon: Calendar },
  { path: '/events', label: 'Events', icon: Trophy },
  { path: '/audit-log', label: 'Audit Log', icon: FileText },
];

// Sidebar menu sections
const sidebarSections = [
  {
    title: 'Account & Settings',
    items: [
      { path: '/edit-profile', label: 'Edit Profile', icon: User },
      { path: '/app-settings', label: 'App Settings', icon: Settings },
    ],
  },
  {
    title: 'Support',
    items: [
      { path: '/help', label: 'Help Centre', icon: HelpCircle },
      { path: '/contact', label: 'Contact Us', icon: MessageCircle },
      { path: '/about', label: 'About Us', icon: Info },
    ],
  },
  {
    title: 'Legal',
    items: [
      { path: '/privacy-policy', label: 'Privacy Policy', icon: Shield },
      { path: '/terms', label: 'Terms of Service', icon: FileCheck },
    ],
  },
];

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function AdminLayout({ children, title }: AdminLayoutProps) {
  const location = useLocation();
  const { signOut, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
  };

  const currentPage = navItems.find(item => item.path === location.pathname);

  return (
    <div className="mobile-container">
      {/* Mobile Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border safe-top">
        <div className="flex items-center justify-between h-14 px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            className="h-9 w-9"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold text-foreground">{title || currentPage?.label || 'Admin'}</h1>
          <NotificationDropdown />
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Drawer */}
      <aside className={cn(
        "fixed top-0 left-0 h-full w-72 bg-card border-r border-border z-50 transition-transform duration-300 overflow-y-auto",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col min-h-full">
          {/* Header with User Info */}
          <div className="sticky top-0 bg-card border-b border-border p-4 z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">FK</span>
                </div>
                <span className="font-semibold text-foreground">FitKits</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            {/* User Profile Card */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground text-sm font-medium">
                  {user?.email?.[0]?.toUpperCase() || 'A'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user?.email || 'Admin'}
                </p>
                <p className="text-xs text-muted-foreground">Administrator</p>
              </div>
            </div>
          </div>

          {/* Sidebar Sections */}
          <nav className="flex-1 p-4 space-y-6">
            {sidebarSections.map((section) => (
              <div key={section.title} className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3">
                  {section.title}
                </h3>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setSidebarOpen(false)}
                        className={cn(
                          "flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                          isActive 
                            ? "bg-primary text-primary-foreground" 
                            : "text-foreground hover:bg-muted"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className="h-4 w-4" />
                          {item.label}
                        </div>
                        <ChevronRight className="h-4 w-4 opacity-50" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="sticky bottom-0 bg-card p-4 border-t border-border">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </Button>
            <p className="text-center text-xs text-muted-foreground mt-3">
              Version 1.0.0
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 mobile-padding py-4 pb-24 safe-bottom">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40 safe-bottom">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
          {navItems.slice(0, 5).map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2 px-3 min-w-0 transition-colors",
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive && "scale-110")} />
                <span className="text-[10px] font-medium truncate max-w-[60px]">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
