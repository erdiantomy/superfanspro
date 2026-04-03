// Supabase Edge Function: send-notification-email
//
// Triggered by a Supabase Database Webhook on notifications INSERT.
// Checks if the user has email_enabled = true, then sends via Resend.
//
// DEPLOYMENT:
//   supabase functions deploy send-notification-email
//
// ENVIRONMENT VARIABLES (set in Supabase Dashboard → Edge Functions → Secrets):
//   RESEND_API_KEY   — your Resend API key
//   SENDER_EMAIL     — verified sender email (e.g., noreply@superfans.games)
//
// DATABASE WEBHOOK SETUP (Supabase Dashboard → Database → Webhooks):
//   Table: public.notifications
//   Events: INSERT
//   Endpoint: https://<project-ref>.supabase.co/functions/v1/send-notification-email

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const SENDER_EMAIL = Deno.env.get("SENDER_EMAIL") || "noreply@superfans.games";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const notification = payload.record;

    if (!notification?.user_id || !notification?.title) {
      return new Response(JSON.stringify({ skipped: true, reason: "invalid payload" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Skip if no Resend key configured
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ skipped: true, reason: "no RESEND_API_KEY" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check if user has email notifications enabled
    const { data: prefs } = await supabase
      .from("notification_preferences")
      .select("email_enabled")
      .eq("user_id", notification.user_id)
      .maybeSingle();

    if (!prefs?.email_enabled) {
      return new Response(JSON.stringify({ skipped: true, reason: "email disabled" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get user email
    const { data: userData } = await supabase.auth.admin.getUserById(notification.user_id);
    const email = userData?.user?.email;

    if (!email) {
      return new Response(JSON.stringify({ skipped: true, reason: "no email" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Send email via Resend
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `SuperFans <${SENDER_EMAIL}>`,
        to: [email],
        subject: notification.title,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #0B0E14; color: #FFFFFF; border-radius: 16px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <span style="font-size: 28px; font-weight: 800; letter-spacing: 2px;">
                SUPER<span style="color: #00E676;">FANS</span>
              </span>
            </div>
            <div style="background: #161B26; border: 1px solid #262F3D; border-radius: 12px; padding: 20px;">
              <h2 style="margin: 0 0 8px; font-size: 18px; color: #FFFFFF;">${notification.title}</h2>
              <p style="margin: 0; font-size: 14px; color: #6D7A94; line-height: 1.5;">${notification.body}</p>
            </div>
            <div style="text-align: center; margin-top: 24px;">
              <a href="https://superfans.games" style="display: inline-block; padding: 12px 32px; background: #00E676; color: #0B0E14; font-weight: 700; border-radius: 8px; text-decoration: none; font-size: 14px;">
                Open SuperFans
              </a>
            </div>
            <div style="text-align: center; margin-top: 16px; font-size: 11px; color: #3A4560;">
              You can manage your email preferences in the app settings.
            </div>
          </div>
        `,
      }),
    });

    const result = await res.json();

    return new Response(JSON.stringify({ sent: true, resend: result }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
