import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSessions, useScoreSubmissions, useUpdateSession, useApproveScore, useRejectScore } from "@/hooks/useArena";
import { useArenaRealtime } from "@/hooks/useRealtime";
import { getDivision, calcXP } from "@/lib/gamification";
import { Av, Tag, StatusTag, Divider, Row, C, fmtLabel, shareUrl, fmtTs } from "@/components/arena";
import { toast } from "sonner";

export default function AdminPage() {
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const [authed,  setAuthed]  = useState(false);
  const [pass,    setPass]    = useState("");
  const [adminTab,setAdminTab]= useState<"sessions"|"scores"|"tracker">("sessions");

  useArenaRealtime();

  const { data: sessions = [] }  = useSessions();
  const { data: scores   = [] }  = useScoreSubmissions();

  const updateSession = useUpdateSession();
  const approveScore  = useApproveScore();
  const rejectScore   = useRejectScore();

  const pendingSessions = sessions.filter(s => s.status === "pending_approval");
  const pendingScores   = scores.filter(s => s.status === "pending");

  const handleApproveSession = async (id: string) => {
    await updateSession.mutateAsync({ id, updates: { status: "active", approved_at: new Date().toISOString() } });
    toast.success("Session approved · Host can now share invite link");
  };

  const handleRejectSession = async (id: string) => {
    const note = prompt("Rejection reason (optional):") ?? "Session rejected by admin.";
    await updateSession.mutateAsync({ id, updates: { status: "rejected", admin_note: note } });
    toast.error("Session rejected");
  };

  const handleApproveScore = async (scoreId: string) => {
    await approveScore.mutateAsync(scoreId);
    toast.success("Score approved · XP credited · Leaderboard updated");
  };

  const handleRejectScore = async (scoreId: string) => {
    await rejectScore.mutateAsync(scoreId);
    toast.error("Score rejected");
  };

  if (!authed) {
    return (
      <div style={{ height: "100dvh", background: C.bg, color: C.fg, maxWidth: 480, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ width: "100%", maxWidth: 360, textAlign: "center" }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>🛡️</div>
          <div className="font-display" style={{ fontSize: 26, fontWeight: 900, color: C.orange, letterSpacing: 1 }}>STAFF ACCESS</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 4, marginBottom: 24 }}>SuperFans Admin</div>
          <input value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === "Enter" && setAuthed(pass === "sirapadel7B")} type="password" placeholder="Staff password" style={{ width: "100%", background: C.raised, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 16px", color: C.fg, fontSize: 14, outline: "none", marginBottom: 10 }} />
          <button onClick={() => { if (pass === "sirapadel7B") { setAuthed(true); } else { alert("Incorrect password"); setPass(""); } }} style={{ width: "100%", background: C.orange, border: "none", color: "#0A0C11", padding: "13px 0", borderRadius: 12, fontFamily: "'Barlow Condensed'", fontSize: 16, fontWeight: 800, cursor: "pointer", marginBottom: 8 }}>ENTER →</button>
          <button onClick={() => navigate("/")} style={{ width: "100%", background: "none", border: "none", color: C.muted, padding: "8px 0", fontFamily: "'Barlow Condensed'", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>← Back to public</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: "100dvh", background: "#0A0A0E", color: C.fg, maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, flexShrink: 0, background: "#0E0D0A" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div className="font-display" style={{ fontSize: 20, fontWeight: 900, color: C.orange, letterSpacing: 1 }}>ADMIN PANEL</div>
            <div style={{ fontSize: 9, color: C.dim, letterSpacing: 1 }}>SuperFans Admin · Staff</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.green, animation: "pulse 2s infinite" }} />
              <span style={{ fontSize: 10, color: C.muted }}>DB live</span>
            </div>
            <button onClick={() => navigate("/")} style={{ background: C.raised, border: `1px solid ${C.border}`, color: C.muted, padding: "5px 10px", borderRadius: 8, fontFamily: "'Barlow Condensed'", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>← Exit</button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        {([
          { v: "sessions", l: "📋 Sessions", n: pendingSessions.length },
          { v: "scores",   l: "⚽ Scores",   n: pendingScores.length   },
          { v: "tracker",  l: "👁 Tracker"                              },
        ] as const).map(t => (
          <button key={t.v} onClick={() => setAdminTab(t.v)} style={{ flex: 1, padding: "10px 0", background: adminTab === t.v ? "#0E0D0A" : C.bg, border: "none", borderBottom: adminTab === t.v ? `2px solid ${C.orange}` : "2px solid transparent", color: adminTab === t.v ? C.orange : C.muted, fontFamily: "'Barlow Condensed'", fontSize: 11, fontWeight: 700, cursor: "pointer", position: "relative" }}>
            {t.l}
            {"n" in t && t.n > 0 && <span style={{ background: C.red, color: "#fff", fontSize: 9, fontWeight: 900, borderRadius: 10, padding: "1px 4px", marginLeft: 4 }}>{t.n}</span>}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px 90px" }}>

        {/* SESSION QUEUE */}
        {adminTab === "sessions" && (
          <>
            <div style={{ background: "#0E0D0A", border: `1px solid ${C.orange}25`, borderRadius: 12, padding: "10px 14px", marginBottom: 14, fontSize: 11, color: C.muted, lineHeight: 1.8 }}>
              🛡️ Sessions need approval before hosts can share invite links.<br />
              This prevents unauthorized sessions on SuperFans.
            </div>
            {pendingSessions.length === 0 && (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
                <div className="font-display" style={{ fontSize: 16, fontWeight: 800, color: C.green }}>No pending sessions</div>
              </div>
            )}
            {sessions.map(s => {
              const isPending  = s.status === "pending_approval";
              const isApproved = ["active","live","finished"].includes(s.status);
              const isRejected = s.status === "rejected";
              return (
                <div key={s.id} style={{ background: C.card, border: `1px solid ${isPending ? C.orange + "50" : isApproved ? C.green + "30" : isRejected ? C.red + "25" : C.border}`, borderRadius: 14, padding: 14, marginBottom: 10 }}>
                  <div style={{ display: "flex", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
                    <StatusTag status={s.status} />
                    <Tag label={fmtLabel(s.format)} color={s.format === "americano" ? C.green : C.purple} />
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{s.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.raised, borderRadius: 10, padding: "8px 10px", marginBottom: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.orange, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 700 }}>Host: {s.host?.name}</div>
                      <div style={{ fontSize: 10, color: C.muted }}>{s.host?.email}</div>
                    </div>
                    <Tag label={`${s.courts} courts`} color={C.muted} />
                  </div>
                  {s.scheduled_at && <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>🗓 {new Date(s.scheduled_at).toLocaleString("id-ID")}</div>}
                  <div style={{ fontSize: 10, color: C.dim, marginBottom: 10 }}>Submitted {fmtTs(s.created_at)}</div>
                  {s.admin_note && <div style={{ background: `${C.orange}10`, border: `1px solid ${C.orange}25`, borderRadius: 8, padding: "6px 10px", marginBottom: 10, fontSize: 11, color: C.orange }}>Note: {s.admin_note}</div>}
                  {isApproved && <div style={{ color: C.green, fontSize: 12, fontWeight: 700 }}>✅ Approved · Host can share invite link</div>}
                  {isRejected && <div style={{ color: C.red, fontSize: 12, fontWeight: 700 }}>❌ Rejected · {s.admin_note}</div>}
                  {isPending && (
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => handleApproveSession(s.id)} style={{ flex: 2, background: `${C.green}15`, border: `1px solid ${C.green}40`, color: C.green, padding: "10px 0", borderRadius: 10, fontFamily: "'Barlow Condensed'", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>✓ Approve Session</button>
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
            <div style={{ background: "#0E0D0A", border: `1px solid ${C.orange}25`, borderRadius: 12, padding: "10px 14px", marginBottom: 14, fontSize: 11, color: C.muted, lineHeight: 1.8 }}>
              ⚽ Approve match scores → XP credited → Support payouts resolved → Leaderboard refreshes live.
            </div>
            {scores.length === 0 && (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
                <div className="font-display" style={{ fontSize: 16, fontWeight: 800, color: C.green }}>No pending scores</div>
              </div>
            )}
            {scores.map(s => {
              const isA = s.status === "approved", isR = s.status === "rejected";
              const aWins = parseInt(s.score_a) > parseInt(s.score_b);
              const xpWin  = calcXP(true,  s.session_rank_winners);
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
                  {isA && <div style={{ color: C.green, fontSize: 12, fontWeight: 700 }}>✅ Approved · XP credited · Payouts resolved</div>}
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
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 12 }}>Full audit trail — all sessions, hosts, players, timestamps.</div>
            {sessions.map(s => (
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
                {s.admin_note && <div style={{ fontSize: 10, color: C.orange, marginBottom: 6 }}>Note: {s.admin_note}</div>}
                <div style={{ fontSize: 10, color: C.dim }}>🔗 {shareUrl(s.code)} · Created {fmtTs(s.created_at)}</div>
              </Row>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
