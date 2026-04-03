import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { C, Av } from "@/components/arena";
import { toast } from "sonner";

export default function PlayerDashboard() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const qc = useQueryClient();

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [twitter, setTwitter] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);

  // Resolve slug to player profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ["dashboard-profile", slug],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("player_profiles")
        .select("*, padel_players!player_profiles_player_id_fkey(user_id)")
        .eq("slug", slug)
        .single();
      return data;
    },
    enabled: !!slug,
  });

  // Full stats
  const { data: fullProfile } = useQuery({
    queryKey: ["player-profile-full", profile?.player_id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("player_profile_full")
        .select("*")
        .eq("player_id", profile!.player_id)
        .single();
      return data;
    },
    enabled: !!profile?.player_id,
  });

  // Donations received
  const { data: donations = [] } = useQuery({
    queryKey: ["dashboard-donations", profile?.player_id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("donations")
        .select("*")
        .eq("player_id", profile!.player_id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!profile?.player_id,
  });

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setBio(profile.bio || "");
      setIsPublic(profile.is_public ?? true);
      const sl = profile.social_links || {};
      setInstagram(sl.instagram || "");
      setTiktok(sl.tiktok || "");
      setTwitter(sl.twitter || "");
    }
  }, [profile]);

  // Auth check — redirect if not owner
  const ownerUserId = profile?.padel_players?.user_id;
  const isOwner = user && ownerUserId && user.id === ownerUserId;

  useEffect(() => {
    if (!authLoading && !isLoading && profile && !isOwner) {
      navigate(`/${slug}`, { replace: true });
    }
  }, [authLoading, isLoading, profile, isOwner, slug, navigate]);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from("player_profiles")
        .update({
          display_name: displayName.trim(),
          bio: bio.trim().slice(0, 160),
          is_public: isPublic,
          social_links: { instagram: instagram.trim(), tiktok: tiktok.trim(), twitter: twitter.trim() },
        })
        .eq("id", profile.id);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["dashboard-profile", slug] });
      qc.invalidateQueries({ queryKey: ["player-profile-full"] });
      toast.success("Profile updated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div style={{ color: C.muted, fontSize: 14 }}>Loading dashboard...</div>
      </div>
    );
  }

  if (!profile || !isOwner) return null;

  const fp = fullProfile || {};

  const statusColor: Record<string, string> = { paid: C.green, pending: "#FFD166", expired: C.dim };

  return (
    <div className="min-h-screen bg-background text-foreground max-w-md mx-auto" style={{ display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div className="font-display" style={{ fontSize: 18, fontWeight: 900 }}>Your Dashboard</div>
        </div>
        <button onClick={() => navigate(`/${slug}`)} style={{ background: `${C.green}15`, border: `1px solid ${C.green}30`, color: C.green, padding: "5px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>View Profile →</button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 40px" }}>
        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6, marginBottom: 20 }}>
          {[
            { l: "Raised", v: `Rp ${((fp.total_raised || 0) as number).toLocaleString("id-ID")}` },
            { l: "Fans", v: fp.supporter_count || 0 },
            { l: "Games", v: fp.games_played || 0 },
            { l: "Win %", v: `${fp.win_rate || 0}%` },
          ].map((s) => (
            <div key={s.l} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 6px", textAlign: "center" }}>
              <div className="font-display" style={{ fontSize: 14, fontWeight: 900, color: C.green }}>{s.v}</div>
              <div style={{ fontSize: 9, color: C.muted, textTransform: "uppercase" }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Edit Profile */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16, marginBottom: 20 }}>
          <div className="font-display" style={{ fontSize: 15, fontWeight: 800, marginBottom: 14 }}>✏️ Edit Profile</div>

          <label style={{ display: "block", marginBottom: 12 }}>
            <span style={{ fontSize: 11, color: C.muted }}>Display Name</span>
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, background: C.raised, border: `1px solid ${C.border}`, color: C.fg, fontSize: 13, outline: "none", marginTop: 4 }} />
          </label>

          <label style={{ display: "block", marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 11, color: C.muted }}>Bio</span>
              <span style={{ fontSize: 10, color: C.dim }}>{bio.length}/160</span>
            </div>
            <textarea value={bio} onChange={(e) => setBio(e.target.value.slice(0, 160))} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, background: C.raised, border: `1px solid ${C.border}`, color: C.fg, fontSize: 13, outline: "none", resize: "none", minHeight: 56, marginTop: 4 }} />
          </label>

          <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>Social Links</div>
          {[
            { label: "📷 Instagram", val: instagram, set: setInstagram, ph: "username" },
            { label: "🎵 TikTok", val: tiktok, set: setTiktok, ph: "username" },
            { label: "𝕏 Twitter", val: twitter, set: setTwitter, ph: "handle" },
          ].map((s) => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: C.muted, width: 90, flexShrink: 0 }}>{s.label}</span>
              <input value={s.val} onChange={(e) => s.set(e.target.value)} placeholder={s.ph} style={{ flex: 1, padding: "6px 10px", borderRadius: 8, background: C.raised, border: `1px solid ${C.border}`, color: C.fg, fontSize: 12, outline: "none" }} />
            </div>
          ))}

          <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, cursor: "pointer" }}>
            <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} style={{ accentColor: C.green }} />
            <span style={{ fontSize: 12, color: C.muted }}>Profile visible to public</span>
          </label>

          <button onClick={handleSave} disabled={saving} style={{ width: "100%", marginTop: 14, padding: 12, borderRadius: 10, background: C.green, border: "none", color: "#0D0D0D", fontWeight: 800, fontSize: 14, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        {/* Share */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16, marginBottom: 20 }}>
          <div className="font-display" style={{ fontSize: 15, fontWeight: 800, marginBottom: 10 }}>📤 Share Your Page</div>
          <div style={{ display: "flex", gap: 8 }}>
            <input readOnly value={`superfans.games/${slug}`} style={{ flex: 1, padding: "8px 10px", borderRadius: 8, background: C.raised, border: `1px solid ${C.border}`, color: C.fg, fontSize: 12, outline: "none" }} />
            <button onClick={() => { navigator.clipboard.writeText(`https://superfans.games/${slug}`); toast.success("Copied!"); }} style={{ padding: "8px 14px", borderRadius: 8, background: `${C.green}20`, border: `1px solid ${C.green}30`, color: C.green, fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>Copy</button>
          </div>
        </div>

        {/* Donation History */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16 }}>
          <div className="font-display" style={{ fontSize: 15, fontWeight: 800, marginBottom: 14 }}>💰 Donation History</div>
          {donations.length === 0 ? (
            <div style={{ textAlign: "center", padding: "16px 0", color: C.muted, fontSize: 12 }}>
              Share your page to start receiving support!
            </div>
          ) : (
            donations.map((d: any) => (
              <div key={d.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{d.is_anonymous ? "Anonymous" : d.donor_name}</div>
                  {d.message && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{d.message}</div>}
                  <div style={{ fontSize: 10, color: C.dim, marginTop: 3 }}>
                    {new Date(d.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.green }}>Rp {d.amount?.toLocaleString("id-ID")}</div>
                  <div style={{ fontSize: 10, color: statusColor[d.status] || C.dim, fontWeight: 600, marginTop: 2 }}>{d.status}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
