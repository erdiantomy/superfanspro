import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { getDivision } from "@/lib/gamification";

const GREEN = "#00E676";

const ROLE_TABS = [
  { key: "player", label: "🎾 Players", color: GREEN },
  { key: "venue", label: "🏟️ Venue Owners", color: "#60D5FF" },
  { key: "host", label: "📋 Session Hosts", color: "#FFD166" },
] as const;

type RoleKey = typeof ROLE_TABS[number]["key"];

const ROLE_FLOWS: Record<RoleKey, { icon: string; title: string; desc: string; visual: string }[]> = {
  player: [
    { icon: "📱", title: "Open Your Venue Link", desc: "No app download. Just open your venue's URL (e.g. superfans.games/yourclub) on any phone or laptop.", visual: "🌐 → 📱" },
    { icon: "🔐", title: "Sign In with Google", desc: "One-tap Google sign-in. Your profile is created instantly with a unique username and avatar.", visual: "👤 ✓" },
    { icon: "🏓", title: "Join a Live Session", desc: "See open sessions at your venue. Tap to join — the host assigns you to a court and match.", visual: "📋 → 🏓" },
    { icon: "📊", title: "Play & Earn XP", desc: "After your match, staff verifies the score. You earn XP based on result and session ranking. Win = 100 base XP, Loss = 50 base XP.", visual: "⭐ +XP" },
    { icon: "🏆", title: "Climb the Leaderboard", desc: "Your XP accumulates across all venues. Rise through divisions: Bronze → Silver → Gold → Platinum → Diamond.", visual: "📈 🥇" },
    { icon: "💰", title: "Support & Earn Credits", desc: "Back other players before matches. If they win, you split 70% of the losing pool proportionally.", visual: "🤝 → 💵" },
  ],
  venue: [
    { icon: "📝", title: "Register Your Venue", desc: "Fill out a 5-minute form with your venue name, city, number of courts, and brand color. We activate within 24 hours.", visual: "📋 → ✅" },
    { icon: "🔗", title: "Get Your Branded URL", desc: "You receive a unique link like superfans.games/yourclub. Share it with your players — that's it!", visual: "🌐 yourclub" },
    { icon: "🏆", title: "Set Monthly Prizes", desc: "Define a prize pool amount. Top 3 players on your leaderboard at month's end split it automatically.", visual: "💰 → 🥇🥈🥉" },
    { icon: "📊", title: "Track Everything", desc: "See live player counts, session history, leaderboards, and revenue from the admin dashboard.", visual: "📈 Dashboard" },
    { icon: "💳", title: "Earn from Support Economy", desc: "10% platform fee on the support pool goes to sustaining the ecosystem. Zero monthly subscription for you.", visual: "0 → 💵" },
  ],
  host: [
    { icon: "➕", title: "Create a Session", desc: "As host, open a new session — pick the format (Americano or Mexicano), set the number of courts and rounds.", visual: "🆕 Session" },
    { icon: "👥", title: "Players Join", desc: "Players see your session in real-time and tap to join. You see the roster build up live on your screen.", visual: "👤👤👤 → 📋" },
    { icon: "🔀", title: "Matches Auto-Generate", desc: "The system pairs players and assigns courts automatically each round. No spreadsheets needed.", visual: "🤖 → 🏓🏓" },
    { icon: "✅", title: "Verify Scores", desc: "After each match, players submit scores. You review and approve — XP is credited instantly upon approval.", visual: "📝 → ✓ → ⭐" },
    { icon: "📊", title: "Session Leaderboard", desc: "A live leaderboard updates after each round. Players see their rank, wins, and XP earned in real-time.", visual: "🏆 Live" },
  ],
};

const ECONOMY_FLOW = [
  { label: "Fan backs Player A", amount: "100 Cr", icon: "🤝" },
  { label: "Player A wins!", amount: "", icon: "🏆" },
  { label: "70% → Winning backers", amount: "70 Cr", icon: "💰" },
  { label: "20% → Winning player", amount: "20 Cr", icon: "⭐" },
  { label: "10% → Platform", amount: "10 Cr", icon: "🏟️" },
];

const XP_TABLE = [
  { result: "Win", base: 100, rank1: "200 XP (×2.0)", rank3: "140 XP (×1.4)", rank6: "120 XP (×1.2)" },
  { result: "Loss", base: 50, rank1: "100 XP (×2.0)", rank3: "70 XP (×1.4)", rank6: "60 XP (×1.2)" },
];

const DIVISIONS = [
  { label: "Diamond", color: "#60D5FF", min: "3000+", icon: "💎" },
  { label: "Platinum", color: "#B8A9FF", min: "2400", icon: "⚪" },
  { label: "Gold", color: "#FFD166", min: "1600", icon: "🥇" },
  { label: "Silver", color: "#C0C0C0", min: "900", icon: "🥈" },
  { label: "Bronze", color: "#CD7F32", min: "0", icon: "🥉" },
];

interface Venue {
  id: string; slug: string; name: string; logo_url: string | null;
  city: string | null; primary_color: string | null;
}

interface FeaturedPlayer {
  player_id: string;
  display_name: string;
  slug: string;
  avatar_url: string | null;
  division: string | null;
  win_rate: number | null;
  games_played: number | null;
  supporter_count: number | null;
  lifetime_xp: number | null;
}

const FEATURES = [
  { icon: "🏆", title: "Live Leaderboards", desc: "Real-time rankings update the moment scores are approved by staff." },
  { icon: "⚡", title: "XP & Division Badges", desc: "Players earn XP every match. Bronze → Silver → Gold → Platinum → Diamond." },
  { icon: "💰", title: "Monthly Prize Pools", desc: "You set the prize amount. Top 3 players split it at month's end." },
  { icon: "🤝", title: "Player Support Economy", desc: "Fans back players before matches. Win together, earn together." },
  { icon: "🧑", title: "Player Profile Pages", desc: "Get your own URL at superfans.games/yourname. Share it with fans and receive support." },
  { icon: "💚", title: "Fan Donations", desc: "Fans send direct support via eWallet. No middleman, instant payment." },
];

const STEPS = [
  { n: "1", title: "Register your venue", desc: "Fill out a quick form — takes 5 minutes. We review and activate within 24 hours." },
  { n: "2", title: "Players sign in with Google", desc: "No app download needed. Players open your venue URL and tap Sign In." },
  { n: "3", title: "Matches are tracked automatically", desc: "Scores verified, XP credited, leaderboards updated — all in real time." },
];

function HowItWorksSection() {
  const [activeRole, setActiveRole] = useState<RoleKey>("player");
  const [expandedEconomy, setExpandedEconomy] = useState(false);
  const flow = ROLE_FLOWS[activeRole];
  const tab = ROLE_TABS.find(t => t.key === activeRole)!;

  return (
    <section style={{ padding: "56px 24px 0", maxWidth: 820, margin: "0 auto" }} id="how-it-works">
      <h2 style={{ textAlign: "center", fontSize: 11, fontWeight: 800, letterSpacing: 2, color: GREEN, textTransform: "uppercase", marginBottom: 8 }}>How It Works</h2>
      <p style={{ textAlign: "center", fontSize: 28, fontWeight: 800, marginBottom: 8, fontFamily: "'Barlow Condensed', sans-serif" }}>See it from every angle</p>
      <p style={{ textAlign: "center", fontSize: 14, color: "#777", marginBottom: 32, maxWidth: 480, margin: "0 auto 32px" }}>
        Pick your role below to see exactly how SuperFans works for you.
      </p>

      {/* Role Tabs */}
      <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 32, flexWrap: "wrap" }}>
        {ROLE_TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveRole(t.key)}
            style={{
              padding: "8px 14px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer",
              border: activeRole === t.key ? `2px solid ${t.color}` : "2px solid #eee",
              background: activeRole === t.key ? `${t.color}12` : "#fff",
              color: activeRole === t.key ? t.color : "#888",
              transition: "all .2s",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Flow Steps */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeRole}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25 }}
          style={{ display: "grid", gap: 0, position: "relative" }}
        >
          {flow.map((step, i) => (
            <div key={i} style={{ display: "flex", gap: 16, alignItems: "stretch" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 40, flexShrink: 0 }}>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.08, type: "spring", stiffness: 300 }}
                  style={{
                    width: 40, height: 40, borderRadius: 12,
                    background: `${tab.color}18`, border: `2px solid ${tab.color}40`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 20, flexShrink: 0,
                  }}
                >
                  {step.icon}
                </motion.div>
                {i < flow.length - 1 && (
                  <div style={{ width: 2, flex: 1, background: `${tab.color}25`, minHeight: 16 }} />
                )}
              </div>
              <motion.div
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 + 0.05 }}
                style={{
                  flex: 1, background: "#fff", border: "1px solid #eee", borderRadius: 14,
                  padding: "14px 14px",
                  display: "flex", flexDirection: "column", gap: 8,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{step.title}</div>
                  <div style={{ fontSize: 12, color: "#666", lineHeight: 1.6 }}>{step.desc}</div>
                </div>
              </motion.div>
            </div>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* XP & Division System */}
      <div style={{ marginTop: 48 }}>
        <h3 style={{ textAlign: "center", fontSize: 11, fontWeight: 800, letterSpacing: 2, color: GREEN, textTransform: "uppercase", marginBottom: 8 }}>Gamification</h3>
        <p style={{ textAlign: "center", fontSize: 22, fontWeight: 800, marginBottom: 28, fontFamily: "'Barlow Condensed', sans-serif" }}>XP System & Divisions</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(70px, 1fr))", gap: 8, marginBottom: 24, maxWidth: 500, margin: "0 auto 24px" }}>
          {DIVISIONS.map((d, i) => (
            <motion.div
              key={d.label}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              style={{
                background: `${d.color}12`, border: `2px solid ${d.color}40`, borderRadius: 14,
                padding: "10px 8px", textAlign: "center", cursor: "default",
              }}
            >
              <div style={{ fontSize: 20 }}>{d.icon}</div>
              <div style={{ fontSize: 11, fontWeight: 800, color: d.color, marginTop: 4 }}>{d.label}</div>
              <div style={{ fontSize: 10, color: "#999", marginTop: 2 }}>{d.min} XP</div>
            </motion.div>
          ))}
        </div>

        <div style={{ background: "#f9f9f9", borderRadius: 14, padding: "16px", border: "1px solid #eee", maxWidth: 600, margin: "0 auto", overflowX: "auto" }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: "#444" }}>📊 XP Earned Per Match</div>
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr 1fr 1fr", gap: "6px 8px", fontSize: 11, minWidth: 280 }}>
            <div style={{ fontWeight: 800, color: "#999", fontSize: 9, textTransform: "uppercase", letterSpacing: 1 }}>Result</div>
            <div style={{ fontWeight: 800, color: "#999", fontSize: 9, textTransform: "uppercase", letterSpacing: 1 }}>Rank #1</div>
            <div style={{ fontWeight: 800, color: "#999", fontSize: 9, textTransform: "uppercase", letterSpacing: 1 }}>Rank #3</div>
            <div style={{ fontWeight: 800, color: "#999", fontSize: 9, textTransform: "uppercase", letterSpacing: 1 }}>Rank #6</div>
            {XP_TABLE.map(row => (
              <React.Fragment key={row.result}>
                <div style={{ fontWeight: 700, color: row.result === "Win" ? GREEN : "#e74c3c", whiteSpace: "nowrap" }}>{row.result === "Win" ? "✅ Win" : "❌ Loss"}</div>
                <div style={{ color: "#333", fontSize: 10 }}>{row.rank1}</div>
                <div style={{ color: "#333", fontSize: 10 }}>{row.rank3}</div>
                <div style={{ color: "#333", fontSize: 10 }}>{row.rank6}</div>
              </React.Fragment>
            ))}
          </div>
          <div style={{ fontSize: 11, color: "#999", marginTop: 12, lineHeight: 1.5 }}>
            💡 Higher session ranking = bigger XP multiplier. Rank #1 gets ×2.0, Rank #6+ gets ×1.2.
          </div>
        </div>
      </div>

      {/* Support Economy Visual */}
      <div style={{ marginTop: 48, marginBottom: 48 }}>
        <h3 style={{ textAlign: "center", fontSize: 11, fontWeight: 800, letterSpacing: 2, color: GREEN, textTransform: "uppercase", marginBottom: 8 }}>Support Economy</h3>
        <p style={{ textAlign: "center", fontSize: 22, fontWeight: 800, marginBottom: 8, fontFamily: "'Barlow Condensed', sans-serif" }}>Back Players. Win Together.</p>
        <p style={{ textAlign: "center", fontSize: 13, color: "#777", marginBottom: 24, maxWidth: 460, margin: "0 auto 24px" }}>
          Fans stake credits on players before a match. When your player wins, the losing pool is split.
        </p>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
          {ECONOMY_FLOW.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div style={{
                display: "flex", alignItems: "center", gap: 12, padding: "12px 20px",
                background: i === 1 ? `${GREEN}10` : "#fff",
                border: i === 1 ? `2px solid ${GREEN}40` : "1px solid #eee",
                borderRadius: 12, minWidth: 280, justifyContent: "space-between",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 22 }}>{step.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#333" }}>{step.label}</span>
                </div>
                {step.amount && (
                  <span style={{ fontSize: 14, fontWeight: 800, color: GREEN, fontFamily: "'Barlow Condensed'" }}>{step.amount}</span>
                )}
              </div>
              {i < ECONOMY_FLOW.length - 1 && (
                <div style={{ width: 2, height: 16, background: "#ddd", margin: "0 auto" }} />
              )}
            </motion.div>
          ))}
        </div>

        {/* How Donations Work */}
        <div style={{ marginTop: 32, maxWidth: 520, margin: "32px auto 0" }}>
          <h4 style={{ textAlign: "center", fontSize: 11, fontWeight: 800, letterSpacing: 2, color: GREEN, textTransform: "uppercase", marginBottom: 8 }}>Fan Donations</h4>
          <p style={{ textAlign: "center", fontSize: 13, color: "#777", marginBottom: 20 }}>
            Fans can support any player directly. Send a donation, leave a message, and become a Superfan.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
            {[
              { step: "1", label: "Visit a player page" },
              { step: "2", label: "Choose amount" },
              { step: "3", label: "Pay with eWallet" },
            ].map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: `${GREEN}15`, border: `1px solid ${GREEN}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, color: GREEN }}>{s.step}</div>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#555" }}>{s.label}</span>
                {i < 2 && <span style={{ color: "#ccc", fontSize: 16 }}>→</span>}
              </div>
            ))}
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 20 }}>
          <button
            onClick={() => setExpandedEconomy(!expandedEconomy)}
            style={{
              background: "none", border: "1px solid #ddd", borderRadius: 8,
              padding: "8px 16px", fontSize: 12, fontWeight: 600, color: "#666",
              cursor: "pointer", transition: "all .2s",
            }}
          >
            {expandedEconomy ? "Hide details ▲" : "See full example ▼"}
          </button>
        </div>

        <AnimatePresence>
          {expandedEconomy && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: "hidden" }}
            >
              <div style={{
                background: "#f9f9f9", borderRadius: 14, padding: "20px", border: "1px solid #eee",
                maxWidth: 520, margin: "16px auto 0", fontSize: 13, lineHeight: 1.8, color: "#555",
              }}>
                <div style={{ fontWeight: 700, color: "#333", marginBottom: 8 }}>📖 Full Example</div>
                <div>3 fans back <b>Player A</b> with 50 Cr each = <b>150 Cr</b></div>
                <div>2 fans back <b>Player B</b> with 50 Cr each = <b>100 Cr</b></div>
                <div style={{ borderTop: "1px solid #ddd", margin: "8px 0", paddingTop: 8 }}>
                  <b>Player A wins!</b> Losing pool = 100 Cr
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginTop: 4 }}>
                  <div>→ 70 Cr split among A's backers</div>
                  <div style={{ color: GREEN, fontWeight: 700 }}>Each gets ~23 Cr profit</div>
                  <div>→ 20 Cr to Player A</div>
                  <div style={{ color: GREEN, fontWeight: 700 }}>Player bonus</div>
                  <div>→ 10 Cr platform fee</div>
                  <div style={{ color: "#999" }}>Sustains the ecosystem</div>
                </div>
                <div style={{ marginTop: 8, color: "#999", fontSize: 11 }}>
                  Player B's backers lose their 50 Cr stake. High risk, high reward!
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

import React from "react";

export default function HomePage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // Redirect authenticated users to the main app
  React.useEffect(() => {
    if (!loading && user) {
      navigate("/fanprize", { replace: true });
    }
  }, [user, loading, navigate]);

  const { data: venues = [] } = useQuery({
    queryKey: ["active-venues"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("venues").select("id, slug, name, logo_url, city, primary_color").eq("status", "active").order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Venue[];
    },
  });

  // Featured players
  const { data: featuredPlayers = [] } = useQuery({
    queryKey: ["featured-players"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("player_profile_full")
        .select("player_id, display_name, slug, avatar_url, division, win_rate, games_played, supporter_count, lifetime_xp")
        .eq("is_public", true)
        .order("lifetime_xp", { ascending: false })
        .limit(6);
      if (error) throw error;
      return (data ?? []) as FeaturedPlayer[];
    },
  });

  // Check if user has a profile
  const { data: userProfileSlug } = useQuery({
    queryKey: ["my-profile-slug", user?.id],
    queryFn: async () => {
      const { data: player } = await (supabase as any).from("padel_players").select("id").eq("user_id", user!.id).single();
      if (!player) return null;
      const { data: profile } = await (supabase as any).from("player_profiles").select("slug").eq("player_id", player.id).single();
      return profile?.slug ?? null;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div style={{ background: "#fff", color: "#111", fontFamily: "'DM Sans', -apple-system, sans-serif" }}>

      {/* NAV */}
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", maxWidth: 960, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 900, letterSpacing: 1 }}>SUPERFANS</span>
          <span style={{ fontSize: 9, color: "#999", letterSpacing: 1 }}>.GAMES</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {user ? (
            <>
              {userProfileSlug ? (
                <button onClick={() => navigate(`/${userProfileSlug}`)} style={{ background: `${GREEN}12`, color: GREEN, border: `1px solid ${GREEN}40`, padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>My Page</button>
              ) : (
                <button onClick={() => navigate("/auth")} style={{ background: `${GREEN}12`, color: GREEN, border: `1px solid ${GREEN}40`, padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Claim Page</button>
              )}
              <button onClick={() => navigate("/register")} style={{ background: "transparent", color: "#555", border: "1px solid #ddd", padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Register Venue</button>
            </>
          ) : (
            <>
              <button onClick={() => navigate("/auth")} style={{ background: "transparent", color: "#555", border: "1px solid #ddd", padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Sign In</button>
              <button onClick={() => navigate("/register")} style={{ background: "transparent", color: "#555", border: "1px solid #ddd", padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Register Venue</button>
            </>
          )}
        </div>
      </nav>

      {/* HERO */}
      <section style={{ textAlign: "center", padding: "40px 16px 36px", maxWidth: 640, margin: "0 auto" }}>
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ fontSize: "clamp(28px, 6vw, 44px)", fontWeight: 900, lineHeight: 1.1, marginBottom: 16, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: -0.5 }}>
          Play. Compete.<br /><span style={{ color: GREEN }}>Get Supported.</span>
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} style={{ fontSize: 15, color: "#555", lineHeight: 1.7, marginBottom: 28, maxWidth: 480, margin: "0 auto 28px" }}>
          Claim your player page, climb the leaderboard, and receive support from your fans — all at your favorite padel venue.
        </motion.p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => navigate("/auth")} style={{ background: GREEN, color: "#111", border: "none", padding: "12px 24px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", width: "100%", maxWidth: 280 }}>
            Claim Your Page →
          </button>
          <button onClick={() => { const el = document.getElementById("venue-section"); el?.scrollIntoView({ behavior: "smooth" }); }} style={{ background: "transparent", color: "#555", border: "1px solid #ddd", padding: "12px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", width: "100%", maxWidth: 280 }}>
            I'm a Venue Owner →
          </button>
        </div>
        <div style={{ marginTop: 10 }}>
          <button onClick={() => navigate("/tomspadel")} style={{ background: "none", border: "none", color: GREEN, fontSize: 13, fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}>
            See a live example →
          </button>
        </div>

        {/* App Demo Video in Phone Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          style={{ marginTop: 40, display: "flex", justifyContent: "center" }}
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            style={{
            width: 280,
            background: "#111",
            borderRadius: 40,
            padding: "14px 10px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.1) inset",
            position: "relative",
          }}>
            <div style={{
              position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)",
              width: 80, height: 22, background: "#111", borderRadius: 12, zIndex: 2,
              border: "1px solid #222",
            }} />
            <div style={{ borderRadius: 30, overflow: "hidden", background: "#000" }}>
              <video autoPlay loop muted playsInline style={{ width: "100%", display: "block" }}>
                <source src="/videos/app-demo.webm" type="video/webm" />
                <source src="/videos/app-demo.mp4" type="video/mp4" />
              </video>
            </div>
            <div style={{ width: 100, height: 4, background: "#444", borderRadius: 2, margin: "8px auto 0" }} />
          </motion.div>
        </motion.div>
      </section>

      {/* FEATURED PLAYERS */}
      <section style={{ padding: "48px 24px", maxWidth: 800, margin: "0 auto" }}>
        <h2 style={{ textAlign: "center", fontSize: 11, fontWeight: 800, letterSpacing: 2, color: GREEN, textTransform: "uppercase", marginBottom: 8 }}>Top Players</h2>
        <p style={{ textAlign: "center", fontSize: 24, fontWeight: 800, marginBottom: 32, fontFamily: "'Barlow Condensed', sans-serif" }}>Rising Stars on SuperFans</p>
        {featuredPlayers.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
            {featuredPlayers.map(p => {
              const div = getDivision(p.lifetime_xp || 0);
              return (
                <motion.div
                  key={p.player_id}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  onClick={() => navigate(`/${p.slug}`)}
                  style={{ background: "#f8f9fa", border: "1px solid #ddd", borderRadius: 14, padding: "18px 14px", textAlign: "center", cursor: "pointer", transition: "box-shadow .2s", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
                  whileHover={{ boxShadow: `0 4px 20px ${GREEN}15` }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: 56, height: 56, borderRadius: "50%", margin: "0 auto 10px",
                    background: `linear-gradient(135deg,${div.color}35,${div.color}10)`,
                    border: `2px solid ${div.color}40`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 20, fontWeight: 800, color: div.color,
                    fontFamily: "'Barlow Condensed', sans-serif",
                  }}>
                    {p.display_name?.slice(0, 2).toUpperCase() || "??"}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{p.display_name}</div>
                  <div style={{
                    display: "inline-block", background: `${div.color}15`, color: div.color,
                    border: `1px solid ${div.color}30`, padding: "2px 8px", borderRadius: 20,
                    fontSize: 10, fontWeight: 700, marginBottom: 8,
                  }}>{div.label}</div>
                  <div style={{ display: "flex", justifyContent: "center", gap: 12, fontSize: 11, color: "#777" }}>
                    <span>{p.win_rate != null ? `${Math.round(p.win_rate)}% WR` : "–"}</span>
                    <span>{p.games_played ?? 0} games</span>
                  </div>
                  {(p.supporter_count ?? 0) > 0 && (
                    <div style={{ fontSize: 10, color: GREEN, fontWeight: 600, marginTop: 6 }}>
                      {p.supporter_count} Superfan{p.supporter_count !== 1 ? "s" : ""}
                    </div>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/${p.slug}`); }}
                    style={{
                      marginTop: 10, background: `${GREEN}12`, border: `1px solid ${GREEN}30`,
                      color: GREEN, padding: "5px 14px", borderRadius: 8, fontSize: 11,
                      fontWeight: 700, cursor: "pointer",
                    }}
                  >
                    Support →
                  </button>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: "center", color: "#999", fontSize: 13, padding: "20px 0" }}>
            Players are joining every day. Claim your page and be featured here!
          </div>
        )}
      </section>

      {/* DIVIDER */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ height: 1, background: "#eee" }} />
      </div>

      {/* HOW IT WORKS */}
      <HowItWorksSection />

      {/* FEATURES */}
      <section style={{ background: "#f9f9f9", padding: "48px 24px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", fontSize: 11, fontWeight: 800, letterSpacing: 2, color: GREEN, textTransform: "uppercase", marginBottom: 8 }}>Features</h2>
          <p style={{ textAlign: "center", fontSize: 24, fontWeight: 800, marginBottom: 32, fontFamily: "'Barlow Condensed', sans-serif" }}>Everything you need</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
            {FEATURES.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} style={{ background: "#fff", borderRadius: 14, padding: "20px 18px", border: "1px solid #eee" }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>{f.icon}</div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{f.title}</div>
                <div style={{ fontSize: 13, color: "#666", lineHeight: 1.6 }}>{f.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ACTIVE VENUES */}
      {venues.length > 0 && (
        <section id="venue-section" style={{ padding: "48px 24px", maxWidth: 800, margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", fontSize: 11, fontWeight: 800, letterSpacing: 2, color: GREEN, textTransform: "uppercase", marginBottom: 8 }}>Active Venues</h2>
          <p style={{ textAlign: "center", fontSize: 24, fontWeight: 800, marginBottom: 32, fontFamily: "'Barlow Condensed', sans-serif" }}>Already on SuperFans</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
            {venues.map(v => (
              <div key={v.id} style={{ background: "#fff", border: "1px solid #eee", borderRadius: 14, padding: "18px 16px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 10 }}>
                {v.logo_url ? (
                  <img src={v.logo_url} alt={v.name} style={{ width: 48, height: 48, borderRadius: 10, objectFit: "cover" }} />
                ) : (
                  <div style={{ width: 48, height: 48, borderRadius: 10, background: `${v.primary_color || GREEN}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🏟️</div>
                )}
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{v.name}</div>
                  {v.city && <div style={{ fontSize: 12, color: "#999" }}>{v.city}</div>}
                </div>
                <button onClick={() => navigate(`/${v.slug}/rank`)} style={{ background: `${v.primary_color || GREEN}12`, border: `1px solid ${v.primary_color || GREEN}30`, color: v.primary_color || GREEN, padding: "6px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>View Rankings →</button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* PRICING */}
      <section style={{ background: "#111", color: "#fff", padding: "48px 24px" }}>
        <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, color: GREEN, textTransform: "uppercase", marginBottom: 8 }}>Pricing</h2>
          <p style={{ fontSize: 28, fontWeight: 800, marginBottom: 24, fontFamily: "'Barlow Condensed', sans-serif" }}>Simple & transparent</p>
          <div style={{ display: "grid", gap: 16, textAlign: "left" }}>
            <div style={{ background: "#1a1a1a", borderRadius: 14, padding: "20px 22px", border: "1px solid #333" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 16, fontWeight: 700 }}>Venue Registration</span>
                <span style={{ fontSize: 20, fontWeight: 900, color: GREEN }}>Free</span>
              </div>
              <div style={{ fontSize: 13, color: "#888", lineHeight: 1.6 }}>Full access to leaderboards, XP system, session management, and admin tools.</div>
            </div>
            <div style={{ background: "#1a1a1a", borderRadius: 14, padding: "20px 22px", border: "1px solid #333" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 16, fontWeight: 700 }}>Platform Fee</span>
                <span style={{ fontSize: 20, fontWeight: 900, color: GREEN }}>10%</span>
              </div>
              <div style={{ fontSize: 13, color: "#888", lineHeight: 1.6 }}>Applied only to support pools. No monthly subscription, no setup fees.</div>
            </div>
          </div>
          <p style={{ fontSize: 13, color: "#666", marginTop: 20 }}>Want to discuss a venue partnership? <a href="https://wa.me/6281218153309" target="_blank" rel="noopener noreferrer" style={{ color: GREEN, textDecoration: "none", fontWeight: 600 }}>Contact us on WhatsApp</a></p>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: "28px 16px", maxWidth: 800, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, textAlign: "center" }}>
        <div>
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 900, letterSpacing: 1 }}>SUPERFANS</span>
          <span style={{ fontSize: 9, color: "#999", letterSpacing: 1 }}>.GAMES</span>
          <div style={{ fontSize: 12, color: "#999", marginTop: 4 }}>Built for padel athletes and their fans</div>
          <div style={{ fontSize: 11, color: "#666", marginTop: 6 }}>© 2026 SuperFans. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
