import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Av } from "@/components/arena";
import { getDivision } from "@/lib/gamification";

interface PlayerLinkProps {
  player: {
    id: string;
    name: string;
    avatar: string;
    lifetime_xp: number;
  };
  size?: number;
  showAvatar?: boolean;
  nameOnly?: boolean;
  glow?: boolean;
}

export default function PlayerLink({ player, size = 36, showAvatar = true, nameOnly = false, glow = false }: PlayerLinkProps) {
  const navigate = useNavigate();
  const div = getDivision(player.lifetime_xp);

  const { data: profileSlug } = useQuery({
    queryKey: ["player-slug", player.id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("player_profiles")
        .select("slug")
        .eq("player_id", player.id)
        .single();
      return data?.slug ?? null;
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!player.id,
  });

  const handleClick = (e: React.MouseEvent) => {
    if (!profileSlug) return;
    e.stopPropagation();
    navigate(`/${profileSlug}`);
  };

  const isClickable = !!profileSlug;
  const displayName = nameOnly ? player.name.split(" ")[0] : player.name;

  return (
    <span
      onClick={isClickable ? handleClick : undefined}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        cursor: isClickable ? "pointer" : "default",
        transition: "opacity .15s",
      }}
      onMouseEnter={e => { if (isClickable) (e.currentTarget as HTMLElement).style.opacity = "0.8"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
    >
      {showAvatar && <Av initials={player.avatar} size={size} color={div.color} glow={glow} />}
      <span style={{
        fontSize: size <= 32 ? 13 : size <= 40 ? 14 : 12,
        fontWeight: 600,
        borderBottom: isClickable ? `1px dashed ${div.color}60` : "none",
      }}>
        {displayName}
      </span>
    </span>
  );
}
