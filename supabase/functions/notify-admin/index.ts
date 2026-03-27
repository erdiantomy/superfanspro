// Edge Function: notify-admin
// Sends email notifications to the super admin (superfans.games@gmail.com)
// for venue registrations, session approvals, score submissions, payments, etc.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ADMIN_EMAIL = "superfans.games@gmail.com";

interface AdminNotification {
  type: "venue_registration" | "session_request" | "payment_completed" | "score_submitted" | "general";
  subject: string;
  body: string;
  metadata?: Record<string, string>;
}

function buildEmailHtml(notification: AdminNotification): string {
  const metaRows = notification.metadata
    ? Object.entries(notification.metadata)
        .map(([k, v]) => `<tr><td style="padding:6px 12px;font-size:13px;color:#6D7A94;border-bottom:1px solid #262F3D;">${k}</td><td style="padding:6px 12px;font-size:13px;color:#FFFFFF;border-bottom:1px solid #262F3D;">${v}</td></tr>`)
        .join("")
    : "";

  const typeEmoji: Record<string, string> = {
    venue_registration: "🏟️",
    session_request: "🎾",
    payment_completed: "💰",
    score_submitted: "📊",
    general: "📢",
  };

  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#0B0E14;color:#FFFFFF;border-radius:16px;">
      <div style="text-align:center;margin-bottom:24px;">
        <span style="font-size:28px;font-weight:800;letter-spacing:2px;">
          SUPER<span style="color:#00E676;">FANS</span>
        </span>
        <div style="font-size:11px;color:#6D7A94;margin-top:4px;">ADMIN NOTIFICATION</div>
      </div>
      <div style="background:#161B26;border:1px solid #262F3D;border-radius:12px;padding:20px;">
        <div style="font-size:24px;margin-bottom:8px;">${typeEmoji[notification.type] || "📢"}</div>
        <h2 style="margin:0 0 8px;font-size:18px;color:#FFFFFF;">${notification.subject}</h2>
        <p style="margin:0 0 16px;font-size:14px;color:#6D7A94;line-height:1.5;">${notification.body}</p>
        ${metaRows ? `<table style="width:100%;border-collapse:collapse;background:#0B0E14;border-radius:8px;overflow:hidden;">${metaRows}</table>` : ""}
      </div>
      <div style="text-align:center;margin-top:24px;">
        <a href="https://www.superfans.games/superadmin" style="display:inline-block;padding:12px 32px;background:#00E676;color:#0B0E14;font-weight:700;border-radius:8px;text-decoration:none;font-size:14px;">
          Open Admin Panel
        </a>
      </div>
      <div style="text-align:center;margin-top:16px;font-size:11px;color:#3A4560;">
        SuperFans Admin · Automated notification
      </div>
    </div>
  `;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const notification: AdminNotification = await req.json();

    if (!notification.subject || !notification.body) {
      return new Response(JSON.stringify({ error: "subject and body required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Log the notification
    await supabase.from("admin_notifications").insert({
      type: notification.type,
      subject: notification.subject,
      body: notification.body,
      metadata: notification.metadata || {},
      recipient: ADMIN_EMAIL,
    });

    // Try sending via internal email function
    const emailHtml = buildEmailHtml(notification);
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        to: ADMIN_EMAIL,
        subject: `[SuperFans] ${notification.subject}`,
        html: emailHtml,
      }),
    });

    const emailResult = response.ok ? await response.json() : { fallback: true, status: response.status };

    return new Response(JSON.stringify({ 
      success: true, 
      logged: true,
      email_sent: response.ok,
      email_result: emailResult,
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});
