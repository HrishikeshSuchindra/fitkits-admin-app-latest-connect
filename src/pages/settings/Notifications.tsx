import { useState } from "react";
import { ArrowLeft, Bell, MessageSquare, Mail, Smartphone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  enabled: boolean;
}

export default function Notifications() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<NotificationSetting[]>([
    {
      id: "push",
      label: "Push Notifications",
      description: "Receive push notifications on your device",
      icon: Smartphone,
      enabled: true,
    },
    {
      id: "email",
      label: "Email Notifications",
      description: "Receive booking updates via email",
      icon: Mail,
      enabled: true,
    },
    {
      id: "sms",
      label: "SMS Notifications",
      description: "Receive important alerts via SMS",
      icon: MessageSquare,
      enabled: false,
    },
    {
      id: "booking_alerts",
      label: "New Booking Alerts",
      description: "Get notified when a new booking is made",
      icon: Bell,
      enabled: true,
    },
    {
      id: "cancellation_alerts",
      label: "Cancellation Alerts",
      description: "Get notified when a booking is cancelled",
      icon: Bell,
      enabled: true,
    },
  ]);

  const handleToggle = (id: string) => {
    setSettings(prev => 
      prev.map(setting => 
        setting.id === id ? { ...setting, enabled: !setting.enabled } : setting
      )
    );
    toast.success("Notification preference updated");
  };

  return (
    <div className="mobile-container">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">Notifications</h1>
        </div>
      </div>

      <div className="mobile-padding py-6 space-y-4">
        <div className="card-elevated overflow-hidden">
          {settings.map((setting, index) => {
            const Icon = setting.icon;
            return (
              <div
                key={setting.id}
                className={`flex items-center gap-4 p-4 ${
                  index !== settings.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <div className="icon-container-sm bg-muted">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">{setting.label}</p>
                  <p className="text-sm text-muted-foreground">{setting.description}</p>
                </div>
                <Switch
                  checked={setting.enabled}
                  onCheckedChange={() => handleToggle(setting.id)}
                />
              </div>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground text-center px-4">
          Notification preferences are stored locally. Some notifications may be required for service operation.
        </p>
      </div>
    </div>
  );
}
