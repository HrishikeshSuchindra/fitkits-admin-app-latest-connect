import { Phone, X, Calendar, Clock, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface BookingCardProps {
  id: string;
  userName: string;
  userAvatar?: string;
  venueName: string;
  date: string;
  time: string;
  status: "paid" | "pending" | "cancelled";
  onCall: (id: string) => void;
  onCancel: (id: string) => void;
  className?: string;
}

export function BookingCard({
  id,
  userName,
  userAvatar,
  venueName,
  date,
  time,
  status,
  onCall,
  onCancel,
  className,
}: BookingCardProps) {
  const statusStyles = {
    paid: "badge-success",
    pending: "badge-warning",
    cancelled: "badge-danger",
  };

  return (
    <div className={cn("card-elevated p-4 animate-fade-in", className)}>
      <div className="flex items-start gap-3">
        <Avatar className="w-12 h-12">
          <AvatarImage src={userAvatar} alt={userName} />
          <AvatarFallback className="bg-primary-light text-primary font-medium">
            {userName.split(" ").map(n => n[0]).join("")}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-foreground truncate">{userName}</h3>
            <span className={statusStyles[status]}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
          </div>

          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{venueName}</span>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{date}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{time}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
        <Button
          variant="default"
          size="sm"
          className="flex-1 gap-1.5"
          onClick={() => onCall(id)}
        >
          <Phone className="w-4 h-4" />
          Call
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10"
          onClick={() => onCancel(id)}
        >
          <X className="w-4 h-4" />
          Cancel
        </Button>
      </div>
    </div>
  );
}
