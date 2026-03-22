import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";

// Tom's Arena pages
import Landing       from "@/pages/Landing";
import SessionPage   from "@/pages/SessionPage";
import AdminPage     from "@/pages/AdminPage";
import HostDashboard from "@/pages/HostDashboard";

// Auth + legacy
import AuthScreen from "@/pages/AuthScreen";
import Index      from "@/pages/Index";
import NotFound   from "@/pages/NotFound";

import "./App.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            {/* Tom's Arena */}
            <Route path="/"              element={<Landing />} />
            <Route path="/session/:code" element={<SessionPage />} />
            <Route path="/admin"         element={<AdminPage />} />
            <Route path="/host"          element={<HostDashboard />} />

            {/* Auth — Google OAuth redirects back here */}
            <Route path="/auth"          element={<AuthScreen />} />

            {/* Legacy SuperFansPro */}
            <Route path="/fanprize"      element={<Index />} />

            {/* 404 */}
            <Route path="*"             element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <Toaster richColors position="top-center" />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
