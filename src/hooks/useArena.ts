import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { calcXP } from "@/lib/gamification";

// ─── TYPES ────────────────────────────────────────────
export interface PadelPlayer {
  id: string;
  user_id: string;
  name: string;
  avatar: string;
  email: string;
  lifetime_xp: number;
  monthly_pts: number;
  wins: number;
  losses: number;
  streak: number;
  credits: number;
  division: string;
}

export interface Session {
  id: string;
  code: string;
  name: string;
  format: "americano" | "mexicano";
  partner_type: "random" | "fixed";
  courts: number;
  total_rounds: number;
  current_round: number;
  status: "pending_approval" | "active" | "live" | "finished" | "rejected";
  host_id: string;
  max_players: number;
  locked: boolean;
  scheduled_at: string | null;
  admin_note: string | null;
  approved_at: string | null;
  created_at: string;
  host?: PadelPlayer;
}

export interface SessionPlayer {
  id: string;
  session_id: string;
  player_id: string;
  role: "host" | "player";
  status: "pending" | "approved" | "declined";
  joined_at: string | null;
  created_at: string;
  player?: PadelPlayer;
}

export interface ScoreSubmission {
  id: string;
  session_id: string;
  court: number;
  round: number;
  team_a_p1: string;
  team_a_p2: string;
  team_b_p1: string;
  team_b_p2: string;
  score_a: string;
  score_b: string;
  winner_team: "a" | "b" | null;
  reported_by: string;
  session_rank_winners: number;
  session_rank_losers: number;
  status: "pending" | "approved" | "rejected";
  xp_credited: boolean;
  created_at: string;
}

export interface SessionSupport {
  id: string;
  session_id: string;
  supporter_id: string;
  backed_id: string;
  amount: number;
  payout: number | null;
  resolved: boolean;
}

// ─── ENSURE PLAYER EXISTS ─────────────────────────────
// Called after Google sign-in to guarantee padel_players row exists
export async function ensurePadelPlayer(user: {
  id: string; email?: string;
  user_metadata?: { full_name?: string; name?: string; avatar_url?: string };
}): Promise<PadelPlayer | null> {
  const name  = user.user_metadata?.full_name
    || user.user_metadata?.name
    || user.email?.split("@")[0]
    || "Player";
  const email = user.email || "";
  const words = name.trim().split(" ");
  const avatar = ((words[0]?.[0] || "P") + (words[1]?.[0] || words[0]?.[1] || "P")).toUpperCase();

  const { data, error } = await (supabase.rpc as any)("upsert_padel_player", {
    p_user_id: user.id,
    p_name:    name,
    p_email:   email,
    p_avatar:  avatar,
  });
  if (error) {
    console.error("ensurePadelPlayer:", error);
    return null;
  }
  return data as PadelPlayer;
}

// ─── PLAYER HOOKS ─────────────────────────────────────
export function useMonthlyLeaderboard() {
  return useQuery({
    queryKey: ["leaderboard", "monthly"],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)("padel_players")
        .select("*")
        .order("monthly_pts", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as PadelPlayer[];
    },
  });
}

export function useLifetimeLeaderboard() {
  return useQuery({
    queryKey: ["leaderboard", "lifetime"],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)("padel_players")
        .select("*")
        .order("lifetime_xp", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as PadelPlayer[];
    },
  });
}

export function usePadelPlayer(userId: string | undefined) {
  return useQuery({
    queryKey: ["padel_player", userId],
    enabled: !!userId,
    retry: 2,
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)("padel_players")
        .select("*")
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data as PadelPlayer | null;
    },
  });
}

// ─── SESSION HOOKS ────────────────────────────────────
export function useSessions(statusFilter?: string[]) {
  return useQuery({
    queryKey: ["sessions", statusFilter],
    queryFn: async () => {
      let q = (supabase.from as any)("sessions")
        .select("*, host:padel_players!sessions_host_id_fkey(*)");
      if (statusFilter?.length) q = q.in("status", statusFilter);
      const { data, error } = await q.order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Session[];
    },
  });
}

export function useSession(code: string | undefined) {
  return useQuery({
    queryKey: ["session", code],
    enabled: !!code,
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)("sessions")
        .select("*, host:padel_players!sessions_host_id_fkey(*)")
        .eq("code", code!)
        .maybeSingle();
      if (error) throw error;
      return data as Session | null;
    },
  });
}

export function useCreateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (session: {
      name: string; format: string; partner_type: string;
      courts: number; status: string; host_id: string;
      max_players: number; locked: boolean;
      scheduled_at: string; admin_note: null; approved_at: null;
    }) => {
      const { data, error } = await (supabase.from as any)("sessions")
        .insert({
          ...session,
          code: "",
          total_rounds: 7,
          current_round: 0,
          points_per_match: 32,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
  });
}

export function useUpdateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Session> }) => {
      const { data, error } = await (supabase.from as any)("sessions")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sessions"] });
      qc.invalidateQueries({ queryKey: ["session"] });
    },
  });
}

// ─── SESSION PLAYERS ──────────────────────────────────
export function useSessionPlayers(sessionId: string | undefined) {
  return useQuery({
    queryKey: ["session_players", sessionId],
    enabled: !!sessionId,
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)("session_players")
        .select("*, player:padel_players(*)")
        .eq("session_id", sessionId!);
      if (error) throw error;
      return (data ?? []) as SessionPlayer[];
    },
  });
}

export function useRequestJoin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ sessionId, playerId }: { sessionId: string; playerId: string }) => {
      const { data, error } = await (supabase.from as any)("session_players")
        .insert({ session_id: sessionId, player_id: playerId, role: "player", status: "pending" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, { sessionId }) =>
      qc.invalidateQueries({ queryKey: ["session_players", sessionId] }),
  });
}

export function useUpdatePlayerStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id, status, sessionId,
    }: { id: string; status: "approved" | "declined"; sessionId: string }) => {
      const { data, error } = await (supabase.from as any)("session_players")
        .update({ status, joined_at: status === "approved" ? new Date().toISOString() : null })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, { sessionId }) =>
      qc.invalidateQueries({ queryKey: ["session_players", sessionId] }),
  });
}

// ─── SCORES ───────────────────────────────────────────
export function useScoreSubmissions(sessionId?: string) {
  return useQuery({
    queryKey: ["scores", sessionId],
    queryFn: async () => {
      let q = (supabase.from as any)("score_submissions").select("*");
      if (sessionId) q = q.eq("session_id", sessionId);
      else q = q.neq("status", "approved");
      const { data, error } = await q.order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ScoreSubmission[];
    },
  });
}

export function useApproveScore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (scoreId: string) => {
      const { error } = await supabase.rpc("credit_xp_for_score", {
        submission_id: scoreId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["scores"] });
      qc.invalidateQueries({ queryKey: ["leaderboard"] });
      qc.invalidateQueries({ queryKey: ["padel_player"] });
    },
  });
}

export function useRejectScore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (scoreId: string) => {
      const { error } = await supabase
        .from("score_submissions")
        .update({ status: "rejected", reviewed_at: new Date().toISOString() })
        .eq("id", scoreId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["scores"] }),
  });
}

// ─── SUPPORTS ─────────────────────────────────────────
export function useSessionSupports(sessionId: string | undefined) {
  return useQuery({
    queryKey: ["supports", sessionId],
    enabled: !!sessionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("session_supports")
        .select("*")
        .eq("session_id", sessionId!);
      if (error) throw error;
      return (data ?? []) as SessionSupport[];
    },
  });
}

export function usePlaceSupport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      sessionId, supporterId, backedId, amount,
    }: { sessionId: string; supporterId: string; backedId: string; amount: number }) => {
      const { data, error } = await supabase
        .from("session_supports")
        .insert({ session_id: sessionId, supporter_id: supporterId, backed_id: backedId, amount })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, { sessionId }) =>
      qc.invalidateQueries({ queryKey: ["supports", sessionId] }),
  });
}
