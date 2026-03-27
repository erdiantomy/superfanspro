/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ─── TYPES ────────────────────────────────────────────
export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, any>;
  read: boolean;
  created_at: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  in_app_enabled: boolean;
  email_enabled: boolean;
  score_approved: boolean;
  support_payout: boolean;
  division_promotion: boolean;
  session_approved: boolean;
  session_rejected: boolean;
  monthly_prize: boolean;
  join_request: boolean;
  payment_completed: boolean;
}

// ─── ICON MAP (used by UI components) ─────────────────
export const NOTIFICATION_ICONS: Record<string, string> = {
  score_approved: "\u26A1",
  support_payout: "\uD83D\uDCB0",
  division_promotion: "\uD83C\uDFC6",
  session_approved: "\u2705",
  session_rejected: "\u274C",
  monthly_prize: "\uD83C\uDFC5",
  join_request_received: "\uD83D\uDC4B",
  join_request_approved: "\uD83C\uDF89",
  join_request_declined: "\uD83D\uDE14",
  payment_completed: "\uD83D\uDCB3",
};

// ─── QUERIES ──────────────────────────────────────────

export function useNotifications(userId: string | undefined) {
  return useQuery({
    queryKey: ["notifications", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)("notifications")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as Notification[];
    },
  });
}

export function useUnreadCount(userId: string | undefined) {
  return useQuery({
    queryKey: ["notifications_unread", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { count, error } = await (supabase.from as any)("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId!)
        .eq("read", false);
      if (error) throw error;
      return count ?? 0;
    },
  });
}

// ─── MUTATIONS ────────────────────────────────────────

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await (supabase.from as any)("notifications")
        .update({ read: true })
        .eq("id", notificationId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notifications_unread"] });
    },
  });
}

export function useMarkAllRead(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!userId) return;
      const { error } = await (supabase.from as any)("notifications")
        .update({ read: true })
        .eq("user_id", userId)
        .eq("read", false);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notifications_unread"] });
    },
  });
}

// ─── PREFERENCES ──────────────────────────────────────

export function useNotificationPreferences(userId: string | undefined) {
  return useQuery({
    queryKey: ["notification_preferences", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)("notification_preferences")
        .select("*")
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data as NotificationPreferences | null;
    },
  });
}

export function useUpsertNotificationPreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (prefs: Partial<NotificationPreferences> & { user_id: string }) => {
      const { data, error } = await (supabase.from as any)("notification_preferences")
        .upsert(
          { ...prefs, updated_at: new Date().toISOString() },
          { onConflict: "user_id" }
        )
        .select()
        .single();
      if (error) throw error;
      return data as NotificationPreferences;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["notification_preferences", vars.user_id] });
    },
  });
}

// ─── REALTIME SUBSCRIPTION ────────────────────────────
// Call this in a component that mounts when user is authenticated
// (e.g., NotificationBell). On new notification INSERT, it
// invalidates caches and shows a toast.

export function useNotificationRealtime(userId: string | undefined) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const ch = supabase
      .channel(`user-notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          qc.invalidateQueries({ queryKey: ["notifications", userId] });
          qc.invalidateQueries({ queryKey: ["notifications_unread", userId] });

          // Show a toast for the new notification
          const n = payload.new as Notification | undefined;
          if (n?.title) {
            const icon = NOTIFICATION_ICONS[n.type] || "\uD83D\uDD14";
            toast(`${icon} ${n.title}`, { description: n.body });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [userId, qc]);
}
