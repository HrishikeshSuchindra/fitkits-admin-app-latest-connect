import { Menu, Bell, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileHeaderProps {
  title: string;
  showBack?: boolean;
  showMenu?: boolean;
  showNotification?: boolean;
  onMenuClick?: () => void;
  onBackClick?: () => void;
  onNotificationClick?: () => void;
  className?: string;
  rightContent?: React.ReactNode;
}

export function MobileHeader({
  title,
  showBack = false,
  showMenu = true,
  showNotification = true,
  onMenuClick,
  onBackClick,
  onNotificationClick,
  className,
  rightContent,
}: MobileHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border safe-top",
        className
      )}
    >
      <div className="flex items-center justify-between h-14 mobile-padding">
        <div className="w-10 flex justify-start">
          {showBack ? (
            <button
              onClick={onBackClick}
              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
          ) : showMenu ? (
            <button
              onClick={onMenuClick}
              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-muted transition-colors"
            >
              <Menu className="w-5 h-5 text-foreground" />
            </button>
          ) : null}
        </div>

        <h1 className="text-base font-semibold text-foreground">{title}</h1>

        <div className="w-10 flex justify-end">
          {rightContent ? (
            rightContent
          ) : showNotification ? (
            <button
              onClick={onNotificationClick}
              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-muted transition-colors relative"
            >
              <Bell className="w-5 h-5 text-foreground" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full" />
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
