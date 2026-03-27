import { useState, useMemo } from "react";
import { startOfMonth, endOfMonth, subMonths, isWithinInterval, format, parseISO } from "date-fns";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useAdmin";
import { C, Tag } from "@/components/arena";
import { toast } from "sonner";
import { lovable } from "@/integrations/lovable";

/* ── Types ──────────────────────────────────────────── */
interface Venue {
  id: string; slug: string; name: string; city: string | null;
  status: string; created_at: string; primary_color: string | null;
  courts_default: number | null; monthly_prize: number | null;
  contact_name: string | null; contact_email: string | null;
}

interface Registration {
  id: string; contact_name: string; contact_email: string; contact_phone: string;
  city: string; country: string; venue_name: string; slug: string;
  courts: number; primary_color: string; monthly_prize: number;
  prize_split_1st: number; prize_split_2nd: number; prize_split_3rd: number;
  admin_password_hash: string | null; logo_url: string | null;
  status: string; created_at: string;
}

interface MatchRow {
  id: string; title: string; status: string;
  player_a_name: string; player_b_name: string;
  score_a: number; score_b: number; fans: number; pool: number;
  created_at: string; starts_at: string | null; winner: string | null;
}

/* ── Auth Gate Component ────────────────────────────── */
function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: roleLoading } = useIsAdmin();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [signing, setSigning] = useState(false);

  if (authLoading || roleLoading) {
    return (
      <div style={{ height: "100dvh", background: "#0A0A0E", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: C.muted, fontSize: 14 }}>Loading...</div>
      </div>
    );
  }

  if (!user) {
    const handleLogin = async () => {
      setSigning(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) { toast.error(error.message); setSigning(false); }
    };
    return (
      <div style={{ height: "100dvh", background: "#0A0A0E", color: C.fg, maxWidth: 480, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ width: "100%", maxWidth: 360, textAlign: "center" }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>🔐</div>
          <div className="font-display" style={{ fontSize: 26, fontWeight: 900, color: C.orange, letterSpacing: 1 }}>SUPER ADMIN</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 4, marginBottom: 24 }}>Platform-level access · Sign in required</div>
          <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="Email" style={inputStyle} />
          <input value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} type="password" placeholder="Password" style={{ ...inputStyle, marginTop: 8 }} />
          <button onClick={handleLogin} disabled={signing} style={{ width: "100%", background: C.orange, border: "none", color: "#0A0C11", padding: "13px 0", borderRadius: 12, fontFamily: "'Barlow Condensed'", fontSize: 16, fontWeight: 800, cursor: "pointer", marginTop: 10, opacity: signing ? 0.6 : 1 }}>
            {signing ? "Signing in..." : "SIGN IN →"}
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "14px 0" }}>
            <div style={{ flex: 1, height: 1, background: "#1E2235" }} />
            <span style={{ fontSize: 11, color: C.muted, fontWeight: 600, letterSpacing: 1 }}>OR</span>
            <div style={{ flex: 1, height: 1, background: "#1E2235" }} />
          </div>
          <button
            onClick={async () => {
              setSigning(true);
              const { error } = await lovable.auth.signInWithOAuth("google", {
                redirect_uri: window.location.origin + "/superadmin",
              });
              if (error) { toast.error("Google sign-in failed"); setSigning(false); }
            }}
            disabled={signing}
            style={{ width: "100%", background: "#fff", border: "none", color: "#3c3c3c", padding: "13px 0", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", opacity: signing ? 0.6 : 1 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Sign in with Google
          </button>
          <button onClick={() => navigate("/")} style={{ width: "100%", background: "none", border: "none", color: C.muted, padding: "8px 0", fontFamily: "'Barlow Condensed'", fontSize: 13, fontWeight: 700, cursor: "pointer", marginTop: 4 }}>← Back</button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div style={{ height: "100dvh", background: "#0A0A0E", color: C.fg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>⛔</div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Access Denied</div>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>Your account doesn't have super admin privileges.</div>
          <button onClick={() => navigate("/")} style={{ background: C.orange, border: "none", color: "#0A0C11", padding: "10px 24px", borderRadius: 10, fontFamily: "'Barlow Condensed'", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>← Go Home</button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/* ── Time ago helper ────────────────────────────────── */
function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? "1d ago" : `${days}d ago`;
}

/* ── Shared styles ──────────────────────────────────── */
const inputStyle: React.CSSProperties = {
  width: "100%", background: "#14161E", border: "1px solid #1E2235",
  borderRadius: 12, padding: "12px 16px", color: "#E8ECF4", fontSize: 14,
  outline: "none", boxSizing: "border-box",
};

/* ── Stat Card ──────────────────────────────────────── */
function StatCard({ icon, label, value, color = C.green }: { icon: string; label: string; value: string | number; color?: string }) {
  return (
    <div style={{ background: "#14161E", border: "1px solid #1E2235", borderRadius: 14, padding: "14px 16px", flex: 1, minWidth: 120 }}>
      <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
      <div className="font-display" style={{ fontSize: 24, fontWeight: 900, color, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 10, color: C.muted, fontWeight: 600, letterSpacing: 0.5, marginTop: 2 }}>{label}</div>
    </div>
  );
}

/* ── Registration Card ──────────────────────────────── */
function RegistrationCard({ r, onApprove, onReject }: { r: Registration; onApprove: () => void; onReject: () => void }) {
  const isPending = r.status === "pending";
  const isApproved = r.status === "approved";
  const isRejected = r.status === "rejected";
  const fmtDate = (d: string) => new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div style={{ background: "#14161E", border: `1px solid ${isPending ? C.orange + "40" : isApproved ? C.green + "30" : C.red + "25"}`, borderRadius: 14, padding: 14, marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 2 }}>{r.venue_name}</div>
          <div style={{ fontSize: 12, color: C.muted }}>{r.city}, {r.country}</div>
        </div>
        <Tag label={r.status.toUpperCase()} color={isPending ? C.orange : isApproved ? C.green : C.red} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <span style={{ width: 14, height: 14, borderRadius: 3, background: r.primary_color, display: "inline-block" }} />
        <span style={{ fontSize: 12, color: C.muted }}>superfans.games/<strong style={{ color: C.fg }}>{r.slug}</strong></span>
      </div>
      <div style={{ background: "#0A0C11", borderRadius: 10, padding: "8px 12px", marginBottom: 8, fontSize: 11, color: C.muted, lineHeight: 1.8 }}>
        👤 {r.contact_name}<br />📧 {r.contact_email}<br />📱 {r.contact_phone}<br />
        🎾 {r.courts} courts · Prize: Rp {(r.monthly_prize || 0).toLocaleString("id-ID")}<br />📅 {fmtDate(r.created_at)}
      </div>
      {isApproved && <div style={{ color: C.green, fontSize: 12, fontWeight: 700 }}>✅ Approved & Activated</div>}
      {isRejected && <div style={{ color: C.red, fontSize: 12, fontWeight: 700 }}>❌ Rejected</div>}
      {isPending && (
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onApprove} style={{ flex: 2, background: `${C.green}15`, border: `1px solid ${C.green}40`, color: C.green, padding: "10px 0", borderRadius: 10, fontFamily: "'Barlow Condensed'", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>✓ Approve & Activate</button>
          <button onClick={onReject} style={{ flex: 1, background: `${C.red}12`, border: `1px solid ${C.red}35`, color: C.red, padding: "10px 0", borderRadius: 10, fontFamily: "'Barlow Condensed'", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>✕ Reject</button>
        </div>
      )}
    </div>
  );
}

/* ── Main Dashboard ─────────────────────────────────── */
type TabKey = "overview" | "registrations" | "venues" | "matches" | "users" | "revenue" | "notifications";

function Dashboard() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<TabKey>("overview");

  // ─── Data queries ────────────────────────────────
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["sa-unread-notifs"],
    refetchInterval: 15000,
    queryFn: async () => {
      const { count, error } = await (supabase as any).from("admin_notifications").select("*", { count: "exact", head: true }).eq("read", false);
      if (error) return 0;
      return count ?? 0;
    },
  });

  const { data: recentNotifs = [], refetch: refetchNotifs } = useQuery({
    queryKey: ["sa-recent-notifs"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("admin_notifications").select("*").order("created_at", { ascending: false }).limit(20);
      if (error) return [];
      return data ?? [];
    },
  });

  const [showNotifs, setShowNotifs] = useState(false);

  const markAllRead = async () => {
    const unreadIds = recentNotifs.filter((n: any) => !n.read).map((n: any) => n.id);
    if (unreadIds.length === 0) return;
    await (supabase as any).from("admin_notifications").update({ read: true }).in("id", unreadIds);
    qc.invalidateQueries({ queryKey: ["sa-unread-notifs"] });
    refetchNotifs();
  };

  const { data: venues = [] } = useQuery({
    queryKey: ["sa-venues"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("venues").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Venue[];
    },
  });

  const { data: registrations = [] } = useQuery({
    queryKey: ["sa-registrations"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("venue_registrations").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Registration[];
    },
  });

  const { data: matches = [] } = useQuery({
    queryKey: ["sa-matches"],
    queryFn: async () => {
      const { data, error } = await supabase.from("matches").select("*").order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      return (data ?? []) as MatchRow[];
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["sa-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  const pendingRegs = registrations.filter(r => r.status === "pending");
  const activeVenues = venues.filter(v => v.status === "active");
  const liveMatches = matches.filter(m => m.status === "live");

  // ─── Actions ─────────────────────────────────────
  const approveRegistration = async (reg: Registration) => {
    try {
      const { error: venueErr } = await (supabase as any).from("venues").insert({
        slug: reg.slug, name: reg.venue_name, city: reg.city, country: reg.country,
        courts_default: reg.courts, primary_color: reg.primary_color,
        monthly_prize: reg.monthly_prize, prize_split_1st: reg.prize_split_1st,
        prize_split_2nd: reg.prize_split_2nd, prize_split_3rd: reg.prize_split_3rd,
        admin_password_hash: reg.admin_password_hash, logo_url: reg.logo_url,
        contact_name: reg.contact_name, contact_email: reg.contact_email,
        contact_phone: reg.contact_phone, status: "active",
      });
      if (venueErr) throw venueErr;
      const { error: regErr } = await (supabase as any).from("venue_registrations").update({ status: "approved" }).eq("id", reg.id);
      if (regErr) throw regErr;
      toast.success(`${reg.venue_name} approved!`);
      qc.invalidateQueries({ queryKey: ["sa-venues"] });
      qc.invalidateQueries({ queryKey: ["sa-registrations"] });
    } catch (err: any) { toast.error(err.message || "Failed to approve"); }
  };

  const rejectRegistration = async (regId: string) => {
    try {
      const { error } = await (supabase as any).from("venue_registrations").update({ status: "rejected" }).eq("id", regId);
      if (error) throw error;
      toast.error("Registration rejected");
      qc.invalidateQueries({ queryKey: ["sa-registrations"] });
    } catch (err: any) { toast.error(err.message || "Failed to reject"); }
  };

  const fmtDate = (d: string) => new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

  const tabs: { v: TabKey; l: string; n?: number }[] = [
    { v: "overview", l: "📊 Overview" },
    { v: "registrations", l: "📝 Reg", n: pendingRegs.length },
    { v: "venues", l: "🏟️ Venues" },
    { v: "matches", l: "⚽ Matches" },
    { v: "users", l: "👥 Users" },
    { v: "revenue", l: "💰 Revenue" },
    { v: "notifications", l: "🔔 Notifs", n: unreadCount },
  ];

  return (
    <div style={{ height: "100dvh", background: "#0A0A0E", color: C.fg, maxWidth: 640, margin: "0 auto", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "12px 16px", borderBottom: "1px solid #1E2235", flexShrink: 0, background: "#0E0D0A" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div className="font-display" style={{ fontSize: 20, fontWeight: 900, color: C.orange, letterSpacing: 1 }}>SUPERFANS HQ</div>
            <div style={{ fontSize: 9, color: C.dim, letterSpacing: 1 }}>PLATFORM SUPER ADMIN</div>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button onClick={() => setShowNotifs(v => !v)} style={{ ...headerBtnStyle, position: "relative", fontSize: 16, padding: "6px 10px" }}>
              🔔
              {unreadCount > 0 && (
                <span style={{ position: "absolute", top: -4, right: -4, background: C.red, color: "#fff", fontSize: 9, fontWeight: 900, borderRadius: 10, padding: "1px 5px", minWidth: 16, textAlign: "center", lineHeight: "14px" }}>{unreadCount > 99 ? "99+" : unreadCount}</span>
              )}
            </button>
            <button onClick={() => navigate("/")} style={headerBtnStyle}>← Home</button>
            <button onClick={signOut} style={{ ...headerBtnStyle, color: C.red, borderColor: C.red + "30" }}>Sign Out</button>
          </div>
        </div>
        <div style={{ fontSize: 10, color: C.dim, marginTop: 4 }}>Logged in as {user?.email}</div>
      </div>

      {/* Notifications dropdown */}
      {showNotifs && (
        <div style={{ position: "relative", zIndex: 50 }}>
          <div onClick={() => setShowNotifs(false)} style={{ position: "fixed", inset: 0 }} />
          <div style={{ position: "absolute", right: 16, top: 0, width: 340, maxHeight: 400, overflowY: "auto", background: "#14161E", border: "1px solid #1E2235", borderRadius: 14, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", zIndex: 51 }}>
            <div style={{ padding: "12px 14px", borderBottom: "1px solid #1E2235", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.fg }}>🔔 Notifications</span>
              {unreadCount > 0 && (
                <button onClick={markAllRead} style={{ background: "none", border: "none", color: C.green, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Mark all read</button>
              )}
            </div>
            {recentNotifs.length === 0 ? (
              <div style={{ padding: 24, textAlign: "center", fontSize: 12, color: C.muted }}>No notifications yet</div>
            ) : (
              recentNotifs.map((n: any) => {
                const typeEmoji: Record<string, string> = { venue_registration: "🏟️", session_request: "🎾", payment_completed: "💰", score_submitted: "📊", general: "📢" };
                const ago = getTimeAgo(n.created_at);
                return (
                  <div key={n.id} style={{ padding: "10px 14px", borderBottom: "1px solid #1E2235", background: n.read ? "transparent" : "#1a1c2a", cursor: "default" }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{typeEmoji[n.type] || "📢"}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: n.read ? C.muted : C.fg, lineHeight: 1.3 }}>{n.subject}</div>
                        <div style={{ fontSize: 11, color: C.dim, marginTop: 2, lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.body}</div>
                        <div style={{ fontSize: 10, color: C.dim, marginTop: 3 }}>{ago}</div>
                      </div>
                      {!n.read && <span style={{ width: 8, height: 8, borderRadius: 4, background: C.orange, flexShrink: 0, marginTop: 4 }} />}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      <div style={{ display: "flex", borderBottom: "1px solid #1E2235", flexShrink: 0, overflowX: "auto" }}>
        {tabs.map(t => (
          <button key={t.v} onClick={() => setTab(t.v)} style={{
            flex: 1, minWidth: 60, padding: "10px 4px", background: tab === t.v ? "#0E0D0A" : "#0A0A0E",
            border: "none", borderBottom: tab === t.v ? `2px solid ${C.orange}` : "2px solid transparent",
            color: tab === t.v ? C.orange : C.muted, fontFamily: "'Barlow Condensed'",
            fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
          }}>
            {t.l}
            {t.n != null && t.n > 0 && <span style={{ background: C.red, color: "#fff", fontSize: 9, fontWeight: 900, borderRadius: 10, padding: "1px 4px", marginLeft: 3 }}>{t.n}</span>}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px 90px" }}>

        {/* ── OVERVIEW ───────────────────────────── */}
        {tab === "overview" && (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
              <StatCard icon="🏟️" label="Active Venues" value={activeVenues.length} />
              <StatCard icon="📝" label="Pending Approvals" value={pendingRegs.length} color={pendingRegs.length > 0 ? C.orange : C.green} />
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              <StatCard icon="⚡" label="Live Matches" value={liveMatches.length} color={C.blue} />
              <StatCard icon="👥" label="Total Users" value={profiles.length} color={C.purple} />
              <StatCard icon="🎾" label="Total Matches" value={matches.length} color={C.gold} />
            </div>

            {/* Pending registrations preview */}
            {pendingRegs.length > 0 && (
              <>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.orange, marginBottom: 8 }}>⚠️ Pending Approvals</div>
                {pendingRegs.slice(0, 3).map(r => (
                  <RegistrationCard key={r.id} r={r} onApprove={() => approveRegistration(r)} onReject={() => rejectRegistration(r.id)} />
                ))}
                {pendingRegs.length > 3 && (
                  <button onClick={() => setTab("registrations")} style={{ width: "100%", background: "none", border: `1px dashed ${C.orange}40`, color: C.orange, padding: "8px 0", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>View all {pendingRegs.length} pending →</button>
                )}
              </>
            )}

            {/* Recent activity */}
            <div style={{ fontSize: 13, fontWeight: 700, color: C.fg, marginTop: 16, marginBottom: 8 }}>📋 Recent Activity</div>
            {matches.slice(0, 5).map(m => (
              <div key={m.id} style={{ background: "#14161E", border: "1px solid #1E2235", borderRadius: 12, padding: "10px 14px", marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{m.player_a_name} vs {m.player_b_name}</div>
                  <div style={{ fontSize: 10, color: C.muted }}>{m.title} · {fmtDate(m.created_at)}</div>
                </div>
                <Tag label={m.status.toUpperCase()} color={m.status === "live" ? C.green : m.status === "upcoming" ? C.orange : C.muted} dot={m.status === "live"} />
              </div>
            ))}
          </>
        )}

        {/* ── REGISTRATIONS ──────────────────────── */}
        {tab === "registrations" && (
          <>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 12 }}>All venue registration requests.</div>
            {registrations.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 0" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
                <div style={{ fontSize: 14, color: C.muted }}>No registrations yet</div>
              </div>
            ) : registrations.map(r => (
              <RegistrationCard key={r.id} r={r} onApprove={() => approveRegistration(r)} onReject={() => rejectRegistration(r.id)} />
            ))}
          </>
        )}

        {/* ── VENUES ─────────────────────────────── */}
        {tab === "venues" && (
          <>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 12 }}>{venues.length} venues registered on the platform.</div>
            {venues.map(v => (
              <div key={v.id} onClick={() => navigate(`/${v.slug}`)} style={{ background: "#14161E", border: "1px solid #1E2235", borderRadius: 14, padding: "12px 14px", marginBottom: 8, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 12, height: 12, borderRadius: 3, background: v.primary_color || "#00E676", flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{v.name}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>/{v.slug} · {v.city || "—"} · {v.courts_default || "?"} courts</div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <Tag label={v.status.toUpperCase()} color={v.status === "active" ? C.green : v.status === "suspended" ? C.red : C.orange} />
                  <div style={{ fontSize: 10, color: C.dim, marginTop: 4 }}>{fmtDate(v.created_at)}</div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* ── MATCHES ────────────────────────────── */}
        {tab === "matches" && (
          <>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 12 }}>Recent matches across all venues. Host/match management is done by venue admins.</div>
            {matches.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 0", color: C.muted }}>No matches yet</div>
            ) : matches.map(m => (
              <div key={m.id} style={{ background: "#14161E", border: `1px solid ${m.status === "live" ? C.green + "30" : "#1E2235"}`, borderRadius: 14, padding: "12px 14px", marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.muted }}>{m.title}</div>
                  <Tag label={m.status.toUpperCase()} color={m.status === "live" ? C.green : m.status === "upcoming" ? C.orange : C.muted} dot={m.status === "live"} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>{m.player_a_name}</span>
                    <span style={{ fontSize: 12, color: C.muted, margin: "0 6px" }}>vs</span>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>{m.player_b_name}</span>
                  </div>
                  {m.status !== "upcoming" && (
                    <div className="font-display" style={{ fontSize: 20, fontWeight: 900, letterSpacing: 2 }}>
                      <span style={{ color: m.winner === "a" ? C.green : C.fg }}>{m.score_a}</span>
                      <span style={{ color: C.dim, margin: "0 4px" }}>-</span>
                      <span style={{ color: m.winner === "b" ? C.green : C.fg }}>{m.score_b}</span>
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 10, color: C.dim, marginTop: 4 }}>
                  👥 {m.fans} fans · 💰 {m.pool.toLocaleString()} pool · {fmtDate(m.created_at)}
                </div>
              </div>
            ))}
          </>
        )}

        {/* ── USERS ──────────────────────────────── */}
        {tab === "users" && (
          <>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 12 }}>{profiles.length} registered users on the platform.</div>
            {profiles.map((p: any) => (
              <div key={p.id} style={{ background: "#14161E", border: "1px solid #1E2235", borderRadius: 12, padding: "10px 14px", marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: `${C.green}20`, border: `1px solid ${C.green}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: C.green }}>
                    {(p.display_name || p.username || "?").slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{p.display_name || p.username || "Anonymous"}</div>
                    <div style={{ fontSize: 10, color: C.muted }}>@{p.username || "—"} · {p.points} pts</div>
                  </div>
                </div>
                <div style={{ fontSize: 10, color: C.dim }}>{fmtDate(p.created_at)}</div>
              </div>
            ))}
          </>
        )}

        {/* ── REVENUE ────────────────────────────── */}
        {tab === "revenue" && <RevenueTab matches={matches} />}

        {/* ── NOTIFICATIONS ───────────────────────── */}
        {tab === "notifications" && <NotificationsTab notifs={recentNotifs} unreadCount={unreadCount} markAllRead={markAllRead} />}
      </div>
    </div>
  );
}

/* ── Revenue Tab Component ────────────────────────── */
type DatePreset = "all" | "this_month" | "last_month" | "custom";

function RevenueTab({ matches }: { matches: MatchRow[] }) {
  const [preset, setPreset] = useState<DatePreset>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const now = new Date();
  const filteredMatches = useMemo(() => {
    if (preset === "all") return matches;
    let start: Date, end: Date;
    if (preset === "this_month") {
      start = startOfMonth(now);
      end = endOfMonth(now);
    } else if (preset === "last_month") {
      const prev = subMonths(now, 1);
      start = startOfMonth(prev);
      end = endOfMonth(prev);
    } else {
      if (!customFrom || !customTo) return matches;
      start = parseISO(customFrom);
      end = parseISO(customTo);
      end.setHours(23, 59, 59, 999);
    }
    return matches.filter(m => {
      const d = new Date(m.created_at);
      return isWithinInterval(d, { start, end });
    });
  }, [matches, preset, customFrom, customTo]);

  const totalPool = filteredMatches.reduce((sum, m) => sum + (m.pool || 0), 0);
  const platformFees = Math.round(totalPool * 0.1);

  const venuePoolMap: Record<string, { pool: number; matches: number; fans: number }> = {};
  for (const m of filteredMatches) {
    const key = m.title || "Unknown";
    if (!venuePoolMap[key]) venuePoolMap[key] = { pool: 0, matches: 0, fans: 0 };
    venuePoolMap[key].pool += m.pool || 0;
    venuePoolMap[key].matches += 1;
    venuePoolMap[key].fans += m.fans || 0;
  }
  const venueRevenue = Object.entries(venuePoolMap)
    .map(([name, d]) => ({ name, ...d, avgPool: d.matches > 0 ? Math.round(d.pool / d.matches) : 0 }))
    .sort((a, b) => b.pool - a.pool);

  const presetBtns: { v: DatePreset; l: string }[] = [
    { v: "all", l: "All Time" },
    { v: "this_month", l: "This Month" },
    { v: "last_month", l: "Last Month" },
    { v: "custom", l: "Custom" },
  ];

  const rangeLabel = preset === "all" ? "All Time"
    : preset === "this_month" ? format(startOfMonth(now), "MMM yyyy")
    : preset === "last_month" ? format(startOfMonth(subMonths(now, 1)), "MMM yyyy")
    : customFrom && customTo ? `${format(parseISO(customFrom), "dd MMM")} – ${format(parseISO(customTo), "dd MMM yyyy")}` : "Select dates";

  return (
    <>
      {/* Date filter */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
          {presetBtns.map(p => (
            <button key={p.v} onClick={() => setPreset(p.v)} style={{
              padding: "6px 12px", borderRadius: 8, border: `1px solid ${preset === p.v ? C.orange : "#1E2235"}`,
              background: preset === p.v ? C.orange + "18" : "#14161E",
              color: preset === p.v ? C.orange : C.muted, fontSize: 11, fontWeight: 700,
              fontFamily: "'Barlow Condensed'", cursor: "pointer",
            }}>
              {p.l}
            </button>
          ))}
        </div>
        {preset === "custom" && (
          <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
            <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
              style={{ ...dateInputStyle }} />
            <span style={{ color: C.muted, fontSize: 12, alignSelf: "center" }}>→</span>
            <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
              style={{ ...dateInputStyle }} />
          </div>
        )}
        <div style={{ fontSize: 10, color: C.dim, marginTop: 2 }}>📅 Showing: {rangeLabel} · {filteredMatches.length} matches</div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <StatCard icon="💰" label="Total Pools" value={`Rp ${totalPool.toLocaleString("id-ID")}`} color={C.green} />
        <StatCard icon="🏦" label="Platform Fees (10%)" value={`Rp ${platformFees.toLocaleString("id-ID")}`} color={C.gold} />
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <StatCard icon="🎾" label="Total Matches" value={filteredMatches.length} color={C.blue} />
        <StatCard icon="👥" label="Total Fans" value={filteredMatches.reduce((s, m) => s + (m.fans || 0), 0)} color={C.purple} />
      </div>

      {/* Pool Trend Chart */}
      {filteredMatches.length > 0 && (() => {
        const sorted = [...filteredMatches].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        const grouped: Record<string, { pool: number; fees: number; matches: number }> = {};
        for (const m of sorted) {
          const key = format(new Date(m.created_at), "dd MMM");
          if (!grouped[key]) grouped[key] = { pool: 0, fees: 0, matches: 0 };
          grouped[key].pool += m.pool || 0;
          grouped[key].fees += Math.round((m.pool || 0) * 0.1);
          grouped[key].matches += 1;
        }
        const chartData = Object.entries(grouped).map(([date, d]) => ({ date, ...d }));

        return (
          <div style={{ background: "#14161E", border: "1px solid #1E2235", borderRadius: 14, padding: "14px 8px 8px 0", marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.fg, marginBottom: 10, paddingLeft: 16 }}>📈 Pool Trend</div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="poolGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.green} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={C.green} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="feeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.gold} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={C.gold} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2235" />
                <XAxis dataKey="date" tick={{ fill: "#5A6178", fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#5A6178", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)} />
                <Tooltip
                  contentStyle={{ background: "#0E0D0A", border: "1px solid #1E2235", borderRadius: 10, fontSize: 11 }}
                  labelStyle={{ color: C.fg, fontWeight: 700, marginBottom: 4 }}
                  formatter={(value: number, name: string) => [`Rp ${value.toLocaleString("id-ID")}`, name === "pool" ? "Pool" : "Fees"]}
                />
                <Area type="monotone" dataKey="pool" stroke={C.green} fill="url(#poolGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="fees" stroke={C.gold} fill="url(#feeGrad)" strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        );
      })()}

      <div style={{ fontSize: 13, fontWeight: 700, color: C.fg, marginBottom: 8 }}>📊 Revenue by Venue / Event</div>
      {venueRevenue.length === 0 ? (
        <div style={{ textAlign: "center", padding: "32px 0", color: C.muted }}>No match data in this period</div>
      ) : venueRevenue.map((v, i) => (
        <div key={i} style={{ background: "#14161E", border: "1px solid #1E2235", borderRadius: 14, padding: "12px 14px", marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{v.name}</div>
            <div className="font-display" style={{ fontSize: 16, fontWeight: 900, color: C.green }}>Rp {v.pool.toLocaleString("id-ID")}</div>
          </div>
          <div style={{ display: "flex", gap: 16, fontSize: 11, color: C.muted }}>
            <span>🎾 {v.matches} matches</span>
            <span>👥 {v.fans} fans</span>
            <span>📊 Avg: Rp {v.avgPool.toLocaleString("id-ID")}</span>
          </div>
          <div style={{ fontSize: 10, color: C.dim, marginTop: 4 }}>
            Platform fee: <span style={{ color: C.gold }}>Rp {Math.round(v.pool * 0.1).toLocaleString("id-ID")}</span>
          </div>
        </div>
      ))}
    </>
  );
}

const dateInputStyle: React.CSSProperties = {
  flex: 1, background: "#14161E", border: "1px solid #1E2235",
  borderRadius: 8, padding: "8px 10px", color: "#E8ECF4", fontSize: 12,
  outline: "none", colorScheme: "dark",
};
const headerBtnStyle: React.CSSProperties = {
  background: "#14161E", border: "1px solid #1E2235", color: C.muted,
  padding: "5px 10px", borderRadius: 8, fontFamily: "'Barlow Condensed'",
  fontSize: 11, fontWeight: 700, cursor: "pointer",
};

/* ── Notifications Tab Component ─────────────────── */
const NOTIF_TYPES = [
  { value: "all", label: "All", emoji: "📋" },
  { value: "venue_registration", label: "Venues", emoji: "🏟️" },
  { value: "session_request", label: "Sessions", emoji: "🎾" },
  { value: "payment_completed", label: "Payments", emoji: "💰" },
  { value: "score_submitted", label: "Scores", emoji: "📊" },
  { value: "general", label: "General", emoji: "📢" },
] as const;

const typeEmoji: Record<string, string> = { venue_registration: "🏟️", session_request: "🎾", payment_completed: "💰", score_submitted: "📊", general: "📢" };
const typeLabel: Record<string, string> = { venue_registration: "Venue Registration", session_request: "Session Request", payment_completed: "Payment", score_submitted: "Score Submitted", general: "General" };
const typeColor: Record<string, string> = { venue_registration: "#FF9800", session_request: "#00E676", payment_completed: "#FFD700", score_submitted: "#4A9EFF", general: "#6D7A94" };

function NotificationsTab({ notifs, unreadCount, markAllRead }: { notifs: any[]; unreadCount: number; markAllRead: () => void }) {
  const [filter, setFilter] = useState<string>("all");
  const [readFilter, setReadFilter] = useState<"all" | "unread" | "read">("all");

  const filtered = notifs.filter(n => {
    if (filter !== "all" && n.type !== filter) return false;
    if (readFilter === "unread" && n.read) return false;
    if (readFilter === "read" && !n.read) return false;
    return true;
  });

  const typeCounts = notifs.reduce((acc: Record<string, number>, n: any) => {
    acc[n.type] = (acc[n.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div>
          <div className="font-display" style={{ fontSize: 16, fontWeight: 800 }}>Admin Notifications</div>
          <div style={{ fontSize: 11, color: "#6D7A94" }}>{unreadCount} unread · {notifs.length} total</div>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} style={{ background: "#00E67615", border: "1px solid #00E67640", color: "#00E676", padding: "6px 14px", borderRadius: 8, fontFamily: "'Barlow Condensed'", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            ✓ Mark all read
          </button>
        )}
      </div>

      {/* Type filter chips */}
      <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
        {NOTIF_TYPES.map(t => {
          const count = t.value === "all" ? notifs.length : (typeCounts[t.value] || 0);
          const active = filter === t.value;
          return (
            <button key={t.value} onClick={() => setFilter(t.value)} style={{
              background: active ? "#1E2235" : "#0A0A0E",
              border: `1px solid ${active ? (t.value === "all" ? "#FF9800" : typeColor[t.value] || "#1E2235") : "#1E2235"}`,
              color: active ? "#E8ECF4" : "#6D7A94",
              padding: "5px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700,
              fontFamily: "'Barlow Condensed'", cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
            }}>
              {t.emoji} {t.label}
              {count > 0 && <span style={{ background: active ? "#ffffff20" : "#1E2235", padding: "0 4px", borderRadius: 6, fontSize: 9, fontWeight: 900 }}>{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Read/Unread filter */}
      <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
        {(["all", "unread", "read"] as const).map(v => (
          <button key={v} onClick={() => setReadFilter(v)} style={{
            background: readFilter === v ? "#1E2235" : "transparent",
            border: "none", color: readFilter === v ? "#E8ECF4" : "#3A4560",
            padding: "4px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700,
            fontFamily: "'Barlow Condensed'", cursor: "pointer", textTransform: "uppercase", letterSpacing: 0.5,
          }}>
            {v === "all" ? "All" : v === "unread" ? `Unread (${unreadCount})` : "Read"}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔕</div>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
            {filter === "all" && readFilter === "all" ? "No notifications yet" : "No matching notifications"}
          </div>
          <div style={{ fontSize: 12, color: "#6D7A94" }}>
            {filter === "all" && readFilter === "all"
              ? "Notifications from venue registrations, sessions, scores, and payments will appear here."
              : "Try changing the filter to see more notifications."}
          </div>
        </div>
      ) : (
        filtered.map((n: any) => (
          <div key={n.id} style={{ background: n.read ? "#14161E" : "#1a1c2a", border: `1px solid ${n.read ? "#1E2235" : (typeColor[n.type] || "#FF9800") + "30"}`, borderRadius: 12, padding: 14, marginBottom: 8 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>{typeEmoji[n.type] || "📢"}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <Tag label={typeLabel[n.type] || n.type} color={typeColor[n.type] || "#6D7A94"} />
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 10, color: "#3A4560" }}>{getTimeAgo(n.created_at)}</span>
                    {!n.read && <span style={{ width: 8, height: 8, borderRadius: 4, background: "#FF9800" }} />}
                  </div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: n.read ? "#6D7A94" : "#E8ECF4", marginBottom: 4 }}>{n.subject}</div>
                <div style={{ fontSize: 12, color: "#3A4560", lineHeight: 1.4 }}>{n.body}</div>
                {n.metadata && Object.keys(n.metadata).length > 0 && (
                  <div style={{ background: "#0A0C11", borderRadius: 8, padding: "8px 10px", marginTop: 8, fontSize: 11, color: "#6D7A94", lineHeight: 1.8 }}>
                    {Object.entries(n.metadata).map(([k, v]) => (
                      <div key={k}><strong style={{ color: "#3A4560" }}>{k}:</strong> {String(v)}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </>
  );
}

/* ── Export ──────────────────────────────────────────── */
export default function SuperAdminPage() {
  return (
    <AuthGate>
      <Dashboard />
    </AuthGate>
  );
}
