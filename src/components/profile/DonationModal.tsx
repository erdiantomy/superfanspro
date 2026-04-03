import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { C } from "@/components/arena";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  player: { id: string; name: string };
}

const PRESETS = [25_000, 50_000, 100_000, 250_000];

export default function DonationModal({ open, onClose, player }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [amount, setAmount] = useState<number>(50_000);
  const [customAmount, setCustomAmount] = useState("");
  const [message, setMessage] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!open) return null;

  const finalAmount = customAmount ? parseInt(customAmount) || 0 : amount;

  const handleSubmit = async () => {
    if (finalAmount < 10_000) {
      toast.error("Minimum donation is Rp 10,000");
      return;
    }
    setSubmitting(true);
    try {
      const donorName = isAnonymous
        ? "Anonymous"
        : user?.user_metadata?.name || user?.email?.split("@")[0] || "Anonymous";

      const { error } = await (supabase as any).from("donations").insert({
        player_id: player.id,
        donor_id: user?.id || null,
        donor_name: donorName,
        amount: finalAmount,
        message: message.trim().slice(0, 200),
        is_anonymous: isAnonymous,
        status: "paid", // For demo; production would use Xendit webhook
      });

      if (error) throw error;

      setSuccess(true);
      qc.invalidateQueries({ queryKey: ["player-donations", player.id] });
      qc.invalidateQueries({ queryKey: ["player-profile-full", player.id] });
      toast.success("Donation sent! 🎉");
    } catch (err: any) {
      toast.error(err.message || "Failed to send donation");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSuccess(false);
    setAmount(50_000);
    setCustomAmount("");
    setMessage("");
    setIsAnonymous(false);
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 999, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={handleClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)" }} />
      <div style={{ position: "relative", width: "100%", maxWidth: 420, background: C.card, borderRadius: "20px 20px 0 0", border: `1px solid ${C.border}`, padding: "20px 20px 32px", maxHeight: "85vh", overflowY: "auto" }}>
        {/* Handle */}
        <div style={{ width: 40, height: 4, borderRadius: 2, background: C.dim, margin: "0 auto 16px" }} />

        {success ? (
          /* Success state */
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>🎉</div>
            <div className="font-display" style={{ fontSize: 22, fontWeight: 900, marginBottom: 6 }}>You're a Superfan!</div>
            <div style={{ fontSize: 14, color: C.muted, marginBottom: 20 }}>
              You supported {player.name} with Rp {finalAmount.toLocaleString("id-ID")}
            </div>
            <button onClick={handleClose} style={{ padding: "12px 32px", borderRadius: 12, background: C.green, border: "none", color: "#0D0D0D", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>Done</button>
          </div>
        ) : (
          <>
            <div className="font-display" style={{ fontSize: 18, fontWeight: 900, marginBottom: 4 }}>Support {player.name}</div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 20 }}>Choose an amount to show your support</div>

            {/* Preset amounts */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
              {PRESETS.map((p) => (
                <button
                  key={p}
                  onClick={() => { setAmount(p); setCustomAmount(""); }}
                  style={{
                    padding: "12px 0",
                    borderRadius: 12,
                    background: amount === p && !customAmount ? `${C.green}20` : C.raised,
                    border: `1.5px solid ${amount === p && !customAmount ? C.green : C.border}`,
                    color: amount === p && !customAmount ? C.green : C.fg,
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: "pointer",
                    fontFamily: "'Barlow Condensed'",
                  }}
                >
                  Rp {p.toLocaleString("id-ID")}
                </button>
              ))}
            </div>

            {/* Custom amount */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Custom amount (IDR)</div>
              <input
                type="number"
                placeholder="e.g. 75000"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, background: C.raised, border: `1px solid ${C.border}`, color: C.fg, fontSize: 14, outline: "none" }}
              />
            </div>

            {/* Message */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: C.muted }}>Message (optional)</span>
                <span style={{ fontSize: 10, color: C.dim }}>{message.length}/200</span>
              </div>
              <textarea
                placeholder="Write a message..."
                maxLength={200}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, background: C.raised, border: `1px solid ${C.border}`, color: C.fg, fontSize: 13, outline: "none", resize: "none", minHeight: 60 }}
              />
            </div>

            {/* Anonymous toggle */}
            <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                style={{ accentColor: C.green }}
              />
              <span style={{ fontSize: 12, color: C.muted }}>Send anonymously</span>
            </label>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={submitting || finalAmount < 10_000}
              style={{
                width: "100%",
                padding: 14,
                borderRadius: 14,
                background: finalAmount >= 10_000 ? C.green : C.dim,
                border: "none",
                color: "#0D0D0D",
                fontFamily: "'Barlow Condensed'",
                fontSize: 16,
                fontWeight: 900,
                cursor: finalAmount >= 10_000 ? "pointer" : "not-allowed",
                opacity: submitting ? 0.6 : 1,
              }}
            >
              {submitting ? "Processing..." : `Support · Rp ${finalAmount.toLocaleString("id-ID")}`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
