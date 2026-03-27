import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useVenue } from "@/hooks/useVenue";
import { useSessions, useScoreSubmissions, useUpdateSession, useApproveScore, useRejectScore } from "@/hooks/useArena";
import { useArenaRealtime } from "@/hooks/useRealtime";
import { calcXP } from "@/lib/gamification";
import { Tag, StatusTag, Divider, Row, C, fmtLabel, shareUrl, fmtTs } from "@/components/arena";
import { toast } from "sonner";

export default function AdminPage() {
  const navigate = useNavigate();
  const { venue, loading: venueLoading, slug } = useVenue();
  const [authed, setAuthed] = useState(false);
  const [pass, setPass] = useState("");
  const [adminTab, setAdminTab] = useState<"sessions" | "scores" | "tracker" | "settings">("sessions");

  useArenaRealtime();

  const venueId = venue?.id;

  // Venue-scoped sessions
  const { data: sessions = [] } = useQuery({
    queryKey: ["venue-admin-sessions", venueId],
    enabled: !!venueId && authed,
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)("sessions")
        .select("*, host:padel_players!sessions_host_id_fkey(*)")
        .eq("venue_id", venueId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  // Venue-scoped scores
  const { data: scores = [] } = useQuery({
    queryKey: ["venue-admin-scores", venueId],
    enabled: !!venueId && authed,
    queryFn: async () => {
      // Get session IDs for this venue first, then filter scores
      const { data: venueSessions } = await (supabase.from as any)("sessions")
        .select("id")
        .eq("venue_id", venueId!);
      if (!venueSessions?.length) return [];
      const sessionIds = venueSessions.map((s: any) => s.id);
      const { data, error } = await (supabase.from as any)("score_submissions")
        .select("*")
        .in("session_id", sessionIds)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const updateSession = useUpdateSession();
  const approveScore = useApproveScore();
  const rejectScore = useRejectScore();

  const pendingSessions = sessions.filter((s: any) => s.status === "pending_approval");
  const pendingScores = scores.filter((s: any) => s.status === "pending");

  // ─── Venue Settings state ─────────────────────────────
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    name: "", courts_default: 2, monthly_prize: 2000000,
    prize_split_1st: 50, prize_split_2nd: 30, prize_split_3rd: 20,
  });
  const [saving, setSaving] = useState(false);

  const startEdit = () => {
    if (!venue) return;
    setSettingsForm({
      name: venue.name,
      courts_default: venue.courts_default || 2,
      monthly_prize: venue.monthly_prize || 2000000,
      prize_split_1st: venue.prize_split_1st || 50,
      prize_split_2nd: venue.prize_split_2nd || 30,
      prize_split_3rd: venue.prize_split_3rd || 20,
    });
    setEditing(true);
  };

  const saveSettings = async () => {
    const total = settingsForm.prize_split_1st + settingsForm.prize_split_2nd + settingsForm.prize_split_3rd;
    if (total !== 100) { toast.error(`Prize splits must total 100% (currently ${total}%)`); return; }
    setSaving(true);
    try {
      const { error } = await (supabase as any).from("venues").update({
        name: settingsForm.name,
        courts_default: settingsForm.courts_default,
        monthly_prize: settingsForm.monthly_prize,
        prize_split_1st: settingsForm.prize_split_1st,
        prize_split_2nd: settingsForm.prize_split_2nd,
        prize_split_3rd: settingsForm.prize_split_3rd,
      }).eq("id", venueId);
      if (error) throw error;
      toast.success("Venue settings updated");
      setEditing(false);
      qc.invalidateQueries({ queryKey: ["venue", slug] });
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  // ─── Session actions ──────────────────────────────────
  const handleApproveSession = async (id: string) => {
    await updateSession.mutateAsync({ id, updates: { status: "active", approved_at: new Date().toISOString() } });
    toast.success("Session approved · Host can now share invite link");
    qc.invalidateQueries({ queryKey: ["venue-admin-sessions"] });
  };

  const handleRejectSession = async (id: string) => {
    const note = prompt("Rejection reason (optional):") ?? "Session rejected by admin.";
    await updateSession.mutateAsync({ id, updates: { status: "rejected", admin_note: note } });
    toast.error("Session rejected");
    qc.invalidateQueries({ queryKey: ["venue-admin-sessions"] });
  };

  const handleApproveScore = async (scoreId: string) => {
    await approveScore.mutateAsync(scoreId);
    toast.success("Score approved · XP credited · Leaderboard updated");
    qc.invalidateQueries({ queryKey: ["venue-admin-scores"] });
  };

  const handleRejectScore = async (scoreId: string) => {
    await rejectScore.mutateAsync(scoreId);
    toast.error("Score rejected");
    qc.invalidateQueries({ queryKey: ["venue-admin-scores"] });
  };

  // ─── Loading / Not Found ──────────────────────────────
  if (venueLoading) {
    return <div style={{ height: "100dvh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", color: C.muted }}>Loading venue...</div>;
  }
  if (!venue) {
    return (
      <div style={{ height: "100dvh", background: C.bg, color: C.fg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
        <div style={{ fontSize: 48 }}>🏟️</div>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Venue not found</div>
        <button onClick={() => navigate("/")} style={{ color: C.muted, background: "none", border: "none", cursor: "pointer", fontSize: 13 }}>← Back home</button>
      </div>
    );
  }

  const accent = venue.primary_color || C.green;

  // ─── Password Gate ────────────────────────────────────
  if (!authed) {
    const checkPassword = async () => {
      try {
        const { data, error } = await supabase.rpc("verify_venue_password", {
          venue_slug: slug!,
          plain_password: pass,
        });
        if (error) throw error;
        if (data) {
          setAuthed(true);
        } else {
          alert("Incorrect password");
          setPass("");
        }
      } catch {
        alert("Error verifying password");
        setPass("");
      }
    };

    return (
      <div style={{ height: "100dvh", background: C.bg, color: C.fg, maxWidth: 480, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ width: "100%", maxWidth: 360, textAlign: "center" }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>🛡️</div>
          <div className="font-display" style={{ fontSize: 26, fontWeight: 900, color: accent, letterSpacing: 1 }}>STAFF ACCESS</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 4, marginBottom: 24 }}>{venue.name} Admin</div>
          <input value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === "Enter" && checkPassword()} type="password" placeholder="Staff password" style={{ width: "100%", background: C.raised, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 16px", color: C.fg, fontSize: 14, outline: "none", marginBottom: 10, boxSizing: "border-box" }} />
          <button onClick={checkPassword} style={{ width: "100%", background: accent, border: "none", color: "#0A0C11", padding: "13px 0", borderRadius: 12, fontFamily: "'Barlow Condensed'", fontSize: 16, fontWeight: 800, cursor: "pointer", marginBottom: 8 }}>ENTER →</button>
          <button onClick={() => navigate(`/${slug}`)} style={{ width: "100%", background: "none", border: "none", color: C.muted, padding: "8px 0", fontFamily: "'Barlow Condensed'", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>← Back to {venue.name}</button>
        </div>
      </div>
    );
  }

  const fmtRp = (n: number) => "Rp " + n.toLocaleString("id-ID");

  // ─── MAIN RENDER ──────────────────────────────────────
  return (
    <div style={{ height: "100dvh", background: "#0A0A0E", color: C.fg, maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, flexShrink: 0, background: "#0E0D0A" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {venue.logo_url ? (
              <img src={venue.logo_url} alt={venue.name} style={{ width: 32, height: 32, borderRadius: 8, objectFit: "cover" }} />
            ) : (
              <div style={{ width: 32, height: 32, borderRadius: 8, background: `${accent}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🏟️</div>
            )}
            <div>
              <div className="font-display" style={{ fontSize: 16, fontWeight: 900, color: accent, letterSpacing: 1 }}>ADMIN</div>
              <div style={{ fontSize: 9, color: C.dim, letterSpacing: 1 }}>{venue.name}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.green, animation: "pulse 2s infinite" }} />
              <span style={{ fontSize: 10, color: C.muted }}>DB live</span>
            </div>
            <button onClick={() => navigate(`/${slug}`)} style={{ background: C.raised, border: `1px solid ${C.border}`, color: C.muted, padding: "5px 10px", borderRadius: 8, fontFamily: "'Barlow Condensed'", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>← Exit</button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        {([
          { v: "sessions" as const, l: "📋 Sessions", n: pendingSessions.length },
          { v: "scores" as const, l: "⚽ Scores", n: pendingScores.length },
          { v: "tracker" as const, l: "👁 Tracker" },
          { v: "settings" as const, l: "⚙️ Settings" },
        ]).map(t => (
          <button key={t.v} onClick={() => setAdminTab(t.v)} style={{ flex: 1, padding: "10px 0", background: adminTab === t.v ? "#0E0D0A" : C.bg, border: "none", borderBottom: adminTab === t.v ? `2px solid ${accent}` : "2px solid transparent", color: adminTab === t.v ? accent : C.muted, fontFamily: "'Barlow Condensed'", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
            {t.l}
            {"n" in t && (t as any).n > 0 && <span style={{ background: C.red, color: "#fff", fontSize: 9, fontWeight: 900, borderRadius: 10, padding: "1px 4px", marginLeft: 4 }}>{(t as any).n}</span>}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px 90px" }}>

        {/* SESSION QUEUE */}
        {adminTab === "sessions" && (
          <>
            <div style={{ background: "#0E0D0A", border: `1px solid ${accent}25`, borderRadius: 12, padding: "10px 14px", marginBottom: 14, fontSize: 11, color: C.muted, lineHeight: 1.8 }}>
              🛡️ Sessions need approval before hosts can share invite links.
            </div>
            {pendingSessions.length === 0 && sessions.filter((s: any) => s.status === "pending_approval").length === 0 && (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
                <div className="font-display" style={{ fontSize: 16, fontWeight: 800, color: C.green }}>No pending sessions</div>
              </div>
            )}
            {sessions.map((s: any) => {
              const isPending = s.status === "pending_approval";
              const isApproved = ["active", "live", "finished"].includes(s.status);
              const isRejected = s.status === "rejected";
              return (
                <div key={s.id} style={{ background: C.card, border: `1px solid ${isPending ? accent + "50" : isApproved ? C.green + "30" : isRejected ? C.red + "25" : C.border}`, borderRadius: 14, padding: 14, marginBottom: 10 }}>
                  <div style={{ display: "flex", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
                    <StatusTag status={s.status} />
                    <Tag label={fmtLabel(s.format)} color={s.format === "americano" ? C.green : C.purple} />
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{s.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.raised, borderRadius: 10, padding: "8px 10px", marginBottom: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: accent, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 700 }}>Host: {s.host?.name}</div>
                      <div style={{ fontSize: 10, color: C.muted }}>{s.host?.email}</div>
                    </div>
                    <Tag label={`${s.courts} courts`} color={C.muted} />
                  </div>
                  {s.scheduled_at && <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>🗓 {new Date(s.scheduled_at).toLocaleString("id-ID")}</div>}
                  <div style={{ fontSize: 10, color: C.dim, marginBottom: 10 }}>Submitted {fmtTs(s.created_at)}</div>
                  {s.admin_note && <div style={{ background: `${accent}10`, border: `1px solid ${accent}25`, borderRadius: 8, padding: "6px 10px", marginBottom: 10, fontSize: 11, color: accent }}>Note: {s.admin_note}</div>}
                  {isApproved && <div style={{ color: C.green, fontSize: 12, fontWeight: 700 }}>✅ Approved</div>}
                  {isRejected && <div style={{ color: C.red, fontSize: 12, fontWeight: 700 }}>❌ Rejected · {s.admin_note}</div>}
                  {isPending && (
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => handleApproveSession(s.id)} style={{ flex: 2, background: `${C.green}15`, border: `1px solid ${C.green}40`, color: C.green, padding: "10px 0", borderRadius: 10, fontFamily: "'Barlow Condensed'", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>✓ Approve</button>
                      <button onClick={() => handleRejectSession(s.id)} style={{ flex: 1, background: `${C.red}12`, border: `1px solid ${C.red}35`, color: C.red, padding: "10px 0", borderRadius: 10, fontFamily: "'Barlow Condensed'", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>✕ Reject</button>
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}

        {/* SCORES QUEUE */}
        {adminTab === "scores" && (
          <>
            <div style={{ background: "#0E0D0A", border: `1px solid ${accent}25`, borderRadius: 12, padding: "10px 14px", marginBottom: 14, fontSize: 11, color: C.muted, lineHeight: 1.8 }}>
              ⚽ Approve match scores → XP credited → Leaderboard refreshes live.
            </div>
            {scores.length === 0 && (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
                <div className="font-display" style={{ fontSize: 16, fontWeight: 800, color: C.green }}>No pending scores</div>
              </div>
            )}
            {scores.map((s: any) => {
              const isA = s.status === "approved", isR = s.status === "rejected";
              const aWins = parseInt(s.score_a) > parseInt(s.score_b);
              const xpWin = calcXP(true, s.session_rank_winners);
              const xpLose = calcXP(false, s.session_rank_losers);
              return (
                <div key={s.id} style={{ background: C.card, border: `1px solid ${isA ? C.green + "40" : isR ? C.red + "25" : C.border}`, borderRadius: 14, padding: 14, marginBottom: 10 }}>
                  <div style={{ fontSize: 10, color: C.muted, marginBottom: 8 }}>{fmtTs(s.created_at)} · Round {s.round} · Court {s.court}</div>
                  <div style={{ background: C.raised, borderRadius: 10, padding: "10px 12px", marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: aWins ? C.fg : C.muted }}>Team A</span>
                      <span className="font-display" style={{ fontSize: 20, fontWeight: 900, color: aWins ? C.green : C.dim }}>{s.score_a}</span>
                    </div>
                    <div style={{ height: 1, background: C.border, margin: "4px 0 8px" }} />
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: !aWins ? C.fg : C.muted }}>Team B</span>
                      <span className="font-display" style={{ fontSize: 20, fontWeight: 900, color: !aWins ? C.blue : C.dim }}>{s.score_b}</span>
                    </div>
                  </div>
                  {!isA && !isR && (
                    <div style={{ background: "#0B1A0C", border: `1px solid ${C.green}20`, borderRadius: 10, padding: "8px 12px", marginBottom: 10, display: "flex", justifyContent: "space-between", fontSize: 11, color: C.muted }}>
                      <span>Winners: <strong style={{ color: C.green }}>+{xpWin} XP</strong></span>
                      <span>Losers: <strong style={{ color: C.blue }}>+{xpLose} XP</strong></span>
                    </div>
                  )}
                  {isA && <div style={{ color: C.green, fontSize: 12, fontWeight: 700 }}>✅ Approved · XP credited</div>}
                  {isR && <div style={{ color: C.red, fontSize: 12, fontWeight: 700 }}>❌ Rejected</div>}
                  {!isA && !isR && (
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => handleApproveScore(s.id)} style={{ flex: 2, background: `${C.green}15`, border: `1px solid ${C.green}40`, color: C.green, padding: "10px 0", borderRadius: 10, fontFamily: "'Barlow Condensed'", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>✓ Approve & Credit XP</button>
                      <button onClick={() => handleRejectScore(s.id)} style={{ flex: 1, background: `${C.red}12`, border: `1px solid ${C.red}35`, color: C.red, padding: "10px 0", borderRadius: 10, fontFamily: "'Barlow Condensed'", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>✕ Reject</button>
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}

        {/* TRACKER */}
        {adminTab === "tracker" && (
          <>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 12 }}>Full audit trail — all sessions at {venue.name}.</div>
            {sessions.length === 0 && <div style={{ textAlign: "center", padding: "24px 0", color: C.muted, fontSize: 13 }}>No sessions yet</div>}
            {sessions.map((s: any) => (
              <Row key={s.id}>
                <div style={{ display: "flex", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
                  <StatusTag status={s.status} />
                  <Tag label={fmtLabel(s.format)} color={s.format === "americano" ? C.green : C.purple} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{s.name}</div>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>
                  Host: <strong style={{ color: C.fg }}>{s.host?.name}</strong> · {s.courts} courts · max {s.max_players}
                </div>
                {s.scheduled_at && <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>🗓 {new Date(s.scheduled_at).toLocaleString("id-ID")}</div>}
                {s.admin_note && <div style={{ fontSize: 10, color: accent, marginBottom: 6 }}>Note: {s.admin_note}</div>}
                <div style={{ fontSize: 10, color: C.dim }}>🔗 superfans.games/{slug}/session/{s.code} · Created {fmtTs(s.created_at)}</div>
              </Row>
            ))}
          </>
        )}

        {/* VENUE SETTINGS */}
        {adminTab === "settings" && (
          <>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 16 }}>Manage your venue configuration.</div>

            {/* Venue URL */}
            <div style={{ background: C.raised, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 16px", marginBottom: 16 }}>
              <div style={{ fontSize: 10, color: C.dim, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Venue URL</div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>superfans.games/<span style={{ color: accent }}>{slug}</span></div>
            </div>

            {!editing ? (
              <>
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16, marginBottom: 12 }}>
                  <div style={{ fontSize: 10, color: C.dim, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Current Configuration</div>
                  <ConfigRow label="Venue Name" value={venue.name} />
                  <ConfigRow label="City" value={venue.city || "—"} />
                  <ConfigRow label="Courts" value={String(venue.courts_default || 2)} />
                  <ConfigRow label="Monthly Prize" value={fmtRp(venue.monthly_prize || 0)} />
                  <ConfigRow label="1st Place" value={`${venue.prize_split_1st || 50}% (${fmtRp(Math.round((venue.monthly_prize || 0) * (venue.prize_split_1st || 50) / 100))})`} />
                  <ConfigRow label="2nd Place" value={`${venue.prize_split_2nd || 30}% (${fmtRp(Math.round((venue.monthly_prize || 0) * (venue.prize_split_2nd || 30) / 100))})`} />
                  <ConfigRow label="3rd Place" value={`${venue.prize_split_3rd || 20}% (${fmtRp(Math.round((venue.monthly_prize || 0) * (venue.prize_split_3rd || 20) / 100))})`} />
                  <ConfigRow label="Primary Color" value={venue.primary_color || "#00E676"} color={venue.primary_color || undefined} />
                  <ConfigRow label="Status" value={venue.status} />
                </div>
                <button onClick={startEdit} style={{ width: "100%", background: `${accent}15`, border: `1px solid ${accent}40`, color: accent, padding: "12px 0", borderRadius: 12, fontFamily: "'Barlow Condensed'", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>✏️ Edit Settings</button>
              </>
            ) : (
              <div style={{ background: C.card, border: `1px solid ${accent}30`, borderRadius: 14, padding: 16 }}>
                <div style={{ fontSize: 10, color: accent, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Editing</div>
                <EditField label="Venue Name" value={settingsForm.name} onChange={v => setSettingsForm(f => ({ ...f, name: v }))} />
                <EditField label="Courts" type="number" value={String(settingsForm.courts_default)} onChange={v => setSettingsForm(f => ({ ...f, courts_default: parseInt(v) || 2 }))} />
                <EditField label="Monthly Prize (IDR)" type="number" value={String(settingsForm.monthly_prize)} onChange={v => setSettingsForm(f => ({ ...f, monthly_prize: parseInt(v) || 0 }))} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                  <EditField label="1st %" type="number" value={String(settingsForm.prize_split_1st)} onChange={v => setSettingsForm(f => ({ ...f, prize_split_1st: parseInt(v) || 0 }))} />
                  <EditField label="2nd %" type="number" value={String(settingsForm.prize_split_2nd)} onChange={v => setSettingsForm(f => ({ ...f, prize_split_2nd: parseInt(v) || 0 }))} />
                  <EditField label="3rd %" type="number" value={String(settingsForm.prize_split_3rd)} onChange={v => setSettingsForm(f => ({ ...f, prize_split_3rd: parseInt(v) || 0 }))} />
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={saveSettings} disabled={saving} style={{ flex: 2, background: accent, border: "none", color: "#0A0C11", padding: "12px 0", borderRadius: 10, fontFamily: "'Barlow Condensed'", fontSize: 14, fontWeight: 800, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>{saving ? "Saving..." : "💾 Save Changes"}</button>
                  <button onClick={() => setEditing(false)} style={{ flex: 1, background: C.raised, border: `1px solid ${C.border}`, color: C.muted, padding: "12px 0", borderRadius: 10, fontFamily: "'Barlow Condensed'", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>Cancel</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── HELPER COMPONENTS ──────────────────────────────────
function ConfigRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: `1px solid ${C.border}` }}>
      <span style={{ fontSize: 12, color: C.muted }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
        {color && <span style={{ width: 12, height: 12, borderRadius: 3, background: color, display: "inline-block" }} />}
        {value}
      </span>
    </div>
  );
}

function EditField({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{ display: "block", fontSize: 10, color: C.muted, marginBottom: 4, letterSpacing: 0.5 }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} style={{ width: "100%", background: C.raised, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", color: C.fg, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
    </div>
  );
}
