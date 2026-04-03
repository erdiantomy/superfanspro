import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import VenuePage from "@/pages/VenuePage";
import PlayerProfilePage from "@/pages/PlayerProfilePage";
import NotFound from "@/pages/NotFound";
import { VenueProvider } from "@/hooks/useVenue";
import { C } from "@/components/arena";

export default function SlugResolver() {
  const { slug } = useParams<{ slug: string }>();

  const { data: resolved, isLoading, error } = useQuery({
    queryKey: ["resolve-slug", slug],
    queryFn: async () => {
      const { data } = await (supabase.rpc as any)("resolve_slug", { p_slug: slug });
      return data as { entity_type: string; entity_id: string } | null;
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div style={{ color: C.muted, fontSize: 14 }}>Loading...</div>
      </div>
    );
  }

  if (!resolved || error) {
    return <NotFound />;
  }

  if (resolved.entity_type === "venue") {
    return (
      <VenueProvider>
        <VenuePage />
      </VenueProvider>
    );
  }

  if (resolved.entity_type === "player") {
    return <PlayerProfilePage playerId={resolved.entity_id} slug={slug!} />;
  }

  return <NotFound />;
}
