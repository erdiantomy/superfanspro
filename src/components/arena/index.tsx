// ─────────────────────────────────────────────────────
// ARENA UI ATOMS
// Shared primitives used across all arena pages
// Design tokens match existing SuperFansPro system
// ─────────────────────────────────────────────────────
import React, { useState, useEffect } from "react";
import { getDivision, getDivisionKey } from "@/lib/gamification";
import type { PadelPlayer } from "@/hooks/useArena";

// ─── DESIGN TOKENS ───────────────────────────────────
export const C = {
  bg:     "hsl(var(--background))",
  card:   "hsl(var(--card))",
  raised: "hsl(var(--accent))",
  border: "hsl(var(--border))",
  green:  "hsl(var(--green))",
  blue:   "hsl(var(--blue))",
  orange: "#FF8C00",
  red:    "#FF4444",
  purple: "hsl(var(--secondary))",
  gold:   "#FFD166",
  dim:    "#3A4560",
  muted:  "hsl(var(--muted-foreground))",
  fg:     "hsl(var(--foreground))",
};

// ─── AVATAR ───────────────────────────────────────────
interface AvProps {
  initials: string;
  size?: number;
  color?: string;
  glow?: boolean;
  style?: React.CSSProperties;
}
export function Av({ initials, size = 36, color = C.green, glow = false, style }: AvProps) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: `linear-gradient(135deg,${color}35,${color}10)`,
      border: `1.5px solid ${color}35`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 800, fontSize: size * 0.32, color,
      fontFamily: "'Barlow Condensed', sans-serif",
      boxShadow: glow ? `0 0 14px ${color}30` : "none",
      ...style,
    }}>{initials}</div>
  );
}

// ─── PLAYER AVATAR (from padel_players row) ───────────
export function PlayerAv({ player, size = 36, glow = false }: { player: PadelPlayer; size?: number; glow?: boolean }) {
  const div = getDivision(player.lifetime_xp);
  return <Av initials={player.avatar} size={size} color={div.color} glow={glow} />;
}

// ─── TAG / CHIP ───────────────────────────────────────
export function Tag({ label, color = C.green, dot = false }: { label: string; color?: string; dot?: boolean }) {
  return (
    <span style={{
      background: `${color}18`, color, border: `1px solid ${color}28`,
      padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700,
      letterSpacing: 0.4, whiteSpace: "nowrap",
      display: "inline-flex", alignItems: "center", gap: 4,
    }}>
      {dot && <span style={{ width: 5, height: 5, borderRadius: "50%", background: color, animation: "pulse 1.4s infinite" }} />}
      {label}
    </span>
  );
}

// ─── DIVISION TAG ─────────────────────────────────────
export function DivTag({ xp, size = "sm" }: { xp: number; size?: "sm" | "md" }) {
  const div = getDivision(xp);
  return <Tag label={div.label} color={div.color} />;
}

// ─── STATUS TAG ───────────────────────────────────────
const STATUS_MAP: Record<string, { label: string; color: string; dot: boolean }> = {
  pending_approval: { label: "Pending Admin",  color: "#FF8C00", dot: true  },
  active:           { label: "Active",         color: "#00E676", dot: false },
  live:             { label: "Live",           color: "#00E676", dot: true  },
  finished:         { label: "Finished",       color: "#7A8AAA", dot: false },
  rejected:         { label: "Rejected",       color: "#FF4444", dot: false },
};
export function StatusTag({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? STATUS_MAP.pending_approval;
  return <Tag label={s.label} color={s.color} dot={s.dot} />;
}

// ─── CARD ROW ─────────────────────────────────────────
export function Row({ children, style = {}, onClick }: {
  children: React.ReactNode; style?: React.CSSProperties; onClick?: () => void;
}) {
  return (
    <div onClick={onClick} style={{
      background: C.card, border: `1px solid ${C.border}`,
      borderRadius: 14, padding: "12px 14px", marginBottom: 8,
      cursor: onClick ? "pointer" : "default", ...style,
    }}>{children}</div>
  );
}

// ─── DIVIDER ──────────────────────────────────────────
export function Divider({ label }: { label?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "10px 0 8px" }}>
      <div style={{ flex: 1, height: 1, background: C.border }} />
      {label && <span style={{ fontSize: 10, color: C.dim, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", whiteSpace: "nowrap" }}>{label}</span>}
      <div style={{ flex: 1, height: 1, background: C.border }} />
    </div>
  );
}

// ─── XP PROGRESS BAR ─────────────────────────────────
export function XpBar({ xp, height = 4 }: { xp: number; height?: number }) {
  const div = getDivision(xp);
  const pct = div.next ? Math.min(((xp - div.min) / (div.next - div.min)) * 100, 100) : 100;
  return (
    <div style={{ height, background: C.border, borderRadius: height, flex: 1, overflow: "hidden" }}>
      <div style={{ height, width: `${pct}%`, background: div.color, borderRadius: height, transition: "width .5s ease" }} />
    </div>
  );
}

// ─── COUNTDOWN ────────────────────────────────────────
export function useCountdown(targetMs: number) {
  const [left, setLeft] = useState(Math.max(0, targetMs - Date.now()));
  useEffect(() => {
    if (left <= 0) return;
    const iv = setInterval(() => setLeft(t => Math.max(0, t - 1000)), 1000);
    return () => clearInterval(iv);
  }, [left]);
  const s = Math.floor(left / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  const p = (n: number) => String(n).padStart(2, "0");
  return { left, expired: left <= 0, label: h > 0 ? `${h}h ${p(m)}m ${p(sec)}s` : `${p(m)}m ${p(sec)}s`, urgent: left < 30 * 60 * 1000 };
}

export function CountdownBadge({ startTime, compact = false }: { startTime: string | null; compact?: boolean }) {
  const ms = startTime ? new Date(startTime).getTime() : 0;
  const cd = useCountdown(ms);
  if (!startTime || cd.expired) return <Tag label="🔒 Support closed" color={C.dim} />;
  if (compact) return <Tag label={`⏱ ${cd.label}`} color={cd.urgent ? C.red : C.orange} dot />;
  return (
    <div style={{ background: cd.urgent ? `${C.red}12` : `${C.orange}12`, border: `1px solid ${cd.urgent ? C.red : C.orange}30`, borderRadius: 12, padding: "10px 14px" }}>
      <div style={{ fontSize: 10, color: cd.urgent ? C.red : C.orange, fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>{cd.urgent ? "⚠️ Closes soon" : "⏱ Support window open"}</div>
      <div className="font-display" style={{ fontSize: 26, fontWeight: 900, color: cd.urgent ? C.red : C.orange, letterSpacing: 2, lineHeight: 1 }}>{cd.label}</div>
      <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>Closes at match start · No support after lock</div>
    </div>
  );
}

// ─── SYNC TOAST ───────────────────────────────────────
export interface SyncEvent { id: number; title: string; desc: string; }
export function SyncToast({ events }: { events: SyncEvent[] }) {
  if (!events.length) return null;
  return (
    <div style={{ position: "fixed", top: 60, left: "50%", transform: "translateX(-50%)", zIndex: 400, maxWidth: 340, width: "90%", pointerEvents: "none" }}>
      {events.slice(-1).map(e => (
        <div key={e.id} style={{ background: "#0D1E14", border: `1px solid ${C.green}50`, borderRadius: 12, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, animation: "slideUp .3s ease", boxShadow: `0 4px 24px ${C.green}20` }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.green, flexShrink: 0, animation: "pulse 1s infinite" }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.green }}>{e.title}</div>
            <div style={{ fontSize: 10, color: C.muted }}>{e.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── MATCH CARD (2v2) ─────────────────────────────────
interface MatchCardProps {
  court: number;
  tA: [PadelPlayer, PadelPlayer];
  tB: [PadelPlayer, PadelPlayer];
  scoreA?: string;
  scoreB?: string;
  done?: boolean;
  isLive?: boolean;
}
export function MatchCard({ court, tA, tB, scoreA, scoreB, done = false, isLive = false }: MatchCardProps) {
  const cA = getDivision(tA[0].lifetime_xp).color;
  const cB = getDivision(tB[0].lifetime_xp).color;
  const numA = parseInt(scoreA || "0") || 0, numB = parseInt(scoreB || "0") || 0;
  const aWin = done && numA > numB, bWin = done && numB > numA;
  return (
    <div style={{ background: isLive ? "linear-gradient(135deg,#0D1E14,#0A0C11)" : C.raised, border: `1px solid ${isLive ? C.green + "30" : C.border}`, borderRadius: 12, padding: "10px 12px", marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 10, color: C.dim, fontWeight: 700, letterSpacing: 1 }}>COURT {court}</span>
        {isLive && !done && <div style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 6, height: 6, borderRadius: "50%", background: C.green, animation: "pulse 1.4s infinite" }} /><span style={{ fontSize: 10, color: C.green, fontWeight: 700 }}>LIVE</span></div>}
        {done && <Tag label="DONE ✓" color={C.muted} />}
      </div>
      {/* Team A */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
        <div style={{ display: "flex" }}><Av initials={tA[0].avatar} size={26} color={cA} /><Av initials={tA[1].avatar} size={26} color={cA} style={{ marginLeft: -6 }} /></div>
        <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: aWin ? C.fg : done ? C.muted : C.fg }}>{tA[0].name.split(" ")[0]} + {tA[1].name.split(" ")[0]}</span>
        {(isLive || done) && scoreA && <span className="font-display" style={{ fontSize: 22, fontWeight: 900, color: aWin ? C.green : done ? C.dim : C.fg }}>{scoreA}</span>}
      </div>
      <div style={{ textAlign: "center", fontSize: 10, color: C.dim, fontWeight: 700, marginBottom: 5 }}>VS</div>
      {/* Team B */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ display: "flex" }}><Av initials={tB[0].avatar} size={26} color={cB} /><Av initials={tB[1].avatar} size={26} color={cB} style={{ marginLeft: -6 }} /></div>
        <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: bWin ? C.fg : done ? C.muted : C.fg }}>{tB[0].name.split(" ")[0]} + {tB[1].name.split(" ")[0]}</span>
        {(isLive || done) && scoreB && <span className="font-display" style={{ fontSize: 22, fontWeight: 900, color: bWin ? C.blue : done ? C.dim : C.fg }}>{scoreB}</span>}
      </div>
    </div>
  );
}

// ─── FORMAT / PARTNER HELPERS ─────────────────────────
export const fmtLabel = (f: string) => f === "americano" ? "🔄 Americano" : "📊 Mexicano";
export const ptLabel  = (t: string) => t === "random"    ? "🎲 Random"    : "🤝 Fixed";
export const shareUrl = (code: string) => `${window.location.host}/session/${code}`;
export const fmtTs    = (ts: string) => {
  const d = new Date(ts);
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" }) + " · " + d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
};
