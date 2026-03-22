import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";

// Existing SuperFansPro pages
import Index     from "@/pages/Index";
import AuthScreen from "@/pages/AuthScreen";
import NotFound  from "@/pages/NotFound";

// Tom's Arena pages
import Landing      from "@/pages/Landing";
import SessionPage  from "@/pages/SessionPage";
import AdminPage    from "@/pages/AdminPage";
import HostDashboard from "@/pages/HostDashboard";

import "./App.css";

const qc = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Routes>
          {/* ── Tom's Arena ─────────────────────────── */}
          <Route path="/"                element={<Landing />} />
          <Route path="/session/:code"   element={<SessionPage />} />
          <Route path="/admin"           element={<AdminPage />} />
          <Route path="/host"            element={<HostDashboard />} />

          {/* ── Auth ─────────────────────────────────── */}
          <Route path="/auth"            element={<AuthScreen />} />

          {/* ── Legacy SuperFansPro (keep working) ───── */}
          <Route path="/fanprize"        element={<Index />} />

          {/* ── 404 ──────────────────────────────────── */}
          <Route path="*"               element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      <Toaster richColors position="top-center" />
    </QueryClientProvider>
  );
}
