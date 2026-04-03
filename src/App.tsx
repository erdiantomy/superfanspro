import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useParams } from "react-router-dom";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { VenueProvider } from "@/hooks/useVenue";

import HomePage           from "@/pages/HomePage";
import VenuePage         from "@/pages/VenuePage";
import RegisterPage      from "@/pages/RegisterPage";
import SessionPage       from "@/pages/SessionPage";
import AdminPage          from "@/pages/AdminPage";
import SuperAdminPage     from "@/pages/SuperAdminPage";
import HostDashboard      from "@/pages/HostDashboard";
import RankPage           from "@/pages/RankPage";
import AuthScreen         from "@/pages/AuthScreen";
import Index              from "@/pages/Index";
import TopUpPage          from "@/pages/TopUpPage";
import PaymentSuccessPage from "@/pages/PaymentSuccessPage";
import PaymentFailedPage  from "@/pages/PaymentFailedPage";
import NotFound           from "@/pages/NotFound";
import PlayerDashboard    from "@/pages/PlayerDashboard";
import SlugResolver       from "@/components/profile/SlugResolver";

import "./App.css";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

/** Redirect old /session/:code → /tomspadel/session/:code */
const LegacySessionRedirect = () => {
  const { code } = useParams();
  return <Navigate to={`/tomspadel/session/${code}`} replace />;
};
const LegacyMatchRedirect = () => {
  const { code } = useParams();
  return <Navigate to={`/tomspadel/match/${code}`} replace />;
};

/** Wrap venue-scoped pages with VenueProvider */
const VenueLayout = ({ children }: { children: React.ReactNode }) => (
  <VenueProvider>{children}</VenueProvider>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            {/* Platform-level routes */}
            <Route path="/"           element={<HomePage />} />
            <Route path="/auth"       element={<AuthScreen />} />
            <Route path="/register"  element={<RegisterPage />} />
            <Route path="/fanprize"         element={<Index />} />
            <Route path="/topup"            element={<TopUpPage />} />
            <Route path="/payment/success"  element={<PaymentSuccessPage />} />
            <Route path="/payment/failed"   element={<PaymentFailedPage />} />

            {/* Backwards-compat redirects: old flat routes → /tomspadel/* */}
            <Route path="/rank"            element={<Navigate to="/tomspadel/rank" replace />} />
            <Route path="/host"            element={<Navigate to="/tomspadel/host" replace />} />
            <Route path="/admin"           element={<Navigate to="/superadmin" replace />} />
            <Route path="/superadmin"      element={<SuperAdminPage />} />
            <Route path="/session/:code"   element={<LegacySessionRedirect />} />
            <Route path="/match/:code"     element={<LegacyMatchRedirect />} />

            {/* Venue-scoped routes */}
            <Route path="/:slug"               element={<VenueLayout><VenuePage /></VenueLayout>} />
            <Route path="/:slug/rank"          element={<VenueLayout><RankPage /></VenueLayout>} />
            <Route path="/:slug/host"          element={<VenueLayout><HostDashboard /></VenueLayout>} />
            <Route path="/:slug/admin"         element={<VenueLayout><AdminPage /></VenueLayout>} />
            <Route path="/:slug/session/:code" element={<VenueLayout><SessionPage /></VenueLayout>} />
            <Route path="/:slug/match/:code"   element={<VenueLayout><SessionPage /></VenueLayout>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <Toaster richColors position="top-center" />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
