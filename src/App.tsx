import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Login from "./pages/Login";
import AdminDashboard from "./pages/admin/Dashboard";
import BookingsPage from "./pages/admin/Bookings";
import VenuesPage from "./pages/admin/Venues";
import AddVenue from "./pages/AddVenue";
import EditVenue from "./pages/EditVenue";
import SlotBlocksPage from "./pages/admin/SlotBlocks";
import EventsPage from "./pages/admin/Events";
import AuditLogPage from "./pages/admin/AuditLog";
import NotFound from "./pages/NotFound";

// Settings pages
import EditProfile from "./pages/settings/EditProfile";
import AppSettings from "./pages/settings/AppSettings";
import Notifications from "./pages/settings/Notifications";
import PaymentMethods from "./pages/settings/PaymentMethods";
import Security from "./pages/settings/Security";

// Support pages
import HelpCentre from "./pages/support/HelpCentre";
import ContactUs from "./pages/support/ContactUs";
import AboutUs from "./pages/support/AboutUs";

// Legal pages
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";
import TermsOfService from "./pages/legal/TermsOfService";

const queryClient = new QueryClient();

function AppRoutes() {
  const { user, userRole, isLoading } = useAuth();

  // Redirect logged-in users with valid roles away from login page
  if (!isLoading && user && userRole) {
    return (
      <Routes>
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/bookings" element={<ProtectedRoute><BookingsPage /></ProtectedRoute>} />
        <Route path="/venues" element={<ProtectedRoute><VenuesPage /></ProtectedRoute>} />
        <Route path="/add-venue" element={<ProtectedRoute><AddVenue /></ProtectedRoute>} />
        <Route path="/edit-venue/:venueId" element={<ProtectedRoute><EditVenue /></ProtectedRoute>} />
        <Route path="/slot-blocks" element={<ProtectedRoute><SlotBlocksPage /></ProtectedRoute>} />
        <Route path="/events" element={<ProtectedRoute><EventsPage /></ProtectedRoute>} />
        <Route path="/audit-log" element={<ProtectedRoute><AuditLogPage /></ProtectedRoute>} />
        
        {/* Settings */}
        <Route path="/edit-profile" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
        <Route path="/settings/edit-profile" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
        <Route path="/app-settings" element={<ProtectedRoute><AppSettings /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="/payment-methods" element={<ProtectedRoute><PaymentMethods /></ProtectedRoute>} />
        <Route path="/security" element={<ProtectedRoute><Security /></ProtectedRoute>} />
        
        {/* Support */}
        <Route path="/help" element={<ProtectedRoute><HelpCentre /></ProtectedRoute>} />
        <Route path="/contact" element={<ProtectedRoute><ContactUs /></ProtectedRoute>} />
        <Route path="/about" element={<ProtectedRoute><AboutUs /></ProtectedRoute>} />
        
        {/* Legal */}
        <Route path="/privacy-policy" element={<ProtectedRoute><PrivacyPolicy /></ProtectedRoute>} />
        <Route path="/terms" element={<ProtectedRoute><TermsOfService /></ProtectedRoute>} />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
      <Route path="/bookings" element={<ProtectedRoute><BookingsPage /></ProtectedRoute>} />
      <Route path="/venues" element={<ProtectedRoute><VenuesPage /></ProtectedRoute>} />
      <Route path="/add-venue" element={<ProtectedRoute><AddVenue /></ProtectedRoute>} />
      <Route path="/edit-venue/:venueId" element={<ProtectedRoute><EditVenue /></ProtectedRoute>} />
      <Route path="/slot-blocks" element={<ProtectedRoute><SlotBlocksPage /></ProtectedRoute>} />
      <Route path="/events" element={<ProtectedRoute><EventsPage /></ProtectedRoute>} />
      <Route path="/audit-log" element={<ProtectedRoute><AuditLogPage /></ProtectedRoute>} />
      
      {/* Settings */}
      <Route path="/edit-profile" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
      <Route path="/settings/edit-profile" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
      <Route path="/app-settings" element={<ProtectedRoute><AppSettings /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
      <Route path="/payment-methods" element={<ProtectedRoute><PaymentMethods /></ProtectedRoute>} />
      <Route path="/security" element={<ProtectedRoute><Security /></ProtectedRoute>} />
      
      {/* Support */}
      <Route path="/help" element={<ProtectedRoute><HelpCentre /></ProtectedRoute>} />
      <Route path="/contact" element={<ProtectedRoute><ContactUs /></ProtectedRoute>} />
      <Route path="/about" element={<ProtectedRoute><AboutUs /></ProtectedRoute>} />
      
      {/* Legal */}
      <Route path="/privacy-policy" element={<ProtectedRoute><PrivacyPolicy /></ProtectedRoute>} />
      <Route path="/terms" element={<ProtectedRoute><TermsOfService /></ProtectedRoute>} />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
