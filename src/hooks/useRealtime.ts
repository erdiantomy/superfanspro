import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ─────────────────────────────────────────────────────
// Supabase Realtime subscriptions
// Invalidates React Query caches on DB changes
// → All screens auto-refresh without manual polling
// ─────────────────────────────────────────────────────

export function useArenaRealtime() {
  const qc = useQueryClient();

  useEffect(() => {
    // Sessions channel — live/upcoming status changes
    const sessionsCh = supabase
      .channel("arena-sessions")
      .on("postgres_changes", { event: "*", schema: "public", table: "sessions" }, () => {
        qc.invalidateQueries({ queryKey: ["sessions"] });
        qc.invalidateQueries({ queryKey: ["session"] });
      })
      .subscribe();

    // Players channel — XP/pts/division updates after score approvals
    const playersCh = supabase
      .channel("arena-players")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "padel_players" }, () => {
        qc.invalidateQueries({ queryKey: ["leaderboard"] });
        qc.invalidateQueries({ queryKey: ["padel_player"] });
      })
      .subscribe();

    // Scores channel — new submissions + approval status changes
    const scoresCh = supabase
      .channel("arena-scores")
      .on("postgres_changes", { event: "*", schema: "public", table: "score_submissions" }, () => {
        qc.invalidateQueries({ queryKey: ["scores"] });
      })
      .subscribe();

    // Session players channel — join request approvals
    const spCh = supabase
      .channel("arena-session-players")
      .on("postgres_changes", { event: "*", schema: "public", table: "session_players" }, () => {
        qc.invalidateQueries({ queryKey: ["session_players"] });
      })
      .subscribe();

    // Supports channel — backing amounts update live
    const supportsCh = supabase
      .channel("arena-supports")
      .on("postgres_changes", { event: "*", schema: "public", table: "session_supports" }, () => {
        qc.invalidateQueries({ queryKey: ["supports"] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(sessionsCh);
      supabase.removeChannel(playersCh);
      supabase.removeChannel(scoresCh);
      supabase.removeChannel(spCh);
      supabase.removeChannel(supportsCh);
    };
  }, [qc]);
}

// Narrow subscription for a single session page
export function useSessionRealtime(sessionId: string | undefined) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!sessionId) return;

    const ch = supabase
      .channel(`session-${sessionId}`)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "session_players",
        filter: `session_id=eq.${sessionId}`,
      }, () => qc.invalidateQueries({ queryKey: ["session_players", sessionId] }))
      .on("postgres_changes", {
        event: "*", schema: "public", table: "score_submissions",
        filter: `session_id=eq.${sessionId}`,
      }, () => qc.invalidateQueries({ queryKey: ["scores", sessionId] }))
      .on("postgres_changes", {
        event: "*", schema: "public", table: "session_supports",
        filter: `session_id=eq.${sessionId}`,
      }, () => qc.invalidateQueries({ queryKey: ["supports", sessionId] }))
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [sessionId, qc]);
}
