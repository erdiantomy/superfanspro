import { type Match } from "@/data/constants";
import { idr } from "@/data/constants";
import { Avatar, SportTag, SupportBar, SectionHead } from "./UIElements";

interface Props {
  m: Match;
  onBack: () => void;
}

const CONFETTI_COLORS = ["#00E676", "#2979FF", "#FF5252", "#FF9800", "#9C27B0", "#00BCD4", "#FFD600"];

function Confetti() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {Array.from({ length: 14 }).map((_, i) => {
        const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
        const left = `${5 + Math.random() * 90}%`;
        const delay = `${Math.random() * 2}s`;
        const duration = `${2.5 + Math.random() * 2}s`;
        const size = 6 + Math.random() * 6;
        const isCircle = i % 3 === 0;
        return (
          <div
            key={i}
            className="absolute top-0 animate-confetti-fall"
            style={{
              left,
              animationDelay: delay,
              animationDuration: duration,
              width: size,
              height: size,
              backgroundColor: color,
              borderRadius: isCircle ? "50%" : "2px",
              opacity: 0.85,
            }}
          />
        );
      })}
    </div>
  );
}

export default function MatchResultScreen({ m, onBack }: Props) {
  const winner = m.winner!;
  const loser = winner.id === m.pA.id ? m.pB : m.pA;
  const winnerPayout = Math.floor(m.pool * 0.9);
  const platformFee = Math.floor(m.pool * 0.1);

  // Simulate user backed the winner
  const userBackedWinner = true;
  const userPointsChange = userBackedWinner ? "+150 SP" : "-50 SP";

  return (
    <div className="h-full flex flex-col relative">
      <Confetti />

      {/* Topbar */}
      <div className="px-4 py-3 flex items-center gap-3 shrink-0 z-10">
        <button onClick={onBack} className="bg-card border border-subtle rounded-lg w-9 h-9 flex items-center justify-center text-foreground text-xl cursor-pointer">‹</button>
        <div className="flex-1">
          <div className="text-label text-[10px]">{m.title}</div>
          <div className="font-display text-[16px] font-bold">Match Results</div>
        </div>
        <span className="bg-destructive/20 border border-destructive/40 rounded-full px-2.5 py-1 text-[10px] text-destructive font-bold">FINISHED</span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-24 no-scrollbar z-10">
        {/* Winner Celebration */}
        <div className="flex flex-col items-center pt-2 pb-5 relative">
          {/* Trophy */}
          <div className="text-[48px] animate-trophy-bounce mb-2">🏆</div>

          {/* Winner Avatar with glow */}
          <div className="relative mb-3">
            <div className="absolute inset-0 rounded-full animate-gold-glow" style={{ background: "radial-gradient(circle, hsla(45, 100%, 60%, 0.4) 0%, transparent 70%)", transform: "scale(1.8)" }} />
            <Avatar s={winner.av} size={72} color="hsl(var(--green))" />
          </div>

          {/* Winner badge */}
          <span className="gradient-green text-primary-foreground font-display text-[11px] font-bold px-4 py-1 rounded-full tracking-widest mb-2">
            🏆 WINNER
          </span>
          <div className="font-display text-[28px] font-black text-green leading-tight">{winner.name.toUpperCase()}</div>
          <div className="text-label text-[11px] mt-0.5">{winner.sport} · {winner.tier}</div>
        </div>

        {/* Final Score */}
        <div className="gradient-card border border-subtle rounded-[20px] p-[18px] mb-3.5">
          <div className="text-center mb-3">
            <div className="text-label text-[10px] uppercase tracking-wider mb-1">Final Score</div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex-1 text-center">
              <Avatar s={m.pA.av} size={44} color={m.pA.id === winner.id ? "hsl(var(--green))" : "hsl(var(--blue))"} />
              <div className="font-display text-[14px] font-bold mt-1.5">{m.pA.name.split(" ")[0].toUpperCase()}</div>
            </div>
            <div className="text-center px-4">
              <div className="font-display text-[44px] font-black leading-none tracking-tight">
                <span className={m.pA.id === winner.id ? "text-green" : "text-muted-foreground"}>{m.sA}</span>
                <span className="text-muted-foreground text-[30px] mx-1">:</span>
                <span className={m.pB.id === winner.id ? "text-green" : "text-muted-foreground"}>{m.sB}</span>
              </div>
            </div>
            <div className="flex-1 text-center">
              <Avatar s={m.pB.av} size={44} color={m.pB.id === winner.id ? "hsl(var(--green))" : "hsl(var(--blue))"} />
              <div className="font-display text-[14px] font-bold mt-1.5">{m.pB.name.split(" ")[0].toUpperCase()}</div>
            </div>
          </div>
          <div className="mt-3">
            <SupportBar a={m.supA} b={m.supB} />
          </div>
        </div>

        {/* Payout Breakdown */}
        <SectionHead title="PAYOUT BREAKDOWN" />
        <div className="bg-accent rounded-lg p-4 mb-3.5 space-y-3">
          {[
            { label: "Total Prize Pool", value: idr(m.pool), delay: "0ms" },
            { label: "Winner Payout (90%)", value: idr(winnerPayout), delay: "100ms", highlight: true },
            { label: "Platform Fee (10%)", value: idr(platformFee), delay: "200ms" },
            { label: "Total Supporters", value: `${m.fans} fans`, delay: "300ms" },
          ].map(({ label, value, delay, highlight }) => (
            <div
              key={label}
              className="flex justify-between items-center animate-fade-in-up"
              style={{ animationDelay: delay, animationFillMode: "both" }}
            >
              <span className="text-label text-[11px]">{label}</span>
              <span className={`text-[13px] font-semibold ${highlight ? "text-green" : "text-foreground"}`}>{value}</span>
            </div>
          ))}
        </div>

        {/* Your Support Outcome */}
        <SectionHead title="YOUR SUPPORT" />
        <div className={`rounded-lg p-4 mb-4 border ${userBackedWinner ? "bg-green/10 border-green/30" : "bg-destructive/10 border-destructive/30"}`}>
          <div className="flex items-center gap-3">
            <div className="text-[28px]">{userBackedWinner ? "🎉" : "😔"}</div>
            <div>
              <div className="text-[13px] font-semibold">
                {userBackedWinner ? "You backed the winner!" : "Better luck next time"}
              </div>
              <div className="text-label text-[11px]">
                You supported {winner.name.split(" ")[0]} with Rp 50.000
              </div>
              <div className={`text-[12px] font-bold mt-0.5 ${userBackedWinner ? "text-green" : "text-destructive"}`}>
                {userPointsChange}
              </div>
            </div>
          </div>
        </div>

        {/* Share Results */}
        <SectionHead title="SHARE RESULTS" />
        <div className="flex gap-2">
          {[["💬", "WhatsApp", "#25D366"], ["📸", "Instagram", "#E1306C"], ["🔗", "Copy Link", "#5A6374"]].map(([ic, lb, c]) => (
            <button key={lb} className="flex-1 rounded-lg py-2.5 px-3 text-[11px] font-semibold text-foreground cursor-pointer" style={{ backgroundColor: `${c}18`, border: `1px solid ${c}40` }}>
              {ic} {lb}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
