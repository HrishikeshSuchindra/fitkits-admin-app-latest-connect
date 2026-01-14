import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TopUser {
  id: string;
  name: string;
  avatar?: string;
  bookings: number;
  revenue: number;
}

interface TopUsersListProps {
  users: TopUser[];
  className?: string;
}

export function TopUsersList({ users, className }: TopUsersListProps) {
  return (
    <div className={cn("card-elevated p-4", className)}>
      <h3 className="font-semibold text-foreground mb-4">Top Users</h3>
      
      <div className="space-y-3">
        {users.map((user, index) => (
          <div
            key={user.id}
            className={cn(
              "flex items-center gap-3 py-2 animate-fade-in",
              index !== users.length - 1 && "border-b border-border pb-3"
            )}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <Avatar className="w-10 h-10">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="bg-primary-light text-primary text-sm font-medium">
                {user.name.split(" ").map(n => n[0]).join("")}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.bookings} bookings</p>
            </div>

            <div className="text-right">
              <p className="font-bold text-foreground">${user.revenue.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
