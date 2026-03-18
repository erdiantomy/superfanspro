import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { type Match, type Player } from "@/hooks/useData";
import { idr } from "@/data/constants";
import { Avatar, LiveDot, SportTag, SupportBar, SectionHead } from "./UIElements";
import { container, item } from "./MotionVariants";
import Odometer from "./Odometer";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  m: Match;
  onBack: () => void;
  onSupport: (m: Match, p: Player) => void;
}

export default function MatchDetail({ m, onBack, onSupport }: Props) {
  const [pool, setPool] = useState(m.pool);
  const [fans, setFans] = useState(m.fans);
  const [scoreA, setScoreA] = useState(m.sA);
  const [scoreB, setScoreB] = useState(m.sB);
  const [supA, setSupA] = useState(m.supA);
  const [supB, setSupB] = useState(m.supB);
  const [status, setStatus] = useState(m.status);

  // Sync props when parent match changes
  useEffect(() => {
    setPool(m.pool); setFans(m.fans);
    setScoreA(m.sA); setScoreB(m.sB);
    setSupA(m.supA); setSupB(m.supB);
    setStatus(m.status);
  }, [m]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`match-${m.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "matches", filter: `id=eq.${m.id}` },
        (payload) => {
          const r = payload.new as any;
          setPool(r.pool);
          setFans(r.fans);
          setScoreA(r.score_a);
          setScoreB(r.score_b);
          setSupA(r.support_a);
          setSupB(r.support_b);
          setStatus(r.status);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [m.id]);

  const recent = [["AK", "#FF5252"], ["BR", "#2979FF"], ["CS", "#FF9800"], ["DN", "#9C27B0"], ["EF", "#00BCD4"]];

  return (
    <div className="h-full flex flex-col">
      {/* Topbar */}
      <div className="px-4 py-3 flex items-center gap-3 shrink-0">
        <button onClick={onBack} className="bg-card border border-subtle rounded-lg w-9 h-9 flex items-center justify-center text-foreground text-xl cursor-pointer">‹</button>
        <div className="flex-1">
          <div className="text-label text-[10px]">{m.title}</div>
          <div className="font-display text-[16px] font-bold">Match Detail</div>
        </div>
        {status === "live" && <LiveDot />}
        {status === "upcoming" && (
          <span className="bg-secondary/20 border border-secondary/40 rounded-full px-2.5 py-1 text-[10px] text-secondary font-bold">UPCOMING</span>
        )}
        {status === "finished" && (
          <span className="bg-destructive/20 border border-destructive/40 rounded-full px-2.5 py-1 text-[10px] text-destructive font-bold">FINISHED</span>
        )}
      </div>

      {/* Content */}
      <motion.div
        className="flex-1 overflow-y-auto px-4 pb-24 no-scrollbar"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* Players Card */}
        <motion.div variants={item} className="gradient-card border border-subtle rounded-[20px] p-[18px] mb-3.5">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex-1 text-center">
              <Avatar s={m.pA.av} size={58} />
              <div className="font-display text-[18px] font-black mt-2">{m.pA.name.split(" ")[0].toUpperCase()}</div>
              <div className="text-label text-[10px]">{m.pA.name.split(" ").slice(1).join(" ")}</div>
              <div className="text-green text-[10px] font-semibold mt-0.5">{m.pA.win}% WIN RATE</div>
            </div>

            <div className="text-center px-3">
              {status !== "upcoming" ? (
                <>
                  <div className="font-display text-[44px] font-black leading-none tracking-tight">
                    <span className="text-green">{scoreA}</span>
                    <span className="text-muted-foreground text-[30px] mx-1">:</span>
                    <span className="text-blue">{scoreB}</span>
                  </div>
                  <div className="text-label text-[9px] mt-0.5">SET SCORE</div>
                </>
              ) : (
                <div className="font-display text-[28px] font-black text-muted-foreground">VS</div>
              )}
            </div>

            <div className="flex-1 text-center">
              <Avatar s={m.pB.av} size={58} color="hsl(var(--blue))" />
              <div className="font-display text-[18px] font-black mt-2">{m.pB.name.split(" ")[0].toUpperCase()}</div>
              <div className="text-label text-[10px]">{m.pB.name.split(" ").slice(1).join(" ")}</div>
              <div className="text-blue text-[10px] font-semibold mt-0.5">{m.pB.win}% WIN RATE</div>
            </div>
          </div>

          <SupportBar a={supA} b={supB} />
        </motion.div>

        {/* Pool Info */}
        <motion.div variants={item} className="bg-accent rounded-lg p-4 mb-3.5">
          <div className="flex justify-between items-center mb-1">
            <span className="text-label text-[10px] uppercase tracking-wider">Total Prize Pool</span>
            <span className="text-label text-[10px]">Funded by {fans} supporters</span>
          </div>
          <div className="font-display text-[32px] font-black text-green leading-tight mb-2">
            <Odometer value={pool} />
          </div>
          <div className="flex justify-between text-[11px]">
            <div>
              <span className="text-label">Winner Gets</span>
              <span className="text-foreground font-semibold ml-2">{idr(Math.floor(pool * 0.9))}</span>
            </div>
            <div>
              <span className="text-label">Platform Fee</span>
              <span className="text-foreground font-semibold ml-2">{idr(Math.floor(pool * 0.1))}</span>
            </div>
          </div>
        </motion.div>

        {/* Recent Supporters */}
        <motion.div variants={item}>
          <SectionHead title="RECENT SUPPORTERS" />
          <div className="flex items-center gap-1.5 mb-1">
            {recent.map(([s, c]) => (
              <Avatar key={s} s={s} size={30} color={c} />
            ))}
            <span className="text-label text-[10px] ml-1">+{fans - 5} more</span>
          </div>
          <div className="text-label text-[11px] mb-4">Andi K. just supported {m.pA.name.split(" ")[0]} · 2m ago</div>
        </motion.div>

        {/* Support Buttons */}
        {m.status !== "finished" && (
          <motion.div variants={item}>
            <SectionHead title="SUPPORT A PLAYER" />
            <div className="grid grid-cols-2 gap-2.5 mb-4">
              {[m.pA, m.pB].map((p, i) => {
                const c = i === 0 ? "hsl(var(--green))" : "hsl(var(--blue))";
                return (
                  <button
                    key={p.id}
                    onClick={() => onSupport(m, p)}
                    className="flex items-center gap-2.5 p-3 rounded-lg border border-subtle bg-card cursor-pointer hover:bg-accent transition-colors"
                  >
                    <Avatar s={p.av} size={38} color={c} />
                    <div className="text-left">
                      <div className="text-[12px] font-semibold">Support {p.name.split(" ")[0]}</div>
                      <div className="text-label text-[10px]">Earn 100 SP if wins</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {m.status === "finished" && m.winner && (
          <motion.div variants={item} className="bg-accent rounded-lg p-4 text-center mb-4">
            <div className="text-[28px] mb-1">🏆</div>
            <div className="font-display text-[20px] font-black text-green">{m.winner.name} WINS!</div>
            <div className="text-label text-[12px]">Prize of {idr(Math.floor(m.pool * 0.9))} awarded</div>
          </motion.div>
        )}

        {/* Share */}
        <motion.div variants={item}>
          <SectionHead title="SHARE MATCH" />
          <div className="flex gap-2">
            {[["💬", "WhatsApp", "#25D366"], ["📸", "Instagram", "#E1306C"], ["🔗", "Copy Link", "#5A6374"]].map(([ic, lb, c]) => (
              <button key={lb} className="flex-1 rounded-lg py-2.5 px-3 text-[11px] font-semibold text-foreground cursor-pointer" style={{ backgroundColor: `${c}18`, border: `1px solid ${c}40` }}>
                {ic} {lb}
              </button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
