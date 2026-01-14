import { MapPin, Star, Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

interface VenueCardProps {
  id: string;
  name: string;
  category: string;
  image: string;
  pricePerHour: number;
  rating: number;
  location: string;
  isActive: boolean;
  onToggleActive: (id: string, active: boolean) => void;
  onEdit: (id: string) => void;
  className?: string;
}

export function VenueCard({
  id,
  name,
  category,
  image,
  pricePerHour,
  rating,
  location,
  isActive,
  onToggleActive,
  onEdit,
  className,
}: VenueCardProps) {
  return (
    <div
      className={cn(
        "card-elevated overflow-hidden animate-fade-in-up",
        !isActive && "opacity-75",
        className
      )}
    >
      {/* Image Header */}
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 right-3 flex items-center gap-2">
          <Switch
            checked={isActive}
            onCheckedChange={(checked) => onToggleActive(id, checked)}
            className="data-[state=checked]:bg-success"
          />
        </div>
        <div className="absolute top-3 left-3">
          <span className={cn(
            "px-2.5 py-1 rounded-full text-xs font-medium",
            isActive ? "badge-success" : "badge-muted"
          )}>
            {isActive ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-semibold text-foreground">{name}</h3>
            <p className="text-sm text-muted-foreground">{category}</p>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <Star className="w-4 h-4 text-warning fill-warning" />
            <span className="font-medium">{rating.toFixed(1)}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
          <MapPin className="w-3.5 h-3.5" />
          <span>{location}</span>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div>
            <span className="text-lg font-bold text-success">${pricePerHour}</span>
            <span className="text-sm text-muted-foreground">/hour</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(id)}
            className="gap-1.5"
          >
            <Edit2 className="w-3.5 h-3.5" />
            Edit Listing
          </Button>
        </div>
      </div>
    </div>
  );
}
