import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { usePadelPlayer, useCreateSession, useSessions, useSessionPlayers, useUpdatePlayerStatus } from "@/hooks/useArena";
import { Tag, CountdownBadge, Divider, C, fmtLabel, shareUrl, StatusTag } from "@/components/arena";
import { toast } from "sonner";

export default function HostDashboard() {
  const navigate = useNavigate();
  const { user }  = useAuth();
  const { data: me } = usePadelPlayer(user?.id);
  const { data: mySessions = [] } = useSessions();

  const myOwnSessions = mySessions.filter(s => s.host_id === me?.id);

  const [view, setView] = useState<"list" | "create">("list");

  if (view === "create") return <CreateSessionForm onDone={() => setView("list")} hostId={me?.id ?? ""} />;

  return (
    <div style={{ height: "100dvh", background: C.bg, color: C.fg, maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div className="font-display" style={{ fontSize: 20, fontWeight: 900, color: C.green }}>MY SESSIONS</div>
          <div style={{ fontSize: 10, color: C.dim }}>Host Dashboard · {me?.name}</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setView("create")} style={{ background: C.green, border: "none", color: "#0A0C11", padding: "8px 16px", borderRadius: 12, fontFamily: "'Barlow Condensed'", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>+ CREATE</button>
          <button onClick={() => navigate("/")} style={{ background: C.raised, border: `1px solid ${C.border}`, color: C.muted, padding: "8px 12px", borderRadius: 12, fontFamily: "'Barlow Condensed'", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>← Home</button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px 90px" }}>
        {myOwnSessions.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎾</div>
            <div className="font-display" style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>No sessions yet</div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 20 }}>Create your first session to get started</div>
            <button onClick={() => setView("create")} style={{ background: C.green, border: "none", color: "#0A0C11", padding: "12px 24px", borderRadius: 12, fontFamily: "'Barlow Condensed'", fontSize: 16, fontWeight: 800, cursor: "pointer" }}>CREATE SESSION</button>
          </div>
        )}

        {myOwnSessions.map(s => (
          <div key={s.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, marginBottom: 10 }}>
            <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
              <StatusTag status={s.status} />
              <Tag label={fmtLabel(s.format)} color={s.format === "americano" ? C.green : C.purple} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{s.name}</div>

            {s.status === "pending_approval" && (
              <div style={{ background: `${C.orange}12`, border: `1px solid ${C.orange}30`, borderRadius: 10, padding: "8px 12px", marginBottom: 8, fontSize: 11, color: C.orange, lineHeight: 1.6 }}>
                ⏳ Waiting for admin approval.<br />
                You cannot share the invite link yet.
              </div>
            )}

            {s.status === "rejected" && (
              <div style={{ background: `${C.red}12`, border: `1px solid ${C.red}30`, borderRadius: 10, padding: "8px 12px", marginBottom: 8, fontSize: 11, color: C.red, lineHeight: 1.6 }}>
                ❌ Rejected by admin. {s.admin_note && <><br />Reason: {s.admin_note}</>}
              </div>
            )}

            {(s.status === "active" || s.status === "live") && (
              <>
                <div style={{ background: C.raised, borderRadius: 10, padding: "8px 12px", marginBottom: 8 }}>
                  <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>Invite Link (share this)</div>
                  <div className="font-display" style={{ fontSize: 13, fontWeight: 700, color: C.green }}>https://{shareUrl(s.code)}</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => { navigator.clipboard?.writeText(`https://${shareUrl(s.code)}`); toast.success("Link copied!"); }} style={{ flex: 1, background: `${C.green}18`, border: `1px solid ${C.green}40`, color: C.green, padding: "10px 0", borderRadius: 10, fontFamily: "'Barlow Condensed'", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>🔗 Copy Link</button>
                  <button onClick={() => navigate(`/session/${s.code}`)} style={{ flex: 1, background: C.raised, border: `1px solid ${C.border}`, color: C.fg, padding: "10px 0", borderRadius: 10, fontFamily: "'Barlow Condensed'", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>View Session →</button>
                </div>
              </>
            )}

            <div style={{ fontSize: 10, color: C.dim, marginTop: 8 }}>Code: {s.code}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── CREATE SESSION FORM ──────────────────────────────
function CreateSessionForm({ onDone, hostId }: { onDone: () => void; hostId: string }) {
  const [step, setStep] = useState(1);
  const [fmt,  setFmt]  = useState<"americano"|"mexicano"|null>(null);
  const [pt,   setPt]   = useState<"random"|"fixed"|null>(null);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [courts, setCourts] = useState(2);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const createSession = useCreateSession();
  const canSubmit = name.trim() && date && time && fmt && pt;

  const submit = async () => {
    if (!canSubmit || !hostId) return;
    setSubmitting(true);
    try {
      const scheduledAt = new Date(`${date}T${time}`).toISOString();
      await createSession.mutateAsync({
        name: name.trim(), format: fmt!, partner_type: pt!,
        courts, total_rounds: 7, status: "pending_approval",
        host_id: hostId, max_players: courts * 4, locked: false,
        scheduled_at: scheduledAt, admin_note: null, approved_at: null,
      } as any);
      setDone(true);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to create session");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ height: "100dvh", background: C.bg, color: C.fg, maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, flexShrink: 0, display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={onDone} style={{ background: "none", border: "none", color: C.muted, fontSize: 22, cursor: "pointer" }}>←</button>
        <div className="font-display" style={{ fontSize: 20, fontWeight: 900 }}>NEW SESSION</div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 40px" }}>
        {done ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>📋</div>
            <div className="font-display" style={{ fontSize: 24, fontWeight: 900, color: C.orange, marginBottom: 6 }}>SUBMITTED FOR APPROVAL</div>
            <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.7, marginBottom: 16 }}>
              Your session request has been sent to Tom's staff.<br />
              <strong style={{ color: C.fg }}>You cannot share the invite link until admin approves.</strong>
            </div>
            <div style={{ background: C.raised, border: `1px solid ${C.orange}30`, borderRadius: 12, padding: "12px 14px", textAlign: "left", marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: C.orange, fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>WHAT HAPPENS NEXT</div>
              <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.8 }}>
                1. Admin reviews your session<br />
                2. Admin approves or rejects<br />
                3. If approved → you get the shareable link<br />
                4. You invite players via that link<br />
                5. You approve each player join request
              </div>
            </div>
            <button onClick={onDone} style={{ width: "100%", background: C.raised, border: `1px solid ${C.border}`, color: C.fg, padding: "12px 0", borderRadius: 12, fontFamily: "'Barlow Condensed'", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>← MY SESSIONS</button>
          </div>
        ) : (
          <>
            {/* Progress */}
            <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
              {[1, 2, 3].map(s => <div key={s} style={{ flex: 1, height: 3, borderRadius: 3, background: step >= s ? C.green : C.border, transition: "background .25s" }} />)}
            </div>

            {/* Step 1: Format */}
            {step === 1 && (
              <>
                <div className="font-display" style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>Choose Format</div>
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 14 }}>How players are paired each round</div>
                {([{ k: "americano", icon: "🔄", label: "Americano", color: C.green, sub: "Social · Mixed levels", desc: "Partners rotate every round. Everyone plays with and against all others." },
                  { k: "mexicano",  icon: "📊", label: "Mexicano",  color: C.purple, sub: "Competitive · Balanced", desc: "Re-ranked after each round. Winners play winners, losers play losers." }
                ] as const).map(f => (
                  <div key={f.k} onClick={() => setFmt(f.k)} style={{ background: fmt === f.k ? `${f.color}12` : C.raised, border: `2px solid ${fmt === f.k ? f.color : C.border}`, borderRadius: 14, padding: 14, marginBottom: 10, cursor: "pointer", transition: "all .15s" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <span style={{ fontSize: 24 }}>{f.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div className="font-display" style={{ fontSize: 18, fontWeight: 900, color: f.color }}>{f.label}</div>
                        <div style={{ fontSize: 10, color: f.color, fontWeight: 600 }}>{f.sub}</div>
                      </div>
                      {fmt === f.k && <span>✅</span>}
                    </div>
                    <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>{f.desc}</div>
                  </div>
                ))}
                <button disabled={!fmt} onClick={() => setStep(2)} style={{ width: "100%", background: fmt ? C.green : C.border, border: "none", color: fmt ? "#0A0C11" : C.muted, padding: "12px 0", borderRadius: 12, fontFamily: "'Barlow Condensed'", fontSize: 16, fontWeight: 800, cursor: fmt ? "pointer" : "not-allowed" }}>NEXT →</button>
              </>
            )}

            {/* Step 2: Partner type */}
            {step === 2 && (
              <>
                <div className="font-display" style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>Partner Type</div>
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 14 }}>How doubles partners are assigned</div>
                {([{ k: "random", icon: "🎲", label: "Single Entry",  color: C.orange, desc: "Join alone — app pairs you randomly before each match." },
                  { k: "fixed",  icon: "🤝", label: "Fixed Partner", color: C.blue,   desc: "Register as a pair — play together throughout." }
                ] as const).map(p => (
                  <div key={p.k} onClick={() => setPt(p.k)} style={{ background: pt === p.k ? `${p.color}12` : C.raised, border: `2px solid ${pt === p.k ? p.color : C.border}`, borderRadius: 14, padding: 14, marginBottom: 10, cursor: "pointer", transition: "all .15s" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 24 }}>{p.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div className="font-display" style={{ fontSize: 18, fontWeight: 900, color: p.color }}>{p.label}</div>
                        <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{p.desc}</div>
                      </div>
                      {pt === p.k && <span>✅</span>}
                    </div>
                  </div>
                ))}
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setStep(1)} style={{ flex: 1, background: C.raised, border: "none", color: C.muted, padding: "12px 0", borderRadius: 12, fontFamily: "'Barlow Condensed'", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>← Back</button>
                  <button disabled={!pt} onClick={() => setStep(3)} style={{ flex: 2, background: pt ? C.green : C.border, border: "none", color: pt ? "#0A0C11" : C.muted, padding: "12px 0", borderRadius: 12, fontFamily: "'Barlow Condensed'", fontSize: 16, fontWeight: 800, cursor: pt ? "pointer" : "not-allowed" }}>NEXT →</button>
                </div>
              </>
            )}

            {/* Step 3: Details */}
            {step === 3 && (
              <>
                <div className="font-display" style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>Session Details</div>
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 14 }}>Admin will review before approving</div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Session Name</div>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Sunday Americano" style={{ width: "100%", background: C.raised, border: `1px solid ${C.border}`, borderRadius: 12, padding: "11px 14px", color: C.fg, fontSize: 14, outline: "none" }} />
                </div>
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Date</div>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: "100%", background: C.raised, border: `1px solid ${C.border}`, borderRadius: 12, padding: "11px 14px", color: C.fg, fontSize: 13, outline: "none" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Start Time</div>
                    <input type="time" value={time} onChange={e => setTime(e.target.value)} style={{ width: "100%", background: C.raised, border: `1px solid ${C.border}`, borderRadius: 12, padding: "11px 14px", color: C.fg, fontSize: 13, outline: "none" }} />
                  </div>
                </div>
                {date && time && (
                  <div style={{ background: `${C.orange}12`, border: `1px solid ${C.orange}30`, borderRadius: 12, padding: "8px 12px", marginBottom: 12, fontSize: 11, color: C.orange }}>
                    ⏱ Support window closes at <strong>{time} on {date}</strong>
                  </div>
                )}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Courts</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {[1, 2, 3, 4].map(c => (
                      <button key={c} onClick={() => setCourts(c)} style={{ flex: 1, padding: "10px 0", borderRadius: 12, background: courts === c ? `${C.blue}18` : C.raised, border: `1px solid ${courts === c ? C.blue + "50" : C.border}`, color: courts === c ? C.blue : C.muted, fontFamily: "'Barlow Condensed'", fontSize: 18, fontWeight: 800, cursor: "pointer" }}>{c}</button>
                    ))}
                  </div>
                  <div style={{ fontSize: 10, color: C.dim, marginTop: 4 }}>{courts} court{courts > 1 ? "s" : ""} = {courts * 4} players/round · doubles</div>
                </div>
                <div style={{ background: "#0E0D0A", border: `1px solid ${C.orange}30`, borderRadius: 12, padding: "10px 14px", marginBottom: 14, fontSize: 11, color: C.muted, lineHeight: 1.7 }}>
                  🛡️ <strong style={{ color: C.orange }}>Requires admin approval</strong><br />
                  Tom's staff reviews your request. Invite link only unlocks after approval.
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setStep(2)} style={{ flex: 1, background: C.raised, border: "none", color: C.muted, padding: "12px 0", borderRadius: 12, fontFamily: "'Barlow Condensed'", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>← Back</button>
                  <button disabled={!canSubmit || submitting} onClick={submit} style={{ flex: 2, background: canSubmit ? `linear-gradient(135deg,${C.orange},${C.orange}cc)` : C.border, border: "none", color: canSubmit ? "#0A0C11" : C.muted, padding: "12px 0", borderRadius: 12, fontFamily: "'Barlow Condensed'", fontSize: 16, fontWeight: 800, cursor: canSubmit ? "pointer" : "not-allowed" }}>
                    {submitting ? "SUBMITTING..." : "SUBMIT FOR APPROVAL"}
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
