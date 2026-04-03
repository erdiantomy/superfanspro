import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { C, Av } from "@/components/arena";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  player: { id: string; name: string; avatar: string };
}

const RESERVED = ["admin", "api", "app", "settings", "login", "signup", "dashboard", "venue", "player", "superadmin", "register", "auth", "topup", "payment", "fanprize", "host", "rank", "session", "match"];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30);
}

export default function ClaimProfileModal({ open, onClose, player }: Props) {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [step, setStep] = useState(1);
  const [slug, setSlug] = useState(() => slugify(player.name));
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [slugChecking, setSlugChecking] = useState(false);
  const [displayName, setDisplayName] = useState(player.name);
  const [bio, setBio] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Debounced slug check
  useEffect(() => {
    if (!open) return;
    const clean = slug.replace(/[^a-z0-9-]/g, "").slice(0, 30);
    if (clean !== slug) setSlug(clean);

    if (clean.length < 3) { setSlugAvailable(null); return; }
    if (RESERVED.includes(clean)) { setSlugAvailable(false); return; }

    setSlugChecking(true);
    const timer = setTimeout(async () => {
      try {
        const { data } = await (supabase as any).rpc("check_slug_available", { p_slug: clean });
        setSlugAvailable(data === true);
      } catch { setSlugAvailable(null); }
      setSlugChecking(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [slug, open]);

  const handleSubmit = useCallback(async () => {
    if (!slugAvailable || slug.length < 3) return;
    setSubmitting(true);
    try {
      const { error } = await (supabase as any)
        .from("player_profiles")
        .insert({
          player_id: player.id,
          slug,
          display_name: displayName.trim() || player.name,
          bio: bio.trim().slice(0, 160),
          is_public: true,
        });
      if (error) throw error;

      qc.invalidateQueries({ queryKey: ["my-profile"] });
      qc.invalidateQueries({ queryKey: ["resolve-slug", slug] });
      toast.success("Your page is live! 🎉");
      onClose();
      navigate(`/${slug}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create profile");
    } finally {
      setSubmitting(false);
    }
  }, [slug, slugAvailable, displayName, bio, player, qc, onClose, navigate]);

  if (!open) return null;

  const initials = (displayName || player.name || "??")
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const slugValid = slug.length >= 3 && slug.length <= 30 && slugAvailable === true;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 999, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)" }} />
      <div style={{ position: "relative", width: "100%", maxWidth: 420, background: C.card, borderRadius: "20px 20px 0 0", border: `1px solid ${C.border}`, padding: "20px 20px 32px", maxHeight: "90vh", overflowY: "auto" }}>
        {/* Handle */}
        <div style={{ width: 40, height: 4, borderRadius: 2, background: C.dim, margin: "0 auto 16px" }} />

        {/* Progress */}
        <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
          {[1, 2, 3].map((s) => (
            <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: step >= s ? C.green : C.dim, transition: "background 0.3s" }} />
          ))}
        </div>

        {/* Step 1: Slug picker */}
        {step === 1 && (
          <>
            <div className="font-display" style={{ fontSize: 20, fontWeight: 900, marginBottom: 4 }}>Choose your URL</div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>This is your unique Superfans page address</div>

            <div style={{ display: "flex", alignItems: "center", background: C.raised, border: `1px solid ${slugAvailable === true ? C.green : slugAvailable === false ? C.red : C.border}`, borderRadius: 10, padding: "10px 12px", marginBottom: 8, transition: "border-color 0.3s" }}>
              <span style={{ fontSize: 12, color: C.dim, flexShrink: 0 }}>superfans.games/</span>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                maxLength={30}
                style={{ flex: 1, background: "transparent", border: "none", color: C.fg, fontSize: 14, fontWeight: 700, outline: "none", padding: 0, marginLeft: 2 }}
                placeholder="yourname"
                autoFocus
              />
            </div>

            {/* Status */}
            <div style={{ fontSize: 11, marginBottom: 6, minHeight: 16 }}>
              {slugChecking && <span style={{ color: C.muted }}>Checking...</span>}
              {!slugChecking && slugAvailable === true && <span style={{ color: C.green }}>✓ Available!</span>}
              {!slugChecking && slugAvailable === false && <span style={{ color: C.red }}>✕ Already taken{RESERVED.includes(slug) ? " (reserved)" : ""}</span>}
              {!slugChecking && slug.length > 0 && slug.length < 3 && <span style={{ color: C.red }}>Minimum 3 characters</span>}
            </div>
            <div style={{ fontSize: 10, color: C.dim, marginBottom: 20 }}>3-30 characters · lowercase letters, numbers, hyphens only</div>

            <button
              onClick={() => setStep(2)}
              disabled={!slugValid}
              style={{
                width: "100%", padding: 13, borderRadius: 12,
                background: slugValid ? C.green : C.dim,
                border: "none", color: "#0D0D0D",
                fontFamily: "'Barlow Condensed'", fontSize: 15, fontWeight: 800,
                cursor: slugValid ? "pointer" : "not-allowed",
              }}
            >
              Continue →
            </button>
          </>
        )}

        {/* Step 2: Profile setup */}
        {step === 2 && (
          <>
            <div className="font-display" style={{ fontSize: 20, fontWeight: 900, marginBottom: 4 }}>Set up your profile</div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>You can always edit this later</div>

            <label style={{ display: "block", marginBottom: 14 }}>
              <span style={{ fontSize: 11, color: C.muted }}>Display Name</span>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                style={{ width: "100%", marginTop: 4, padding: "10px 12px", borderRadius: 10, background: C.raised, border: `1px solid ${C.border}`, color: C.fg, fontSize: 14, outline: "none" }}
              />
            </label>

            <label style={{ display: "block", marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, color: C.muted }}>Bio (optional)</span>
                <span style={{ fontSize: 10, color: C.dim }}>{bio.length}/160</span>
              </div>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 160))}
                placeholder="Tell fans about yourself..."
                style={{ width: "100%", marginTop: 4, padding: "10px 12px", borderRadius: 10, background: C.raised, border: `1px solid ${C.border}`, color: C.fg, fontSize: 13, outline: "none", resize: "none", minHeight: 60 }}
              />
            </label>

            <div style={{ fontSize: 11, color: C.dim, marginBottom: 20 }}>You can add a photo and social links later in your dashboard</div>

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setStep(1)} style={{ flex: 1, padding: 12, borderRadius: 10, background: C.raised, border: `1px solid ${C.border}`, color: C.muted, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>← Back</button>
              <button onClick={() => setStep(3)} style={{ flex: 2, padding: 12, borderRadius: 10, background: C.green, border: "none", color: "#0D0D0D", fontFamily: "'Barlow Condensed'", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>Preview →</button>
            </div>
          </>
        )}

        {/* Step 3: Preview */}
        {step === 3 && (
          <>
            <div className="font-display" style={{ fontSize: 20, fontWeight: 900, marginBottom: 4 }}>Preview your page</div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>This is how fans will see you</div>

            {/* Mini preview card */}
            <div style={{ background: C.raised, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, textAlign: "center", marginBottom: 16 }}>
              <Av initials={initials} size={64} color={C.green} glow style={{ margin: "0 auto 10px" }} />
              <div className="font-display" style={{ fontSize: 20, fontWeight: 900 }}>{displayName || player.name}</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 4, maxWidth: 240, margin: "4px auto 0" }}>
                {bio || "No bio yet"}
              </div>
              <div style={{ fontSize: 11, color: C.green, marginTop: 8, fontWeight: 600 }}>
                superfans.games/{slug}
              </div>
            </div>

            <div style={{ fontSize: 10, color: C.dim, textAlign: "center", marginBottom: 16 }}>You can edit this anytime</div>

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setStep(2)} style={{ flex: 1, padding: 12, borderRadius: 10, background: C.raised, border: `1px solid ${C.border}`, color: C.muted, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>← Back</button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  flex: 2, padding: 13, borderRadius: 12,
                  background: C.green, border: "none", color: "#0D0D0D",
                  fontFamily: "'Barlow Condensed'", fontSize: 16, fontWeight: 900,
                  cursor: "pointer", opacity: submitting ? 0.6 : 1,
                }}
              >
                {submitting ? "Creating..." : "Create My Page 🚀"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
