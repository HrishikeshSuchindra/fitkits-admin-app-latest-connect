import { useState } from "react";
import { ArrowLeft, Shield, Key, Smartphone, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function Security() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });

      if (error) throw error;

      toast.success("Password updated successfully");
      setPasswordForm({ newPassword: "", confirmPassword: "" });
    } catch (error: any) {
      toast.error(error.message || "Failed to update password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleTwoFactorToggle = () => {
    setTwoFactorEnabled(!twoFactorEnabled);
    toast.info("Two-factor authentication coming soon");
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
          <h1 className="text-lg font-semibold">Security</h1>
        </div>
      </div>

      <div className="mobile-padding py-6 space-y-6">
        {/* Change Password Section */}
        <div className="card-elevated p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="icon-container-sm bg-primary-light">
              <Key className="w-4 h-4 text-primary" />
            </div>
            <h2 className="font-semibold text-foreground">Change Password</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Enter new password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="Confirm new password"
              />
            </div>

            <Button
              onClick={handlePasswordChange}
              disabled={isChangingPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
              className="w-full"
            >
              {isChangingPassword ? "Updating..." : "Update Password"}
            </Button>
          </div>
        </div>

        {/* Two-Factor Authentication */}
        <div className="card-elevated p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="icon-container-sm bg-success-light">
                <Smartphone className="w-4 h-4 text-success" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Two-Factor Authentication</h2>
                <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
              </div>
            </div>
            <Switch
              checked={twoFactorEnabled}
              onCheckedChange={handleTwoFactorToggle}
            />
          </div>
        </div>

        {/* Security Tips */}
        <div className="card-elevated p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="icon-container-sm bg-warning-light">
              <Shield className="w-4 h-4 text-warning" />
            </div>
            <h2 className="font-semibold text-foreground">Security Tips</h2>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Use a strong, unique password</li>
            <li>• Enable two-factor authentication</li>
            <li>• Don't share your login credentials</li>
            <li>• Log out from shared devices</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
