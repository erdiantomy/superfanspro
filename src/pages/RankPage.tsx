import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useMonthlyLeaderboard, useLifetimeLeaderboard } from "@/hooks/useArena";
import { useArenaRealtime } from "@/hooks/useRealtime";
import { getDivision } from "@/lib/gamification";
import { Av, Tag, C } from "@/components/arena";

export default function RankPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"monthly" | "lifetime">("monthly");
  useArenaRealtime();

  const { data: monthly  = [], isLoading: mLoad } = useMonthlyLeaderboard();
  const { data: lifetime = [], isLoading: lLoad } = useLifetimeLeaderboard();

  const list    = tab === "monthly" ? monthly : lifetime;
  const loading = tab === "monthly" ? mLoad : lLoad;
  const top3    = list.slice(0, 3);
  const rest    = list.slice(3);

  const podiumOrder = [top3[1], top3[0], top3[2]]; // 2nd, 1st, 3rd
  const podiumHeight = [80, 110, 60];
  const podiumEmoji  = ["🥈", "👑", "🥉"];
  const podiumRank   = [2, 1, 3];

  return (
    <div style={{
      minHeight: "100dvh", background: C.bg, color: C.fg,
      fontFamily: "'DM Sans', sans-serif", maxWidth: 480,
      margin: "0 auto", display: "flex", flexDirection: "column",
    }}>
      {/* HEADER */}
      <div style={{
        padding: "14px 18px 12px",
        borderBottom: `1px solid ${C.border}`,
        background: "linear-gradient(180deg, #0D1E14 0%, #0A0C11 100%)",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div>
            <div className="font-display" style={{ fontSize: 24, fontWeight: 900, letterSpacing: 2, color: C.green, lineHeight: 1 }}>
              RANKINGS
            </div>
            <div style={{ fontSize: 10, color: C.dim, letterSpacing: 1, marginTop: 2 }}>
              superfanspro.vercel.app/rank · LIVE
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: C.green, animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 10, color: C.muted }}>Auto-updates</span>
          </div>
        </div>

        {/* TABS */}
        <div style={{ display: "flex", gap: 8 }}>
          {([
            { v: "monthly",  l: "🏅 Monthly Points",  sub: "Resets monthly · Prize season" },
            { v: "lifetime", l: "⚡ Lifetime XP",      sub: "All-time · Never resets" },
          ] as const).map(t => (
            <button key={t.v} onClick={() => setTab(t.v)} style={{
              flex: 1, padding: "9px 10px", borderRadius: 14,
              background: tab === t.v ? `${C.green}18` : C.raised,
              border: `1.5px solid ${tab === t.v ? C.green + "50" : C.border}`,
              color: tab === t.v ? C.green : C.muted,
              cursor: "pointer", textAlign: "left", transition: "all .15s",
            }}>
              <div className="font-display" style={{ fontSize: 12, fontWeight: 800 }}>{t.l}</div>
              <div style={{ fontSize: 9, color: tab === t.v ? C.green + "99" : C.dim, marginTop: 2 }}>{t.sub}</div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 90 }}>

        {/* PRIZE BANNER — monthly only */}
        {tab === "monthly" && (
          <div style={{
            margin: "14px 18px 0",
            background: "linear-gradient(135deg, #0B1A0C, #0B0E16)",
            border: `1px solid ${C.green}25`,
            borderRadius: 16, padding: "12px 16px",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div>
              <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, textTransform: "uppercase" }}>March 2026 · Prize Season</div>
              <div className="font-display" style={{ fontSize: 22, fontWeight: 900, color: C.green }}>Rp 2.000.000</div>
              <div style={{ fontSize: 10, color: C.muted }}>🥇 Rp 1jt &nbsp;·&nbsp; 🥈 Rp 600k &nbsp;·&nbsp; 🥉 Rp 400k</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 10, color: C.muted }}>ends in</div>
              <div className="font-display" style={{ fontSize: 32, color: "#FF4444", lineHeight: 1 }}>9D</div>
            </div>
          </div>
        )}

        {/* LOADING */}
        {loading && (
          <div style={{ textAlign: "center", padding: "48px 0", color: C.muted, fontSize: 12 }}>
            Loading rankings...
          </div>
        )}

        {/* PODIUM — top 3 */}
        {!loading && top3.length >= 3 && (
          <div style={{ padding: "20px 18px 0" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 16 }}>
              {podiumOrder.map((player, i) => {
                if (!player) return <div key={i} style={{ flex: 1 }} />;
                const div = getDivision(player.lifetime_xp);
                const val = tab === "monthly" ? player.monthly_pts : player.lifetime_xp;
                const isPrime = podiumRank[i] === 1;
                return (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    style={{ flex: 1, textAlign: "center" }}
                  >
                    <div style={{
                      background: isPrime
                        ? `linear-gradient(160deg, #0D1E14, #0B1218)`
                        : C.card,
                      border: `1.5px solid ${isPrime ? C.green + "50" : div.color + "30"}`,
                      borderRadius: 16,
                      padding: isPrime ? "20px 8px 14px" : "14px 8px 10px",
                      position: "relative",
                    }}>
                      {isPrime && (
                        <div style={{
                          position: "absolute", top: -11, left: "50%",
                          transform: "translateX(-50%)",
                          background: C.green, color: "#0A0C11",
                          fontSize: 8, fontWeight: 900, padding: "2px 8px",
                          borderRadius: 20, whiteSpace: "nowrap", letterSpacing: 0.5,
                        }}>LEADER</div>
                      )}
                      <div style={{ fontSize: isPrime ? 26 : 20, marginBottom: 6 }}>{podiumEmoji[i]}</div>
                      <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>
                        <Av initials={player.avatar} size={isPrime ? 50 : 38} color={div.color} glow={isPrime} />
                      </div>
                      <div style={{ fontSize: isPrime ? 12 : 11, fontWeight: 700, marginBottom: 2 }}>
                        {player.name.split(" ")[0]}
                      </div>
                      <div className="font-display" style={{ fontSize: isPrime ? 20 : 15, fontWeight: 900, color: div.color }}>
                        {val.toLocaleString()}
                      </div>
                      <div style={{ fontSize: 9, color: C.muted }}>{tab === "monthly" ? "pts" : "XP"}</div>
                      <div style={{ marginTop: 4 }}>
                        <Tag label={div.label} color={div.color} />
                      </div>
                    </div>
                    {/* Podium base */}
                    <div style={{
                      height: podiumHeight[i], marginTop: 0,
                      background: isPrime
                        ? `linear-gradient(180deg, ${C.green}25, ${C.green}10)`
                        : `linear-gradient(180deg, ${C.raised}, ${C.border}40)`,
                      border: `1px solid ${isPrime ? C.green + "30" : C.border}`,
                      borderTop: "none", borderRadius: "0 0 8px 8px",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <div className="font-display" style={{
                        fontSize: 28, fontWeight: 900,
                        color: isPrime ? C.green : C.dim, opacity: 0.4,
                      }}>
                        {podiumRank[i]}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* FULL LIST — 4th onwards */}
        {!loading && (
          <div style={{ padding: "0 18px" }}>
            {/* Section label */}
            {rest.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "4px 0 10px" }}>
                <div style={{ flex: 1, height: 1, background: C.border }} />
                <span style={{ fontSize: 10, color: C.dim, fontWeight: 700, letterSpacing: 1 }}>FULL STANDINGS</span>
                <div style={{ flex: 1, height: 1, background: C.border }} />
              </div>
            )}

            {rest.map((player, i) => {
              const rank = i + 4;
              const div  = getDivision(player.lifetime_xp);
              const val  = tab === "monthly" ? player.monthly_pts : player.lifetime_xp;
              return (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 14px", borderRadius: 14, marginBottom: 6,
                    background: C.card, border: `1px solid ${C.border}`,
                  }}
                >
                  <div className="font-display" style={{
                    width: 26, textAlign: "center", fontSize: 16,
                    fontWeight: 900, color: C.dim, flexShrink: 0,
                  }}>{rank}</div>
                  <Av initials={player.avatar} size={36} color={div.color} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{player.name}</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <Tag label={div.label} color={div.color} />
                      {player.streak >= 3 && <Tag label={`🔥 ${player.streak}`} color="#FF8C00" />}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div className="font-display" style={{ fontSize: 18, fontWeight: 900, color: C.muted }}>
                      {val.toLocaleString()}
                    </div>
                    <div style={{ fontSize: 9, color: C.dim }}>{tab === "monthly" ? "pts" : "XP"}</div>
                  </div>
                </motion.div>
              );
            })}

            {/* Empty state */}
            {!loading && list.length === 0 && (
              <div style={{ textAlign: "center", padding: "48px 0" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🎾</div>
                <div className="font-display" style={{ fontSize: 18, fontWeight: 800, color: C.muted, marginBottom: 6 }}>
                  No rankings yet
                </div>
                <div style={{ fontSize: 12, color: C.dim, lineHeight: 1.6 }}>
                  Rankings appear once the first<br />match is approved by staff.
                </div>
              </div>
            )}

            {/* Bottom CTA */}
            {list.length > 0 && (
              <div style={{
                margin: "16px 0 8px",
                background: C.card, border: `1px solid ${C.border}`,
                borderRadius: 14, padding: "14px 16px", textAlign: "center",
              }}>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>
                  Rankings update live when matches are approved by staff
                </div>
                <button onClick={() => navigate("/")} style={{
                  background: `${C.green}18`, border: `1px solid ${C.green}40`,
                  color: C.green, padding: "8px 20px", borderRadius: 20,
                  fontFamily: "'Barlow Condensed'", fontSize: 13, fontWeight: 800,
                  cursor: "pointer",
                }}>
                  VIEW LIVE SESSIONS →
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* BOTTOM NAV */}
      <div style={{
        display: "flex", borderTop: `1px solid ${C.border}`,
        flexShrink: 0, background: C.bg, position: "sticky", bottom: 0,
      }}>
        {[
          { icon: "🏠", label: "Home",    action: () => navigate("/")      },
          { icon: "🏆", label: "Rankings",action: () => {},                  active: true },
          { icon: "🎾", label: "Sessions",action: () => navigate("/")      },
        ].map((t, i) => (
          <button key={i} onClick={t.action} style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", gap: 2, background: "none", border: "none",
            padding: "8px 0 14px", cursor: "pointer",
          }}>
            <span style={{ fontSize: 18, opacity: t.active ? 1 : 0.4 }}>{t.icon}</span>
            <span className="font-display" style={{
              fontSize: 9, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase",
              color: t.active ? C.green : C.dim,
            }}>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
