import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { type Match, idr, MATCHES, LEADERBOARD } from "@/data/constants";
import { Avatar, LiveDot, SportTag, SupportBar, SectionHead } from "./UIElements";
import { container, item } from "./MotionVariants";
import Odometer from "./Odometer";

interface HomeProps {
  onPick: (m: Match) => void;
}

export default function HomeScreen({ onPick }: HomeProps) {
  const [pool, setPool] = useState(2450000);

  useEffect(() => {
    const iv = setInterval(() => setPool(p => p + Math.floor(Math.random() * 6000) + 1000), 2800);
    return () => clearInterval(iv);
  }, []);

  const live = MATCHES.filter(m => m.status === "live");
  const up = MATCHES.filter(m => m.status === "upcoming");

  return (
    <motion.div
      className="px-5 pt-5 pb-24 overflow-y-auto h-full no-scrollbar"
      style={{ boxSizing: "border-box" }}
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Header */}
      <motion.div variants={item} className="flex justify-between items-center mb-6">
        <div>
          <div className="font-display text-[30px] font-black tracking-tight leading-none">
            <span className="text-green">FAN</span>PRIZE
          </div>
          <div className="text-label text-[11px] -mt-0.5">Public Support Platform</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-card border border-subtle rounded-[20px] px-3 py-1.5 text-[12px] text-green font-semibold flex items-center gap-1.5">
            🪙 5,680
          </div>
          <Avatar s="TR" size={34} />
        </div>
      </motion.div>

      {/* Live Hero */}
      {live.map(m => (
        <motion.div
          key={m.id}
          variants={item}
          onClick={() => onPick(m)}
          className="gradient-card border border-subtle rounded-[20px] p-[18px] mb-5 relative overflow-hidden cursor-pointer"
        >
          <div className="absolute -top-[50px] -right-[50px] w-[180px] h-[180px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, hsl(145 100% 45% / 0.07) 0%, transparent 70%)" }} />

          <div className="flex justify-between items-center mb-3.5">
            <LiveDot />
            <SportTag sport={m.pA.sport} />
          </div>
          <div className="text-label text-[11px] mb-2.5">{m.title}</div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <Avatar s={m.pA.av} size={46} />
              <div>
                <div className="font-display text-[17px] font-extrabold">{m.pA.name.split(" ")[0]}</div>
                <div className="text-label text-[10px]">{m.pA.tier}</div>
              </div>
            </div>

            <div className="bg-accent rounded-xl px-2 py-3.5 text-center">
              <div className="font-display text-[34px] font-black leading-none tracking-tight">
                <span className="text-green">{m.sA}</span>
                <span className="text-muted-foreground text-[24px] mx-0.5">:</span>
                <span className="text-blue">{m.sB}</span>
              </div>
              <div className="text-label text-[9px] mt-0.5">SET SCORE</div>
            </div>

            <div className="flex items-center gap-2.5 flex-row-reverse">
              <Avatar s={m.pB.av} size={46} color="hsl(var(--blue))" />
              <div className="text-right">
                <div className="font-display text-[17px] font-extrabold">{m.pB.name.split(" ")[0]}</div>
                <div className="text-label text-[10px]">{m.pB.tier}</div>
              </div>
            </div>
          </div>

          {/* Prize Pool with Odometer */}
          <div className="bg-accent rounded-lg p-3 text-center mb-3">
            <div className="text-label text-[10px] uppercase tracking-widest mb-0.5">Prize Pool</div>
            <div className="font-display text-[28px] font-black text-green leading-tight">
              <Odometer value={pool} />
            </div>
            <div className="text-label text-[10px]">{m.fans} supporters · 90% to winner</div>
          </div>

          <SupportBar a={m.supA} b={m.supB} />

          <button className="w-full mt-3 gradient-green rounded-xl py-3 font-display text-[16px] font-extrabold text-background tracking-wider uppercase">
            SUPPORT NOW — EARN POINTS
          </button>
        </motion.div>
      ))}

      {/* Upcoming */}
      <motion.div variants={item}>
        <SectionHead title="UPCOMING" />
      </motion.div>
      {up.map(m => (
        <motion.div
          key={m.id}
          variants={item}
          onClick={() => onPick(m)}
          className="bg-card border border-subtle rounded-lg p-3.5 mb-2 flex items-center gap-3 cursor-pointer hover:bg-accent transition-colors"
        >
          <div className="flex-1">
            <div className="flex items-center gap-1.5 mb-1">
              <SportTag sport={m.pA.sport} />
              <span className="text-label text-[10px]">{m.title}</span>
            </div>
            <div className="font-display text-[16px] font-bold">
              {m.pA.name.split(" ")[0]} <span className="text-muted-foreground">vs</span> {m.pB.name.split(" ")[0]}
            </div>
          </div>
          <div className="text-right">
            <div className="font-display text-[15px] font-bold text-green">{idr(m.pool)}</div>
            <div className="text-label text-[10px]">{m.fans} supporters</div>
          </div>
          <span className="text-muted-foreground text-lg">›</span>
        </motion.div>
      ))}

      {/* Leaderboard */}
      <motion.div variants={item} className="mt-5">
        <SectionHead title="TOP SUPPORTERS" />
      </motion.div>
      {LEADERBOARD.slice(0, 3).map(u => (
        <motion.div key={u.rank} variants={item} className="bg-card border border-subtle rounded-lg px-3.5 py-3 mb-1.5 flex items-center gap-3">
          <span className="text-[22px] w-8 text-center">{u.badge}</span>
          <div className="flex-1">
            <div className="font-semibold text-[14px]">{u.user}</div>
            <div className="text-label text-[10px]">{u.sup} supports</div>
          </div>
          <div className="font-display text-[16px] font-bold text-green">{u.pts.toLocaleString()} SP</div>
        </motion.div>
      ))}
    </motion.div>
  );
}
