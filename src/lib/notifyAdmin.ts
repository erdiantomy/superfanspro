import { supabase } from "@/integrations/supabase/client";

const EDGE_FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-admin`;

interface AdminNotification {
  type: "venue_registration" | "session_request" | "payment_completed" | "general";
  subject: string;
  body: string;
  metadata?: Record<string, string>;
}

export async function notifyAdmin(notification: AdminNotification): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    await fetch(EDGE_FN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify(notification),
    });
  } catch (err) {
    // Fire-and-forget: don't block the user flow
    console.warn("Admin notification failed:", err);
  }
}
