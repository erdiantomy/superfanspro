import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Av, C, Tag } from "@/components/arena";
import DonationModal from "@/components/profile/DonationModal";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  playerId: string;
  slug: string;
}

export default function PlayerProfilePage({ playerId, slug }: Props) {
  const [donateOpen, setDonateOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Full profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ["player-profile-full", playerId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("player_profile_full")
        .select("*")
        .eq("player_id", playerId)
        .single();
      return data;
    },
  });

  // Recent donations
  const { data: donations = [] } = useQuery({
    queryKey: ["player-donations", playerId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("donations")
        .select("*")
        .eq("player_id", playerId)
        .eq("status", "paid")
        .order("created_at", { ascending: false })
        .limit(20);
      return data ?? [];
    },
  });

  // Supporters (unique)
  const supporters = donations.reduce((acc: any[], d: any) => {
    if (!d.is_anonymous && d.donor_name && !acc.find((s: any) => s.donor_name === d.donor_name)) {
      acc.push(d);
    }
    return acc;
  }, []).slice(0, 5);

  // Check if current user owns this profile
  const isOwner = user && profile?.player_id === playerId;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div style={{ color: C.muted, fontSize: 14 }}>Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center gap-4">
        <div style={{ fontSize: 48 }}>👤</div>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Profile not found</div>
      </div>
    );
  }

  const stats = [
    { icon: "🎮", label: "Games", value: profile.games_played ?? 0 },
    { icon: "🏆", label: "Wins", value: profile.wins ?? 0 },
    { icon: "📉", label: "Losses", value: profile.losses ?? 0 },
    { icon: "📊", label: "Win Rate", value: `${profile.win_rate ?? 0}%` },
  ];

  const initials = (profile.display_name || "??")
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-background text-foreground max-w-md mx-auto" style={{ display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", color: C.muted, fontSize: 13, cursor: "pointer" }}>← Back</button>
        <button
          onClick={() => {
            navigator.clipboard.writeText(`${window.location.origin}/${slug}`);
            alert("Link copied!");
          }}
          style={{ background: `${C.green}15`, border: `1px solid ${C.green}30`, color: C.green, padding: "5px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer" }}
        >📤 Share</button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px 100px" }}>
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: "center", marginBottom: 28 }}>
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.display_name} style={{ width: 88, height: 88, borderRadius: "50%", objectFit: "cover", border: `3px solid ${C.green}40`, margin: "0 auto 12px" }} />
          ) : (
            <Av initials={initials} size={88} color={C.green} glow style={{ margin: "0 auto 12px" }} />
          )}
          <h1 className="font-display" style={{ fontSize: 26, fontWeight: 900, margin: 0 }}>{profile.display_name}</h1>
          {profile.division && <Tag label={profile.division.toUpperCase()} color={C.green} />}
          {profile.bio && <p style={{ fontSize: 13, color: C.muted, marginTop: 8, maxWidth: 280, margin: "8px auto 0" }}>{profile.bio}</p>}

          {/* Social links */}
          {profile.social_links && Object.values(profile.social_links).some(Boolean) && (
            <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 10 }}>
              {profile.social_links.instagram && (
                <a href={`https://instagram.com/${profile.social_links.instagram}`} target="_blank" rel="noopener" style={{ color: C.muted, fontSize: 12 }}>📷 IG</a>
              )}
              {profile.social_links.tiktok && (
                <a href={`https://tiktok.com/@${profile.social_links.tiktok}`} target="_blank" rel="noopener" style={{ color: C.muted, fontSize: 12 }}>🎵 TikTok</a>
              )}
              {profile.social_links.twitter && (
                <a href={`https://x.com/${profile.social_links.twitter}`} target="_blank" rel="noopener" style={{ color: C.muted, fontSize: 12 }}>𝕏 Twitter</a>
              )}
            </div>
          )}
        </motion.div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 24 }}>
          {stats.map((s) => (
            <motion.div key={s.label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 12px", textAlign: "center" }}>
              <div style={{ fontSize: 20 }}>{s.icon}</div>
              <div className="font-display" style={{ fontSize: 22, fontWeight: 900, color: C.green }}>{s.value}</div>
              <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Superfans section */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16, marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div className="font-display" style={{ fontSize: 15, fontWeight: 800 }}>💎 Superfans</div>
            <span style={{ fontSize: 12, color: C.green, fontWeight: 700 }}>{profile.supporter_count || 0} supporters</span>
          </div>
          <div style={{ fontSize: 13, color: C.green, fontWeight: 700, marginBottom: 8 }}>
            Rp {((profile.total_raised || 0) as number).toLocaleString("id-ID")} raised
          </div>
          {supporters.length > 0 ? (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {supporters.map((s: any, i: number) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, background: `${C.green}10`, border: `1px solid ${C.green}20`, borderRadius: 20, padding: "4px 10px 4px 4px" }}>
                  <Av initials={s.donor_name?.slice(0, 2).toUpperCase() || "??"} size={22} color={C.green} />
                  <span style={{ fontSize: 11, fontWeight: 600 }}>{s.donor_name}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 12, color: C.muted }}>Be the first to support {profile.display_name}!</div>
          )}
        </div>

        {/* Recent donations */}
        {donations.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div className="font-display" style={{ fontSize: 15, fontWeight: 800, marginBottom: 12 }}>Recent Support</div>
            {donations.slice(0, 8).map((d: any) => (
              <div key={d.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, marginBottom: 6 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{d.is_anonymous ? "Anonymous" : d.donor_name}</div>
                  {d.message && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{d.message}</div>}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.green }}>Rp {d.amount?.toLocaleString("id-ID")}</div>
              </div>
            ))}
          </div>
        )}

        {/* Owner link to dashboard */}
        {isOwner && (
          <button onClick={() => navigate(`/${slug}/dashboard`)} style={{ width: "100%", padding: 14, background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, color: C.fg, fontSize: 14, fontWeight: 700, cursor: "pointer", marginBottom: 24 }}>
            ⚙️ Manage Dashboard →
          </button>
        )}
      </div>

      {/* Sticky CTA */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "12px 16px", background: `linear-gradient(transparent, ${C.bg} 30%)`, display: "flex", justifyContent: "center" }}>
        <button onClick={() => setDonateOpen(true)} style={{ maxWidth: 400, width: "100%", padding: "14px 0", borderRadius: 14, background: C.green, border: "none", color: "#0D0D0D", fontFamily: "'Barlow Condensed'", fontSize: 16, fontWeight: 900, cursor: "pointer", letterSpacing: 0.5 }}>
          ❤️ Support {profile.display_name}
        </button>
      </div>

      <DonationModal
        open={donateOpen}
        onClose={() => setDonateOpen(false)}
        player={{ id: playerId, name: profile.display_name }}
      />
    </div>
  );
}
