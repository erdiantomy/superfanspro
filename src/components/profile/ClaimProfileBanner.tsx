import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { C } from "@/components/arena";
import ClaimProfileModal from "./ClaimProfileModal";

const DISMISS_KEY = "claim-banner-dismissed";

export default function ClaimProfileBanner() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(DISMISS_KEY);
    if (stored) {
      const ts = parseInt(stored, 10);
      if (Date.now() - ts < 7 * 24 * 60 * 60 * 1000) setDismissed(true);
    }
  }, []);

  // Get player record
  const { data: player } = useQuery({
    queryKey: ["my-player", user?.id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("padel_players")
        .select("id, name, avatar")
        .eq("user_id", user!.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  // Check existing profile
  const { data: existingProfile } = useQuery({
    queryKey: ["my-profile", player?.id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("player_profiles")
        .select("slug")
        .eq("player_id", player!.id)
        .single();
      return data;
    },
    enabled: !!player,
  });

  const handleDismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setDismissed(true);
  }, []);

  if (!user || !player || existingProfile || dismissed) return null;

  return (
    <>
      <div style={{
        background: `linear-gradient(90deg, ${C.green}15, transparent)`,
        borderLeft: `3px solid ${C.green}`,
        borderRadius: 10,
        padding: "12px 14px",
        marginBottom: 12,
        display: "flex",
        alignItems: "center",
        gap: 12,
        position: "relative",
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.fg, marginBottom: 2 }}>
            Claim your Superfans page
          </div>
          <div style={{ fontSize: 11, color: C.muted }}>
            Get superfans.games/yourname and start receiving support from fans
          </div>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          style={{
            background: C.green,
            border: "none",
            color: "#0D0D0D",
            padding: "8px 14px",
            borderRadius: 8,
            fontFamily: "'Barlow Condensed'",
            fontSize: 12,
            fontWeight: 800,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Claim Now →
        </button>
        <button
          onClick={handleDismiss}
          style={{
            position: "absolute",
            top: 6,
            right: 6,
            background: "none",
            border: "none",
            color: C.dim,
            fontSize: 14,
            cursor: "pointer",
            padding: 2,
            lineHeight: 1,
          }}
        >
          ✕
        </button>
      </div>

      <ClaimProfileModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        player={player}
      />
    </>
  );
}
