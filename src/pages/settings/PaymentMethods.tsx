import { ArrowLeft, CreditCard, Plus, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function PaymentMethods() {
  const navigate = useNavigate();

  const handleAddPayment = () => {
    toast.info("Payment integration coming soon");
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
          <h1 className="text-lg font-semibold">Payment Methods</h1>
        </div>
      </div>

      <div className="mobile-padding py-6 space-y-6">
        {/* Info Card */}
        <div className="card-elevated p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-light flex items-center justify-center">
            <CreditCard className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Manage Your Payouts
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Add your bank account or UPI details to receive payouts from your venue bookings.
          </p>
        </div>

        {/* Payment Options */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground px-1">Add Payout Method</h3>
          
          <button
            onClick={handleAddPayment}
            className="card-elevated w-full p-4 flex items-center gap-4 hover:bg-muted transition-colors"
          >
            <div className="icon-container bg-success-light">
              <Building2 className="w-5 h-5 text-success" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-foreground">Bank Account</p>
              <p className="text-sm text-muted-foreground">Receive payouts to your bank</p>
            </div>
            <Plus className="w-5 h-5 text-muted-foreground" />
          </button>

          <button
            onClick={handleAddPayment}
            className="card-elevated w-full p-4 flex items-center gap-4 hover:bg-muted transition-colors"
          >
            <div className="icon-container bg-primary-light">
              <CreditCard className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-foreground">UPI</p>
              <p className="text-sm text-muted-foreground">Link your UPI ID for instant payouts</p>
            </div>
            <Plus className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Coming Soon Notice */}
        <div className="bg-muted rounded-xl p-4">
          <p className="text-sm text-muted-foreground text-center">
            🚀 Payment integration is coming soon. You'll be able to manage your payout methods and view transaction history here.
          </p>
        </div>
      </div>
    </div>
  );
}
