import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useVenue } from "@/hooks/useVenue";
import { useArenaRealtime } from "@/hooks/useRealtime";
import { getDivision } from "@/lib/gamification";
import { Av, Tag, StatusTag, CountdownBadge, Divider, XpBar, C, fmtLabel } from "@/components/arena";
import CreditsDisplay from "@/components/wallet/CreditsDisplay";
import type { PadelPlayer, Session } from "@/hooks/useArena";

function fmtRp(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

function calcSplit(total: number, pct: number) {
  return Math.round((total * pct) / 100);
}

export default function VenuePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { venue, loading: venueLoading, slug } = useVenue();
  const [rankTab, setRankTab] = useState<"monthly" | "lifetime">("monthly");

  useArenaRealtime();

  const venueId = venue?.id;
  const accent = venue?.primary_color || C.green;

  // Sessions filtered by venue_id
  const { data: sessions = [] } = useQuery({
    queryKey: ["venue-sessions", venueId],
    enabled: !!venueId,
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)("sessions")
        .select("*, host:padel_players!sessions_host_id_fkey(*)")
        .eq("venue_id", venueId!)
        .in("status", ["live", "active"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Session[];
    },
  });

  // Monthly leaderboard filtered by venue
  const { data: monthly = [], isLoading: mLoad } = useQuery({
    queryKey: ["venue-leaderboard", "monthly", venueId],
    enabled: !!venueId,
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("venue_monthly_leaderboard", {
        p_venue_id: venueId!,
      });
      if (error) {
        // Fallback: if RPC doesn't exist yet, fetch all players
        const { data: fallback, error: e2 } = await (supabase.from as any)("padel_players")
          .select("*")
          .order("monthly_pts", { ascending: false })
          .limit(10);
        if (e2) throw e2;
        return (fallback ?? []) as PadelPlayer[];
      }
      return (data ?? []) as PadelPlayer[];
    },
  });

  // Lifetime leaderboard filtered by venue
  const { data: lifetime = [] } = useQuery({
    queryKey: ["venue-leaderboard", "lifetime", venueId],
    enabled: !!venueId,
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("venue_lifetime_leaderboard", {
        p_venue_id: venueId!,
      });
      if (error) {
        const { data: fallback, error: e2 } = await (supabase.from as any)("padel_players")
          .select("*")
          .order("lifetime_xp", { ascending: false })
          .limit(10);
        if (e2) throw e2;
        return (fallback ?? []) as PadelPlayer[];
      }
      return (data ?? []) as PadelPlayer[];
    },
  });

  const list = rankTab === "monthly" ? monthly : lifetime;
  const live = sessions.filter(s => s.status === "live");
  const upcoming = sessions.filter(s => s.status === "active");

  if (venueLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div style={{ color: C.muted, fontSize: 14 }}>Loading venue...</div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center gap-4">
        <div style={{ fontSize: 48 }}>🏟️</div>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Venue not found</div>
        <div style={{ fontSize: 13, color: C.muted }}>No venue with slug "{slug}"</div>
      </div>
    );
  }

  const prize = venue.monthly_prize || 0;
  const s1 = venue.prize_split_1st || 50;
  const s2 = venue.prize_split_2nd || 30;
  const s3 = venue.prize_split_3rd || 20;

  // Days left in current month
  const now = new Date();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const daysLeft = Math.max(0, endOfMonth.getDate() - now.getDate());
  const monthName = now.toLocaleString("en", { month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-background text-foreground max-w-md mx-auto" style={{ height: "100dvh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* TOP BAR */}
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {venue.logo_url ? (
            <img src={venue.logo_url} alt={venue.name} style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover" }} />
          ) : (
            <div style={{ width: 36, height: 36, borderRadius: 8, background: `${accent}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🏟️</div>
          )}
          <div>
            <div className="font-display" style={{ fontSize: 16, fontWeight: 900 }}>{venue.name}</div>
            {venue.city && <div style={{ fontSize: 9, color: C.dim, letterSpacing: 1 }}>{venue.city.toUpperCase()}{venue.country ? ` · ${venue.country.toUpperCase()}` : ""}</div>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {user ? (
            <>
              <CreditsDisplay />
              <button onClick={() => navigate(`/${slug}/host`)} style={{ background: `${accent}18`, border: `1px solid ${accent}40`, color: accent, padding: "6px 12px", borderRadius: 10, fontFamily: "'Barlow Condensed'", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>+ SESSION</button>
              <button onClick={() => navigate(`/${slug}/admin`)} style={{ background: `${C.orange}15`, border: `1px solid ${C.orange}40`, color: C.orange, padding: "6px 10px", borderRadius: 10, fontFamily: "'Barlow Condensed'", fontSize: 11, fontWeight: 800, cursor: "pointer" }}>🛡</button>
            </>
          ) : (
            <button onClick={() => navigate("/auth")} style={{ background: "#fff", border: "none", color: "#3c3c3c", padding: "7px 14px", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Sign in
            </button>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px 90px" }}>
        {/* Realtime indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, background: C.raised, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 12px" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: accent, animation: "pulse 2s infinite", flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: C.muted }}>Rankings update live when matches are approved by staff</span>
        </div>

        {/* Prize banner */}
        {prize > 0 && (
          <div style={{ background: "linear-gradient(135deg,#0B1A0C,#0B0E16)", border: `1px solid ${accent}25`, borderRadius: 14, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, textTransform: "uppercase" }}>{monthName} · Prize Season</div>
              <div className="font-display" style={{ fontSize: 24, fontWeight: 900, color: accent }}>{fmtRp(prize)}</div>
              <div style={{ fontSize: 10, color: C.muted }}>🥇 {fmtRp(calcSplit(prize, s1))} · 🥈 {fmtRp(calcSplit(prize, s2))} · 🥉 {fmtRp(calcSplit(prize, s3))}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 10, color: C.muted }}>ends in</div>
              <div className="font-display" style={{ fontSize: 28, color: C.red, lineHeight: 1 }}>{daysLeft}D</div>
            </div>
          </div>
        )}

        {/* Live sessions */}
        {live.length > 0 && (
          <>
            <Divider label="🔴 Live Now" />
            {live.map(s => (
              <div key={s.id} onClick={() => navigate(`/${slug}/session/${s.code}`)} style={{ background: "linear-gradient(160deg,#0D1E14,#0A0C11)", border: `1px solid ${accent}35`, borderRadius: 16, padding: 14, marginBottom: 10, cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <div>
                    <div className="font-display" style={{ fontSize: 17, fontWeight: 900, marginBottom: 6 }}>{s.name}</div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <Tag label={fmtLabel(s.format)} color={s.format === "americano" ? accent : C.purple} />
                      <Tag label="LIVE" color={accent} dot />
                    </div>
                  </div>
                  <div style={{ textAlign: "right", fontSize: 11, color: C.muted }}>
                    Host: <strong style={{ color: C.fg }}>{s.host?.name.split(" ")[0]}</strong>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: accent, fontWeight: 600 }}>Tap to view session →</div>
              </div>
            ))}
          </>
        )}

        {/* Active/upcoming */}
        {upcoming.length > 0 && (
          <>
            <Divider label="Upcoming · Support Open" />
            {upcoming.map(s => (
              <div key={s.id} onClick={() => navigate(`/${slug}/session/${s.code}`)} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "12px 14px", marginBottom: 8, cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
                      <Tag label={fmtLabel(s.format)} color={s.format === "americano" ? accent : C.purple} />
                      <Tag label={`Host: ${s.host?.name.split(" ")[0]}`} color={C.orange} />
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{s.name}</div>
                  </div>
                  <span style={{ color: C.muted }}>›</span>
                </div>
                <CountdownBadge startTime={s.scheduled_at} compact />
              </div>
            ))}
          </>
        )}

        {/* Rankings */}
        <Divider label="Player Rankings" />
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {([{ v: "monthly", l: "🏅 Monthly Pts" }, { v: "lifetime", l: "⚡ Lifetime XP" }] as const).map(t => (
            <button key={t.v} onClick={() => setRankTab(t.v)} style={{ flex: 1, padding: "8px 0", borderRadius: 20, background: rankTab === t.v ? `${accent}15` : C.card, border: `1px solid ${rankTab === t.v ? accent + "40" : C.border}`, color: rankTab === t.v ? accent : C.muted, fontFamily: "'Barlow Condensed'", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{t.l}</button>
          ))}
        </div>
        <div style={{ fontSize: 10, color: C.muted, textAlign: "center", marginBottom: 10 }}>
          {rankTab === "monthly" ? "Resets monthly · Top 3 win prize pool" : "Never resets · Drives Division badge"}
        </div>

        {mLoad ? (
          <div style={{ textAlign: "center", padding: "32px 0", color: C.muted, fontSize: 12 }}>Loading rankings...</div>
        ) : list.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 0", color: C.muted, fontSize: 12 }}>No players yet — join a session to appear here!</div>
        ) : (
          list.map((p, i) => {
            const div = getDivision(p.lifetime_xp);
            const val = rankTab === "monthly" ? p.monthly_pts : p.lifetime_xp;
            return (
              <motion.div key={p.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 14, marginBottom: 6, background: C.card, border: `1px solid ${C.border}` }}>
                <span style={{ width: 22, textAlign: "center", fontSize: i < 3 ? 15 : 11, fontWeight: 700, color: i < 3 ? accent : C.dim }}>{["👑", "🥈", "🥉"][i] || i + 1}</span>
                <Av initials={p.avatar} size={32} color={div.color} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                  <div style={{ display: "flex", gap: 5, marginTop: 2 }}>
                    <Tag label={div.label} color={div.color} />
                    {p.streak >= 3 && <Tag label={`🔥${p.streak}`} color={C.orange} />}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="font-display" style={{ fontSize: 17, fontWeight: 900, color: i === 0 ? accent : C.muted }}>{val.toLocaleString()}</div>
                  <div style={{ fontSize: 9, color: C.muted }}>{rankTab === "monthly" ? "pts" : "XP"}</div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
