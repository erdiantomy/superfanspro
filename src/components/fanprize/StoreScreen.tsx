import { useState } from "react";
import { motion } from "framer-motion";
import { REWARDS, typeEmoji } from "@/data/constants";
import { SectionHead } from "./UIElements";
import { container, item } from "./MotionVariants";

export default function StoreScreen() {
  const [cat, setCat] = useState("all");
  const cats = ["all", "voucher", "sports", "experience", "merch"];
  const list = cat === "all" ? REWARDS : REWARDS.filter(r => r.type === cat);

  return (
    <motion.div
      className="px-5 pt-5 pb-24 overflow-y-auto h-full no-scrollbar"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={item}>
        <SectionHead title="REWARD STORE" size={26} mb={4} />
        <div className="text-[12px] text-label mb-3.5">
          Balance: <span className="text-green font-semibold">5,680 SP</span>
        </div>
      </motion.div>

      {/* Category filter */}
      <motion.div variants={item} className="flex gap-1.5 mb-4 overflow-x-auto no-scrollbar pb-0.5">
        {cats.map(c => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className="rounded-full px-3.5 py-2 text-[11px] font-semibold capitalize whitespace-nowrap cursor-pointer transition-all"
            style={{
              backgroundColor: cat === c ? "hsl(var(--green) / 0.1)" : "hsl(var(--muted))",
              border: `1px solid ${cat === c ? "hsl(var(--green) / 0.4)" : "transparent"}`,
              color: cat === c ? "hsl(var(--green))" : "hsl(var(--label-text))",
            }}
          >
            {c}
          </button>
        ))}
      </motion.div>

      {/* Reward Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {list.map(r => (
          <motion.div key={r.id} variants={item} className="bg-card border border-subtle rounded-2xl p-3.5 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl" style={{ backgroundColor: r.color }} />
            <div className="text-[24px] mb-2">{typeEmoji[r.type] || "🎁"}</div>
            <div className="font-semibold text-[13px] mb-0.5">{r.title}</div>
            <div className="font-display text-[17px] font-black mb-1" style={{ color: r.color }}>{r.value}</div>
            <div className="text-label text-[10px] mb-2.5">Stock: {r.stock}</div>
            <button
              className="w-full rounded-lg py-2 font-display text-[13px] font-bold cursor-pointer"
              style={{ backgroundColor: `${r.color}18`, border: `1px solid ${r.color}40`, color: r.color }}
            >
              🪙 {r.points.toLocaleString()} SP
            </button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
