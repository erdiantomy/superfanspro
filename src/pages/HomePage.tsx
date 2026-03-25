import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

const GREEN = "#00E676";

interface Venue {
  id: string; slug: string; name: string; logo_url: string | null;
  city: string | null; primary_color: string | null;
}

const FEATURES = [
  { icon: "🏆", title: "Live Leaderboards", desc: "Real-time rankings update the moment scores are approved by staff." },
  { icon: "⚡", title: "XP & Division Badges", desc: "Players earn XP every match. Bronze → Silver → Gold → Platinum → Diamond." },
  { icon: "💰", title: "Monthly Prize Pools", desc: "You set the prize amount. Top 3 players split it at month's end." },
  { icon: "🤝", title: "Player Support Economy", desc: "Fans back players before matches. Win together, earn together." },
  { icon: "🌏", title: "One Global Profile", desc: "Players carry their XP and division across every SuperFans venue." },
  { icon: "🛡️", title: "Admin Score Verification", desc: "Every match score is verified by staff before XP is credited." },
];

const STEPS = [
  { n: "1", title: "Register your venue", desc: "Fill out a quick form — takes 5 minutes. We review and activate within 24 hours." },
  { n: "2", title: "Players sign in with Google", desc: "No app download needed. Players open your venue URL and tap Sign In." },
  { n: "3", title: "Matches are tracked automatically", desc: "Scores verified, XP credited, leaderboards updated — all in real time." },
];

export default function HomePage() {
  const navigate = useNavigate();

  const { data: venues = [] } = useQuery({
    queryKey: ["active-venues"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("venues").select("id, slug, name, logo_url, city, primary_color").eq("status", "active").order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Venue[];
    },
  });

  return (
    <div style={{ background: "#fff", color: "#111", fontFamily: "'DM Sans', -apple-system, sans-serif" }}>

      {/* NAV */}
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", maxWidth: 960, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 900, letterSpacing: 1 }}>SUPERFANS</span>
          <span style={{ fontSize: 10, color: "#999", letterSpacing: 1 }}>.GAMES</span>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button onClick={() => navigate("/register")} style={{ background: GREEN, color: "#111", border: "none", padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Register Venue</button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ textAlign: "center", padding: "60px 24px 48px", maxWidth: 640, margin: "0 auto" }}>
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ fontSize: "clamp(28px, 6vw, 44px)", fontWeight: 900, lineHeight: 1.1, marginBottom: 16, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: -0.5 }}>
          Your Padel Venue.<br /><span style={{ color: GREEN }}>Fully Gamified.</span>
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} style={{ fontSize: 16, color: "#555", lineHeight: 1.7, marginBottom: 32, maxWidth: 480, margin: "0 auto 32px" }}>
          Live rankings, XP points, monthly prizes, and a player support economy — out of the box.
        </motion.p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => navigate("/register")} style={{ background: "#111", color: "#fff", border: "none", padding: "14px 32px", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
            Register Your Venue →
          </button>
          <button onClick={() => navigate("/tomspadel")} style={{ background: "transparent", color: "#555", border: "1px solid #ddd", padding: "14px 24px", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            See a live example
          </button>
        </div>
      </section>

      {/* DIVIDER */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ height: 1, background: "#eee" }} />
      </div>

      {/* HOW IT WORKS */}
      <section style={{ padding: "48px 24px", maxWidth: 720, margin: "0 auto" }}>
        <h2 style={{ textAlign: "center", fontSize: 11, fontWeight: 800, letterSpacing: 2, color: GREEN, textTransform: "uppercase", marginBottom: 8 }}>How It Works</h2>
        <p style={{ textAlign: "center", fontSize: 24, fontWeight: 800, marginBottom: 36, fontFamily: "'Barlow Condensed', sans-serif" }}>Up and running in 3 steps</p>
        <div style={{ display: "grid", gap: 16 }}>
          {STEPS.map(s => (
            <motion.div key={s.n} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `${GREEN}15`, color: GREEN, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 18, fontFamily: "'Barlow Condensed'", flexShrink: 0 }}>{s.n}</div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{s.title}</div>
                <div style={{ fontSize: 14, color: "#666", lineHeight: 1.6 }}>{s.desc}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ background: "#f9f9f9", padding: "48px 24px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", fontSize: 11, fontWeight: 800, letterSpacing: 2, color: GREEN, textTransform: "uppercase", marginBottom: 8 }}>Features</h2>
          <p style={{ textAlign: "center", fontSize: 24, fontWeight: 800, marginBottom: 32, fontFamily: "'Barlow Condensed', sans-serif" }}>Everything your venue needs</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
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
        <section style={{ padding: "48px 24px", maxWidth: 800, margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", fontSize: 11, fontWeight: 800, letterSpacing: 2, color: GREEN, textTransform: "uppercase", marginBottom: 8 }}>Active Venues</h2>
          <p style={{ textAlign: "center", fontSize: 24, fontWeight: 800, marginBottom: 32, fontFamily: "'Barlow Condensed', sans-serif" }}>Already on SuperFans</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
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
          <p style={{ fontSize: 13, color: "#666", marginTop: 20 }}>Want to discuss a venue partnership? <a href="mailto:hello@superfans.games" style={{ color: GREEN, textDecoration: "none", fontWeight: 600 }}>Contact us</a></p>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: "32px 24px", maxWidth: 800, margin: "0 auto", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
        <div>
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 900, letterSpacing: 1 }}>SUPERFANS</span>
          <span style={{ fontSize: 9, color: "#999", letterSpacing: 1 }}>.GAMES</span>
          <div style={{ fontSize: 12, color: "#999", marginTop: 4 }}>Built for padel communities across Southeast Asia</div>
        </div>
        <div style={{ display: "flex", gap: 20 }}>
          {[
            { label: "Register", to: "/register" },
            { label: "How it works", to: "/#how-it-works" },
            { label: "Contact", href: "mailto:hello@superfans.games" },
          ].map((l, i) => (
            "to" in l ? (
              <button key={i} onClick={() => navigate(l.to)} style={{ background: "none", border: "none", color: "#666", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0 }}>{l.label}</button>
            ) : (
              <a key={i} href={l.href} style={{ color: "#666", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>{l.label}</a>
            )
          ))}
        </div>
      </footer>
    </div>
  );
}
