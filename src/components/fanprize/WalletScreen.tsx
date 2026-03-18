import { useState } from "react";
import { motion } from "framer-motion";
import { TRANSACTIONS, txIcon } from "@/data/constants";
import { SectionHead } from "./UIElements";
import { container, item } from "./MotionVariants";

export default function WalletScreen() {
  const [tab, setTab] = useState<"txs" | "rewards">("txs");

  return (
    <motion.div
      className="px-5 pt-5 pb-24 overflow-y-auto h-full no-scrollbar"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={item}>
        <SectionHead title="WALLET" size={26} mb={20} />
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-2 gap-2.5 mb-[18px]">
        <div className="gradient-card border border-subtle rounded-2xl p-4">
          <div className="text-label text-[10px] mb-1">IDR BALANCE</div>
          <div className="font-display text-[22px] font-black">Rp 125.000</div>
          <button className="mt-2 w-full bg-green/10 border border-green/40 rounded-lg py-1.5 text-[11px] text-green font-semibold cursor-pointer">Top Up</button>
        </div>
        <div className="gradient-card border border-subtle rounded-2xl p-4">
          <div className="text-label text-[10px] mb-1">SUPPORT POINTS</div>
          <div className="font-display text-[22px] font-black text-green">5,680 SP</div>
          <button className="mt-2 w-full bg-secondary/10 border border-secondary/40 rounded-lg py-1.5 text-[11px] text-secondary font-semibold cursor-pointer">Redeem</button>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={item} className="flex gap-2 mb-4">
        {(["txs", "rewards"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 rounded-full py-2.5 text-[12px] font-bold uppercase tracking-wide cursor-pointer transition-all"
            style={{
              backgroundColor: tab === t ? "hsl(var(--green) / 0.1)" : "hsl(var(--muted))",
              border: `1px solid ${tab === t ? "hsl(var(--green) / 0.4)" : "transparent"}`,
              color: tab === t ? "hsl(var(--green))" : "hsl(var(--label-text))",
            }}
          >
            {t === "txs" ? "Transactions" : "Rewards History"}
          </button>
        ))}
      </motion.div>

      {tab === "txs" && TRANSACTIONS.map(tx => (
        <motion.div key={tx.id} variants={item} className="bg-card border border-subtle rounded-lg px-3.5 py-3 mb-1.5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-[16px]">
            {txIcon[tx.type] || "↑"}
          </div>
          <div className="flex-1">
            <div className="text-[13px] font-medium">{tx.desc}</div>
            <div className="text-label text-[10px]">{tx.time}</div>
          </div>
          <div className="text-right">
            {tx.sp && <div className="font-display text-[14px] font-bold text-green">{tx.sp}</div>}
            {tx.idr !== "Rp 0" && <div className="text-label text-[10px]">{tx.idr}</div>}
          </div>
        </motion.div>
      ))}

      {tab === "rewards" && (
        <motion.div variants={item} className="text-center py-10">
          <div className="text-[32px] mb-2">🏆</div>
          <div className="text-foreground font-display text-[16px] font-bold mb-1">No redemptions yet</div>
          <div className="text-label text-[12px]">Earn points by supporting matches!</div>
        </motion.div>
      )}
    </motion.div>
  );
}
