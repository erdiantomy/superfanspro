import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Sequence, staticFile, Img } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import { loadFont } from "@remotion/google-fonts/BarlowCondensed";
import { loadFont as loadDM } from "@remotion/google-fonts/DMSans";

const { fontFamily: display } = loadFont("normal", { weights: ["600", "700", "800", "900"], subsets: ["latin"] });
const { fontFamily: body } = loadDM("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin"] });

const GREEN = "#00E676";
const BG_DARK = "#0A0E14";

// ─── Phone Frame ───
const PhoneFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame, fps, config: { damping: 20, stiffness: 100 } });
  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{
        width: 390, height: 844,
        borderRadius: 44,
        background: "#111",
        border: "3px solid #333",
        boxShadow: "0 40px 100px rgba(0,0,0,0.6), 0 0 60px rgba(0,230,118,0.08)",
        overflow: "hidden",
        transform: `scale(${interpolate(scale, [0, 1], [0.85, 1])})`,
        opacity,
        position: "relative",
      }}>
        {/* Notch */}
        <div style={{
          position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
          width: 160, height: 34, background: "#000", borderRadius: "0 0 20px 20px", zIndex: 50,
        }} />
        {/* Screen content */}
        <div style={{ width: "100%", height: "100%", overflow: "hidden", position: "relative" }}>
          {children}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Screen 1: Venue Landing ───
const VenueLanding: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sessions = [
    { title: "Tuesday Night Padel", format: "Americano", players: "6/8", status: "live", time: "Now" },
    { title: "Morning Session", format: "Mexicano", players: "4/6", status: "upcoming", time: "Tomorrow 9AM" },
    { title: "Weekend Tournament", format: "Americano", players: "12/16", status: "upcoming", time: "Sat 2PM" },
  ];

  return (
    <div style={{ background: "#fff", width: "100%", height: "100%", fontFamily: body }}>
      {/* Status bar */}
      <div style={{ height: 50, background: "#fff" }} />
      
      {/* Header */}
      <div style={{ padding: "8px 20px 16px", borderBottom: "1px solid #f0f0f0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: display, fontSize: 22, fontWeight: 900, letterSpacing: 1, color: "#111" }}>
              TOM'S PADEL
            </div>
            <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>📍 Jakarta, Indonesia</div>
          </div>
          <div style={{
            background: GREEN, borderRadius: 8, padding: "6px 14px",
            fontSize: 11, fontWeight: 700, color: "#111",
          }}>
            Sign In
          </div>
        </div>
      </div>

      {/* Prize banner */}
      <Sequence from={15}>
        <div style={{
          margin: "12px 16px", padding: "14px 16px", borderRadius: 14,
          background: "linear-gradient(135deg, #111 0%, #1a1a2e 100%)",
          opacity: interpolate(frame - 15, [0, 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          transform: `translateY(${interpolate(spring({ frame: frame - 15, fps, config: { damping: 20 } }), [0, 1], [20, 0])}px)`,
        }}>
          <div style={{ fontSize: 10, color: GREEN, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>🏆 Monthly Prize Pool</div>
          <div style={{ fontFamily: display, fontSize: 28, fontWeight: 900, color: "#fff", marginTop: 4 }}>
            Rp 2,000,000
          </div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>Top 3 players split: 50% · 30% · 20%</div>
        </div>
      </Sequence>

      {/* Sessions */}
      <div style={{ padding: "8px 16px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#333", marginBottom: 10 }}>Sessions</div>
        {sessions.map((s, i) => {
          const delay = 30 + i * 10;
          const sOpacity = interpolate(frame - delay, [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const sY = interpolate(spring({ frame: frame - delay, fps, config: { damping: 20 } }), [0, 1], [15, 0]);
          return (
            <div key={i} style={{
              padding: "12px 14px", borderRadius: 12, border: "1px solid #eee",
              marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center",
              opacity: sOpacity, transform: `translateY(${sY}px)`,
              background: s.status === "live" ? `${GREEN}08` : "#fff",
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>{s.title}</div>
                <div style={{ fontSize: 10, color: "#999", marginTop: 2 }}>{s.format} · {s.players} players</div>
              </div>
              <div style={{ textAlign: "right" }}>
                {s.status === "live" ? (
                  <div style={{ fontSize: 10, fontWeight: 700, color: GREEN, background: `${GREEN}15`, padding: "3px 8px", borderRadius: 6 }}>● LIVE</div>
                ) : (
                  <div style={{ fontSize: 10, color: "#999" }}>{s.time}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Leaderboard preview */}
      <Sequence from={55}>
        <div style={{
          padding: "8px 16px",
          opacity: interpolate(frame - 55, [0, 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#333", marginBottom: 8 }}>🏆 Top Players</div>
          {["AceKing · 2,450 XP", "PadelPro · 1,820 XP", "SmashHero · 1,650 XP"].map((p, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid #f5f5f5",
              opacity: interpolate(frame - 60 - i * 6, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            }}>
              <div style={{
                width: 24, height: 24, borderRadius: "50%", background: i === 0 ? `${GREEN}20` : "#f5f5f5",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800,
                color: i === 0 ? GREEN : "#999",
              }}>{i + 1}</div>
              <div style={{ fontSize: 12, color: "#333", fontWeight: 500 }}>{p}</div>
            </div>
          ))}
        </div>
      </Sequence>
    </div>
  );
};

// ─── Screen 2: Live Session ───
const LiveSession: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const players = [
    { name: "AceKing", xp: 2450, wins: 3, losses: 0, avatar: "🟢" },
    { name: "PadelPro", xp: 1820, wins: 2, losses: 1, avatar: "🔵" },
    { name: "SmashHero", xp: 1650, wins: 2, losses: 1, avatar: "🟡" },
    { name: "NetNinja", xp: 1200, wins: 1, losses: 2, avatar: "🟠" },
    { name: "CourtKing", xp: 980, wins: 1, losses: 2, avatar: "🔴" },
    { name: "RallyMax", xp: 750, wins: 0, losses: 3, avatar: "⚪" },
  ];

  return (
    <div style={{ background: "#fff", width: "100%", height: "100%", fontFamily: body }}>
      <div style={{ height: 50 }} />
      
      {/* Session header */}
      <div style={{ padding: "8px 20px 12px", borderBottom: "1px solid #f0f0f0" }}>
        <div style={{ fontSize: 10, color: GREEN, fontWeight: 700, letterSpacing: 1 }}>● LIVE SESSION</div>
        <div style={{ fontFamily: display, fontSize: 20, fontWeight: 800, color: "#111", marginTop: 2 }}>Tuesday Night Padel</div>
        <div style={{ fontSize: 11, color: "#999" }}>Americano · Round 3 of 5 · Court 1-2</div>
      </div>

      {/* Live match */}
      <Sequence from={10}>
        <div style={{
          margin: "12px 16px", padding: "14px", borderRadius: 14,
          background: `linear-gradient(135deg, ${GREEN}08, ${GREEN}03)`,
          border: `1px solid ${GREEN}20`,
          opacity: interpolate(frame - 10, [0, 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: GREEN, marginBottom: 8 }}>NOW PLAYING · Court 1</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 18 }}>🟢</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#111", marginTop: 2 }}>AceKing</div>
              <div style={{ fontSize: 10, color: "#999" }}>& PadelPro</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: display, fontSize: 32, fontWeight: 900, color: "#111" }}>
                {Math.round(interpolate(frame - 10, [20, 50], [0, 6], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }))}
                <span style={{ color: "#ccc", margin: "0 6px" }}>-</span>
                {Math.round(interpolate(frame - 10, [20, 50], [0, 4], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }))}
              </div>
              <div style={{ fontSize: 9, color: "#999" }}>Set 1</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 18 }}>🟡</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#111", marginTop: 2 }}>SmashHero</div>
              <div style={{ fontSize: 10, color: "#999" }}>& NetNinja</div>
            </div>
          </div>
        </div>
      </Sequence>

      {/* Session leaderboard */}
      <div style={{ padding: "4px 16px" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#333", marginBottom: 6 }}>Session Rankings</div>
        {players.map((p, i) => {
          const delay = 25 + i * 6;
          const rowOpacity = interpolate(frame - delay, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          // Animate XP counting
          const animXP = Math.round(interpolate(frame - delay, [5, 30], [0, p.xp], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
          return (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 8, padding: "7px 10px",
              borderRadius: 10, marginBottom: 3, opacity: rowOpacity,
              background: i === 0 ? `${GREEN}08` : "transparent",
            }}>
              <div style={{ width: 18, fontSize: 12, fontWeight: 800, color: i < 3 ? GREEN : "#bbb", textAlign: "center" }}>{i + 1}</div>
              <div style={{ fontSize: 14 }}>{p.avatar}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#111" }}>{p.name}</div>
                <div style={{ fontSize: 9, color: "#999" }}>W{p.wins} L{p.losses}</div>
              </div>
              <div style={{ fontFamily: display, fontSize: 14, fontWeight: 800, color: i === 0 ? GREEN : "#555" }}>
                {animXP.toLocaleString()} XP
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Screen 3: Leaderboard & Divisions ───
const LeaderboardScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const divisions = [
    { name: "Diamond", icon: "💎", color: "#60D5FF", min: "3000+" },
    { name: "Platinum", icon: "⚪", color: "#B8A9FF", min: "2400" },
    { name: "Gold", icon: "🥇", color: "#FFD166", min: "1600" },
    { name: "Silver", icon: "🥈", color: "#C0C0C0", min: "900" },
    { name: "Bronze", icon: "🥉", color: "#CD7F32", min: "0" },
  ];

  const rankings = [
    { name: "AceKing", xp: 3250, div: "Diamond", divColor: "#60D5FF" },
    { name: "PadelPro", xp: 2680, div: "Platinum", divColor: "#B8A9FF" },
    { name: "SmashHero", xp: 1950, div: "Gold", divColor: "#FFD166" },
    { name: "NetNinja", xp: 1420, div: "Silver", divColor: "#C0C0C0" },
    { name: "CourtKing", xp: 980, div: "Silver", divColor: "#C0C0C0" },
    { name: "RallyMax", xp: 620, div: "Bronze", divColor: "#CD7F32" },
  ];

  return (
    <div style={{ background: "#fff", width: "100%", height: "100%", fontFamily: body }}>
      <div style={{ height: 50 }} />
      <div style={{ padding: "8px 20px 12px", borderBottom: "1px solid #f0f0f0" }}>
        <div style={{ fontFamily: display, fontSize: 20, fontWeight: 800, color: "#111" }}>🏆 Leaderboard</div>
        <div style={{ fontSize: 11, color: "#999" }}>Tom's Padel · January 2026</div>
      </div>

      {/* Divisions bar */}
      <Sequence from={8}>
        <div style={{
          display: "flex", gap: 6, padding: "10px 16px", overflowX: "hidden",
          opacity: interpolate(frame - 8, [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}>
          {divisions.map((d, i) => (
            <div key={i} style={{
              padding: "6px 10px", borderRadius: 10,
              background: `${d.color}12`, border: `1px solid ${d.color}30`,
              textAlign: "center", minWidth: 58,
              transform: `scale(${spring({ frame: frame - 10 - i * 4, fps, config: { damping: 14 } })})`,
            }}>
              <div style={{ fontSize: 14 }}>{d.icon}</div>
              <div style={{ fontSize: 8, fontWeight: 700, color: d.color }}>{d.name}</div>
            </div>
          ))}
        </div>
      </Sequence>

      {/* Rankings */}
      {rankings.map((r, i) => {
        const delay = 20 + i * 7;
        const rowOpacity = interpolate(frame - delay, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const xpAnim = Math.round(interpolate(frame - delay, [5, 35], [0, r.xp], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
        // XP bar
        const barWidth = interpolate(frame - delay, [10, 40], [0, (r.xp / 3500) * 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

        return (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 10, padding: "10px 16px",
            borderBottom: "1px solid #f8f8f8", opacity: rowOpacity,
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: "50%",
              background: i < 3 ? `${GREEN}15` : "#f5f5f5",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 800, color: i < 3 ? GREEN : "#bbb",
            }}>{i + 1}</div>
            <div style={{
              width: 30, height: 30, borderRadius: "50%",
              background: `${r.divColor}20`, border: `2px solid ${r.divColor}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: display, fontSize: 11, fontWeight: 800, color: r.divColor,
            }}>{r.name.slice(0, 2)}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>{r.name}</div>
                <div style={{ fontFamily: display, fontSize: 13, fontWeight: 800, color: i === 0 ? GREEN : "#555" }}>
                  {xpAnim.toLocaleString()} XP
                </div>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: "#f0f0f0", marginTop: 4 }}>
                <div style={{ height: "100%", borderRadius: 2, background: r.divColor, width: `${barWidth}%` }} />
              </div>
              <div style={{
                display: "inline-block", padding: "1px 6px", borderRadius: 4,
                background: `${r.divColor}12`, fontSize: 8, fontWeight: 700,
                color: r.divColor, marginTop: 3,
              }}>{r.div}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Screen 4: Support Economy ───
const SupportScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div style={{ background: "#fff", width: "100%", height: "100%", fontFamily: body }}>
      <div style={{ height: 50 }} />
      <div style={{ padding: "8px 20px 12px", borderBottom: "1px solid #f0f0f0" }}>
        <div style={{ fontFamily: display, fontSize: 20, fontWeight: 800, color: "#111" }}>🤝 Support Match</div>
        <div style={{ fontSize: 11, color: "#999" }}>Back a player. Win together.</div>
      </div>

      {/* Match card */}
      <Sequence from={8}>
        <div style={{
          margin: "12px 16px", padding: "16px", borderRadius: 16,
          background: "#f9f9f9", border: "1px solid #eee",
          opacity: interpolate(frame - 8, [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ textAlign: "center", flex: 1 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: `${GREEN}20`, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🟢</div>
              <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4 }}>AceKing</div>
              <div style={{ fontSize: 10, color: "#999" }}>Win rate: 72%</div>
              <div style={{ fontSize: 10, color: GREEN, fontWeight: 700, marginTop: 2 }}>💎 Diamond</div>
            </div>
            <div style={{ fontFamily: display, fontSize: 24, fontWeight: 900, color: "#ccc" }}>VS</div>
            <div style={{ textAlign: "center", flex: 1 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#FFD16620", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🟡</div>
              <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4 }}>SmashHero</div>
              <div style={{ fontSize: 10, color: "#999" }}>Win rate: 65%</div>
              <div style={{ fontSize: 10, color: "#FFD166", fontWeight: 700, marginTop: 2 }}>🥇 Gold</div>
            </div>
          </div>

          {/* Support bars - animated */}
          <div style={{ marginTop: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#999", marginBottom: 4 }}>
              <span>Support Pool</span>
              <span style={{ fontWeight: 700, color: "#333" }}>
                {Math.round(interpolate(frame - 20, [0, 30], [0, 250], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }))} Credits
              </span>
            </div>
            <div style={{ height: 8, borderRadius: 4, background: "#eee", display: "flex", overflow: "hidden" }}>
              <div style={{
                width: `${interpolate(frame - 20, [0, 30], [0, 60], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}%`,
                background: GREEN, borderRadius: "4px 0 0 4px",
              }} />
              <div style={{
                width: `${interpolate(frame - 20, [0, 30], [0, 40], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}%`,
                background: "#FFD166", borderRadius: "0 4px 4px 0",
              }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#999", marginTop: 3 }}>
              <span style={{ color: GREEN }}>150 Cr (3 fans)</span>
              <span style={{ color: "#FFD166" }}>100 Cr (2 fans)</span>
            </div>
          </div>
        </div>
      </Sequence>

      {/* Your support */}
      <Sequence from={40}>
        <div style={{
          margin: "0 16px", padding: "14px 16px", borderRadius: 14,
          background: `${GREEN}06`, border: `1px solid ${GREEN}15`,
          opacity: interpolate(frame - 40, [0, 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          transform: `translateY(${interpolate(spring({ frame: frame - 40, fps, config: { damping: 18 } }), [0, 1], [15, 0])}px)`,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: GREEN, marginBottom: 8 }}>✅ Your Support</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>50 Credits on AceKing</div>
              <div style={{ fontSize: 10, color: "#999" }}>Potential win: +23 Credits</div>
            </div>
            <div style={{ fontSize: 22 }}>🟢</div>
          </div>
        </div>
      </Sequence>

      {/* Payout breakdown */}
      <Sequence from={60}>
        <div style={{
          margin: "12px 16px", padding: "14px 16px", borderRadius: 14,
          background: "#f9f9f9", border: "1px solid #eee",
          opacity: interpolate(frame - 60, [0, 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#333", marginBottom: 8 }}>💡 If AceKing wins:</div>
          {[
            { label: "70% → Winning backers", amount: "70 Cr", color: GREEN },
            { label: "20% → Player bonus", amount: "20 Cr", color: "#3B82F6" },
            { label: "10% → Platform", amount: "10 Cr", color: "#999" },
          ].map((item, i) => (
            <div key={i} style={{
              display: "flex", justifyContent: "space-between", padding: "4px 0",
              borderBottom: i < 2 ? "1px solid #eee" : "none",
              opacity: interpolate(frame - 65 - i * 6, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            }}>
              <span style={{ fontSize: 11, color: "#555" }}>{item.label}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: item.color }}>{item.amount}</span>
            </div>
          ))}
        </div>
      </Sequence>
    </div>
  );
};

// ─── Screen 5: Wallet ───
const WalletScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const balance = Math.round(interpolate(frame, [10, 40], [0, 1250], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));

  const transactions = [
    { desc: "Support win: AceKing", amount: "+73", color: GREEN, icon: "🏆" },
    { desc: "Top-up via Xendit", amount: "+500", color: "#3B82F6", icon: "💳" },
    { desc: "Backed SmashHero", amount: "-50", color: "#e74c3c", icon: "🤝" },
    { desc: "Support win: PadelPro", amount: "+45", color: GREEN, icon: "🏆" },
    { desc: "Monthly bonus", amount: "+100", color: "#FF9800", icon: "🎁" },
  ];

  return (
    <div style={{ background: "#fff", width: "100%", height: "100%", fontFamily: body }}>
      <div style={{ height: 50 }} />
      <div style={{ padding: "8px 20px 16px" }}>
        <div style={{ fontFamily: display, fontSize: 20, fontWeight: 800, color: "#111" }}>💰 Wallet</div>
      </div>

      {/* Balance card */}
      <div style={{
        margin: "0 16px", padding: "20px", borderRadius: 16,
        background: "linear-gradient(135deg, #111 0%, #1a1a2e 100%)",
        opacity: interpolate(frame, [5, 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }}>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>Available Balance</div>
        <div style={{ fontFamily: display, fontSize: 36, fontWeight: 900, color: GREEN, marginTop: 4 }}>
          {balance.toLocaleString()} <span style={{ fontSize: 16, color: "rgba(255,255,255,0.4)" }}>Credits</span>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <div style={{ flex: 1, background: GREEN, borderRadius: 10, padding: "8px", textAlign: "center", fontSize: 12, fontWeight: 700, color: "#111" }}>Top Up</div>
          <div style={{ flex: 1, background: "rgba(255,255,255,0.1)", borderRadius: 10, padding: "8px", textAlign: "center", fontSize: 12, fontWeight: 600, color: "#fff" }}>History</div>
        </div>
      </div>

      {/* Transactions */}
      <div style={{ padding: "16px 16px 0" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#333", marginBottom: 8 }}>Recent Transactions</div>
        {transactions.map((t, i) => {
          const delay = 25 + i * 8;
          return (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 0",
              borderBottom: "1px solid #f5f5f5",
              opacity: interpolate(frame - delay, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
              transform: `translateX(${interpolate(spring({ frame: frame - delay, fps, config: { damping: 20 } }), [0, 1], [30, 0])}px)`,
            }}>
              <div style={{ fontSize: 18 }}>{t.icon}</div>
              <div style={{ flex: 1, fontSize: 12, fontWeight: 600, color: "#333" }}>{t.desc}</div>
              <div style={{ fontFamily: display, fontSize: 14, fontWeight: 800, color: t.color }}>{t.amount}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Main App Demo ───
const T = 25;

export const AppDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Subtle pulsing glow behind the phone
  const glowPulse = interpolate(Math.sin(frame * 0.04), [-1, 1], [0.15, 0.35]);
  const glowScale = interpolate(Math.sin(frame * 0.025), [-1, 1], [0.95, 1.08]);

  // Logo watermark fade in
  const logoOpacity = interpolate(frame, [0, 40], [0, 0.12], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill>
      {/* Background */}
      <AbsoluteFill style={{
        background: "linear-gradient(160deg, #07090D 0%, #0B0E16 40%, #0D1118 100%)",
      }} />

      {/* Glow effect behind phone */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", zIndex: 0 }}>
        <div style={{
          width: 500, height: 900, borderRadius: "50%",
          background: `radial-gradient(ellipse at center, rgba(0,230,118,${glowPulse}) 0%, rgba(0,230,118,0.05) 40%, transparent 70%)`,
          transform: `scale(${glowScale})`,
          filter: "blur(60px)",
        }} />
      </AbsoluteFill>

      {/* Secondary accent glow */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", zIndex: 0 }}>
        <div style={{
          width: 300, height: 600, borderRadius: "50%",
          background: `radial-gradient(ellipse at center, rgba(0,230,118,${glowPulse * 0.6}) 0%, transparent 60%)`,
          transform: `scale(${glowScale * 1.1}) translateY(-50px)`,
          filter: "blur(40px)",
        }} />
      </AbsoluteFill>

      {/* Logo watermark top-left */}
      <div style={{
        position: "absolute", top: 40, left: 50, zIndex: 20,
        opacity: logoOpacity,
      }}>
        <Img src={staticFile("superfans-logo.png")} style={{ height: 40 }} />
      </div>

      {/* Logo watermark bottom-right */}
      <div style={{
        position: "absolute", bottom: 40, right: 50, zIndex: 20,
        opacity: logoOpacity, display: "flex", alignItems: "center", gap: 8,
      }}>
        <Img src={staticFile("superfans-logo.png")} style={{ height: 32 }} />
        <span style={{ fontFamily: display, fontSize: 14, color: `rgba(0,230,118,${logoOpacity * 3})`, letterSpacing: 2, fontWeight: 700 }}>
          superfans.games
        </span>
      </div>

      {/* Floating label */}
      <Sequence from={20}>
        <AbsoluteFill style={{ zIndex: 10 }}>
          <FloatingLabel />
        </AbsoluteFill>
      </Sequence>

      {/* Phone with screens */}
      <PhoneFrame>
        <TransitionSeries>
          <TransitionSeries.Sequence durationInFrames={180}>
            <VenueLanding />
          </TransitionSeries.Sequence>
          <TransitionSeries.Transition
            presentation={slide({ direction: "from-right" })}
            timing={springTiming({ config: { damping: 200 }, durationInFrames: T })}
          />
          <TransitionSeries.Sequence durationInFrames={160}>
            <LiveSession />
          </TransitionSeries.Sequence>
          <TransitionSeries.Transition
            presentation={slide({ direction: "from-right" })}
            timing={springTiming({ config: { damping: 200 }, durationInFrames: T })}
          />
          <TransitionSeries.Sequence durationInFrames={160}>
            <LeaderboardScreen />
          </TransitionSeries.Sequence>
          <TransitionSeries.Transition
            presentation={slide({ direction: "from-right" })}
            timing={springTiming({ config: { damping: 200 }, durationInFrames: T })}
          />
          <TransitionSeries.Sequence durationInFrames={160}>
            <SupportScreen />
          </TransitionSeries.Sequence>
          <TransitionSeries.Transition
            presentation={slide({ direction: "from-right" })}
            timing={springTiming({ config: { damping: 200 }, durationInFrames: T })}
          />
          <TransitionSeries.Sequence durationInFrames={140}>
            <WalletScreen />
          </TransitionSeries.Sequence>
        </TransitionSeries>
      </PhoneFrame>
    </AbsoluteFill>
  );
};

// ─── Floating screen labels ───
const FloatingLabel: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const labels = [
    { text: "Venue Landing", start: 0, end: 155 },
    { text: "Live Session", start: 155, end: 290 },
    { text: "Leaderboard & Divisions", start: 290, end: 425 },
    { text: "Support Economy", start: 425, end: 560 },
    { text: "Wallet & Credits", start: 560, end: 680 },
  ];

  return (
    <>
      {labels.map((l, i) => {
        const adjustedFrame = frame - 20; // offset from Sequence
        const isActive = adjustedFrame >= l.start && adjustedFrame < l.end;
        if (!isActive) return null;
        const localFrame = adjustedFrame - l.start;
        const opacity = interpolate(localFrame, [0, 15, l.end - l.start - 15, l.end - l.start], [0, 1, 1, 0], { extrapolateRight: "clamp" });
        const y = interpolate(spring({ frame: localFrame, fps, config: { damping: 20 } }), [0, 1], [20, 0]);

        return (
          <div key={i} style={{
            position: "absolute", bottom: 80, left: "50%", transform: `translateX(-50%) translateY(${y}px)`,
            padding: "10px 28px", borderRadius: 50,
            background: "rgba(0,230,118,0.08)", border: "1px solid rgba(0,230,118,0.2)",
            fontFamily: display, fontSize: 18, fontWeight: 700, color: GREEN,
            letterSpacing: 2, opacity,
          }}>
            {l.text}
          </div>
        );
      })}
    </>
  );
};
