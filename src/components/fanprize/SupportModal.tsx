import { useState } from "react";
import { motion } from "framer-motion";
import { type Match, type Player } from "@/hooks/useData";
import { idr } from "@/data/constants";
import { Avatar } from "./UIElements";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface Props {
  m: Match;
  p: Player;
  onClose: () => void;
  onConfirm: (amt: number) => void;
}

export default function SupportModal({ m, p, onClose, onConfirm }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [amt, setAmt] = useState(25000);
  const [custom, setCustom] = useState("");
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const c = p.id === m.pA.id ? "hsl(var(--green))" : "hsl(var(--blue))";
  const AMTS = [10000, 25000, 50000, 100000];
  const side = p.id === m.pA.id ? "a" : "b";
  const pointsEarned = Math.max(10, Math.floor(amt / 1000));

  const confirm = async () => {
    if (!user || submitting || amt <= 0) return;
    setSubmitting(true);
    try {
      const { error: supErr } = await supabase.from("supports").insert({
        user_id: user.id,
        match_id: m.id,
        player: side,
        amount: amt,
        points_earned: pointsEarned,
      });
      if (supErr) throw supErr;

      const { error: txErr } = await supabase.from("wallet_transactions").insert({
        user_id: user.id,
        type: "support" as const,
        description: `Supported ${p.name} – ${m.title}`,
        idr_amount: amt,
        sp_amount: pointsEarned,
      });
      if (txErr) throw txErr;

      qc.invalidateQueries({ queryKey: ["matches"] });
      qc.invalidateQueries({ queryKey: ["wallet_transactions"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      setDone(true);
      setTimeout(() => onConfirm(amt), 2200);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit support");
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-background/75 flex items-end z-50"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="w-full bg-card rounded-t-[22px] p-5 pb-10"
        onClick={e => e.stopPropagation()}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {!done ? (
          <>
            <div className="w-[34px] h-1 rounded-full bg-muted mx-auto mb-[18px]" />
            <div className="flex items-center gap-3 mb-5">
              <Avatar s={p.av} size={46} color={c} />
              <div>
                <div className="font-display text-[20px] font-bold">Support {p.name}</div>
                <div className="text-label text-[12px]">{m.title}</div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-3">
              {AMTS.map(a => (
                <motion.button
                  key={a}
                  onClick={() => { setAmt(a); setCustom(""); }}
                  whileTap={{ scale: 0.92 }}
                  className="rounded-xl p-3.5 font-display text-[17px] font-bold cursor-pointer transition-all"
                  style={{
                    backgroundColor: amt === a ? `${c}22` : "hsl(var(--muted))",
                    border: `1px solid ${amt === a ? c + "50" : "transparent"}`,
                    color: amt === a ? c : "hsl(var(--foreground))",
                  }}
                >
                  Rp {a / 1000}k
                </motion.button>
              ))}
            </div>

            <input
              placeholder="Custom amount (Rp)"
              value={custom}
              onChange={e => { setCustom(e.target.value); setAmt(parseInt(e.target.value) || 0); }}
              className="w-full bg-muted border border-subtle rounded-xl px-3.5 py-3 text-foreground text-[14px] mb-3 outline-none focus:border-ring transition-colors"
            />

            <div className="bg-accent rounded-lg px-3 py-2.5 mb-4 text-center">
              <span className="text-label text-[12px]">You'll earn </span>
              <span className="text-green font-display font-bold text-[14px]">+{pointsEarned} Support Points 🪙</span>
            </div>

            <div className="flex gap-2.5">
              <motion.button whileTap={{ scale: 0.95 }} onClick={onClose} className="flex-1 bg-muted rounded-xl py-3.5 font-display text-[15px] font-bold text-foreground cursor-pointer">Cancel</motion.button>
              <motion.button whileTap={{ scale: 0.95 }} onClick={confirm} className="flex-[2] rounded-xl py-3.5 font-display text-[15px] font-bold cursor-pointer text-background" style={{ background: `linear-gradient(135deg, ${c}, ${c}dd)` }}>
                CONFIRM {idr(amt)}
              </motion.button>
            </div>
          </>
        ) : (
          <motion.div
            className="text-center py-6"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <div className="text-[56px] mb-3">🎉</div>
            <div className="font-display text-[28px] font-black text-green mb-1.5">SUPPORT SENT!</div>
            <div className="text-muted-foreground text-[13px] mb-3.5">You are now part of this match</div>
            <div className="inline-block bg-green/10 border border-green/40 rounded-xl px-5 py-2.5">
              <span className="font-display text-[22px] font-extrabold text-green">+100 SP Earned 🪙</span>
            </div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
