import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Loader2, ChevronLeft, Zap, Star, Crown, Gem } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price_idr: number;
  bonus_pct: number;
  is_active: boolean;
  sort_order: number;
}

function fmtRp(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

function fmtCr(n: number) {
  return n.toLocaleString("id-ID");
}

const ICONS: Record<string, typeof Zap> = {
  Starter: Zap,
  Regular: Star,
  Pro: Crown,
  Elite: Gem,
};

const PAYMENT_METHODS = ["GoPay", "OVO", "DANA", "ShopeePay", "QRIS"];

export default function TopUpPage() {
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const [processing, setProcessing] = useState<string | null>(null);

  // Fetch player credits
  const { data: player } = useQuery({
    queryKey: ["padel_player", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await (supabase.from as any)("padel_players")
        .select("credits")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data as { credits: number } | null;
    },
  });

  // Fetch packages
  const { data: packages = [], isLoading } = useQuery({
    queryKey: ["credit_packages"],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)("credit_packages")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as CreditPackage[];
    },
  });

  const handleBuy = async (pkg: CreditPackage) => {
    if (!session?.access_token) {
      toast.error("Please sign in to purchase credits");
      navigate("/auth");
      return;
    }

    setProcessing(pkg.id);
    try {
      const res = await supabase.functions.invoke("create-payment", {
        body: { package_id: pkg.id },
      });

      if (res.error) throw new Error(res.error.message);
      const data = res.data as { success: boolean; invoice_url: string; error?: string };
      if (!data.success) throw new Error(data.error || "Payment failed");

      // Redirect to Xendit checkout
      window.location.href = data.invoice_url;
    } catch (err: any) {
      toast.error(err.message || "Failed to create payment");
      setProcessing(null);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center gap-4 p-6">
        <div className="text-4xl">🔒</div>
        <h1 className="text-lg font-bold">Sign in to Top Up</h1>
        <p className="text-sm text-muted-foreground text-center">You need to be signed in to purchase credits.</p>
        <button onClick={() => navigate("/auth")} className="mt-4 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold text-sm">
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground max-w-md mx-auto">
      {/* Header */}
      <div className="border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-base font-bold" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>TOP UP CREDITS</h1>
        </div>
        {player && (
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Balance</div>
            <div className="text-sm font-bold text-primary">Cr {fmtCr(player.credits)}</div>
          </div>
        )}
      </div>

      <div className="p-4 pb-24">
        <p className="text-xs text-muted-foreground mb-4">Select a credit package to support players in live sessions.</p>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {packages.map((pkg, i) => {
              const Icon = ICONS[pkg.name] || Zap;
              const isMostPopular = pkg.name === "Pro";
              const isProcessing = processing === pkg.id;
              const worthValue = pkg.credits;

              return (
                <motion.button
                  key={pkg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => !processing && handleBuy(pkg)}
                  disabled={!!processing}
                  className="relative text-left w-full"
                  style={{
                    background: isMostPopular
                      ? "linear-gradient(135deg, hsl(145 100% 45% / 0.1), hsl(145 100% 45% / 0.05))"
                      : "hsl(var(--card))",
                    border: isMostPopular
                      ? "2px solid hsl(145 100% 45% / 0.5)"
                      : "1px solid hsl(var(--border))",
                    borderRadius: 16,
                    padding: "14px 16px",
                    cursor: processing ? "wait" : "pointer",
                    opacity: processing && !isProcessing ? 0.5 : 1,
                  }}
                >
                  {isMostPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-0.5 rounded-full tracking-wider">
                      MOST POPULAR
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        background: isMostPopular
                          ? "hsl(145 100% 45% / 0.2)"
                          : "hsl(var(--muted))",
                      }}
                    >
                      <Icon size={20} className={isMostPopular ? "text-primary" : "text-muted-foreground"} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">{pkg.name}</span>
                        {pkg.bonus_pct > 0 && (
                          <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                            +{pkg.bonus_pct}% BONUS
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {fmtCr(pkg.credits)} Credits
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {isProcessing ? (
                        <Loader2 size={18} className="animate-spin text-primary" />
                      ) : (
                        <>
                          <div className="text-sm font-bold">{fmtRp(pkg.price_idr)}</div>
                          {pkg.bonus_pct > 0 && (
                            <div className="text-[10px] text-muted-foreground line-through">
                              {fmtRp(pkg.credits)}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}

        {/* Payment methods */}
        <div className="mt-6 text-center">
          <div className="text-[10px] text-muted-foreground tracking-widest uppercase mb-3">Accepted Payment Methods</div>
          <div className="flex justify-center gap-3 flex-wrap">
            {PAYMENT_METHODS.map(m => (
              <div key={m} className="bg-card border border-border rounded-lg px-3 py-1.5 text-[11px] font-medium text-muted-foreground">
                {m}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 bg-card border border-border rounded-xl p-3 text-center">
          <p className="text-[11px] text-muted-foreground">
            💡 Credits are added instantly after payment. All payments are processed securely via Xendit.
          </p>
        </div>
      </div>
    </div>
  );
}
