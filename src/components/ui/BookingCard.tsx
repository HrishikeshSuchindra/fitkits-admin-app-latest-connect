import { Phone, X, Calendar, Clock, MapPin, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface BookingCardProps {
  id: string;
  userName: string;
  userAvatar?: string;
  venueName: string;
  courtNumber?: number;
  numberOfPlayers?: number;
  date: string;
  time: string;
  status: "paid" | "confirmed" | "pending" | "cancelled";
  onCall: (id: string) => void;
  onCancel: (id: string) => void;
  className?: string;
}

export function BookingCard({
  id,
  userName,
  userAvatar,
  venueName,
  courtNumber,
  numberOfPlayers,
  date,
  time,
  status,
  onCall,
  onCancel,
  className,
}: BookingCardProps) {
  const getStatusStyle = () => {
    switch (status) {
      case 'paid':
      case 'confirmed':
        return 'bg-success/10 text-success border-success/20';
      case 'pending':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'cancelled':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'paid':
        return 'Paid';
      case 'confirmed':
        return 'Confirmed';
      case 'pending':
        return 'Pending';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  // Handle call - opens device dialer
  const handleCallClick = () => {
    // Placeholder - in a real app, phone would be passed as prop
    onCall(id);
  };

  return (
    <div className={cn("card-elevated p-4 animate-fade-in", className)}>
      <div className="flex items-start gap-3">
        <Avatar className="w-10 h-10 shrink-0">
          <AvatarImage src={userAvatar} alt={userName} />
          <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">
            {userName.split(" ").map(n => n[0]).join("").slice(0, 2)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className="font-semibold text-foreground text-sm truncate">{userName}</h3>
            <span className={cn(
              "text-xs px-2 py-0.5 rounded-full border font-medium shrink-0 whitespace-nowrap",
              getStatusStyle()
            )}>
              {getStatusLabel()}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{venueName}</span>
            {courtNumber && (
              <span className="text-xs shrink-0">• Court {courtNumber}</span>
            )}
          </div>

          {numberOfPlayers && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
              <Users className="w-3.5 h-3.5 shrink-0" />
              <span>Players: {numberOfPlayers}</span>
            </div>
          )}

          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1.5">
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{date}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">{time}</span>
            </div>
          </div>
        </div>
      </div>

      {status !== 'cancelled' && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
          <Button
            variant="default"
            size="sm"
            className="flex-1 gap-1.5 rounded-xl h-9"
            onClick={handleCallClick}
          >
            <Phone className="w-4 h-4" />
            Call
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5 rounded-xl h-9 border-destructive/30 text-destructive hover:bg-destructive/10"
            onClick={() => onCancel(id)}
          >
            <X className="w-4 h-4" />
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
