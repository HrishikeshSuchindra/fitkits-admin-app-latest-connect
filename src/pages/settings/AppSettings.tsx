import { ArrowLeft, Bell, Moon, Sun, Globe, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { toast } from 'sonner';

export default function AppSettings() {
  const [settings, setSettings] = useState({
    notifications: true,
    emailAlerts: true,
    darkMode: false,
    language: 'en',
    twoFactor: false,
  });

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    toast.success('Setting updated');
  };

  return (
    <div className="mobile-container pb-8">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border safe-top">
        <div className="flex items-center h-14 px-4 gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="font-semibold text-foreground">App Settings</h1>
        </div>
      </header>

      <div className="mobile-padding py-6 space-y-6">
        {/* Notifications */}
        <div className="card-elevated p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <h2 className="font-semibold text-foreground">Notifications</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="push-notifications" className="flex-1">
                <span className="font-medium">Push Notifications</span>
                <p className="text-xs text-muted-foreground">Receive alerts on your device</p>
              </Label>
              <Switch
                id="push-notifications"
                checked={settings.notifications}
                onCheckedChange={() => handleToggle('notifications')}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="email-alerts" className="flex-1">
                <span className="font-medium">Email Alerts</span>
                <p className="text-xs text-muted-foreground">Get booking updates via email</p>
              </Label>
              <Switch
                id="email-alerts"
                checked={settings.emailAlerts}
                onCheckedChange={() => handleToggle('emailAlerts')}
              />
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="card-elevated p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              {settings.darkMode ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-primary" />}
            </div>
            <h2 className="font-semibold text-foreground">Appearance</h2>
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="dark-mode" className="flex-1">
              <span className="font-medium">Dark Mode</span>
              <p className="text-xs text-muted-foreground">Switch to dark theme</p>
            </Label>
            <Switch
              id="dark-mode"
              checked={settings.darkMode}
              onCheckedChange={() => handleToggle('darkMode')}
            />
          </div>
        </div>

        {/* Language */}
        <div className="card-elevated p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Globe className="w-5 h-5 text-primary" />
            </div>
            <h2 className="font-semibold text-foreground">Language</h2>
          </div>
          
          <Select value={settings.language} onValueChange={(value) => setSettings(prev => ({ ...prev, language: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="es">Español</SelectItem>
              <SelectItem value="fr">Français</SelectItem>
              <SelectItem value="de">Deutsch</SelectItem>
              <SelectItem value="hi">हिंदी</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Security */}
        <div className="card-elevated p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <h2 className="font-semibold text-foreground">Security</h2>
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="two-factor" className="flex-1">
              <span className="font-medium">Two-Factor Authentication</span>
              <p className="text-xs text-muted-foreground">Add extra security to your account</p>
            </Label>
            <Switch
              id="two-factor"
              checked={settings.twoFactor}
              onCheckedChange={() => handleToggle('twoFactor')}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
