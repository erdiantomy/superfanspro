import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useAdmin";
import { useMatches } from "@/hooks/useData";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Plus, Trash2, Trophy, Save } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/superfans-logo.png";
import type { Match } from "@/hooks/useData";

interface MatchForm {
  title: string;
  player_a_name: string;
  player_a_sport: string;
  player_a_tier: string;
  player_a_avatar: string;
  player_b_name: string;
  player_b_sport: string;
  player_b_tier: string;
  player_b_avatar: string;
  status: "live" | "upcoming" | "finished";
  pool: number;
}

const empty: MatchForm = {
  title: "",
  player_a_name: "",
  player_a_sport: "Padel",
  player_a_tier: "Pro",
  player_a_avatar: "",
  player_b_name: "",
  player_b_sport: "Padel",
  player_b_tier: "Pro",
  player_b_avatar: "",
  status: "upcoming",
  pool: 0,
};

export default function AdminPanel({ onBack }: { onBack: () => void }) {
  const { user } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: matches, isLoading } = useMatches();
  const qc = useQueryClient();

  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<MatchForm>({ ...empty });
  const [editScores, setEditScores] = useState<Record<string, { sA: number; sB: number }>>({});

  if (adminLoading) return <div className="flex items-center justify-center h-full text-muted-foreground">Loading…</div>;
  if (!isAdmin) return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-6">
      <p className="text-muted-foreground text-center">You don't have admin access.</p>
      <Button variant="outline" onClick={onBack}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
    </div>
  );

  const set = (k: keyof MatchForm, v: string | number) => setForm(f => ({ ...f, [k]: v }));

  const createMatch = async () => {
    if (!form.title || !form.player_a_name || !form.player_b_name) {
      toast.error("Title and both player names are required");
      return;
    }
    const { error } = await supabase.from("matches").insert({
      title: form.title,
      player_a_name: form.player_a_name,
      player_a_sport: form.player_a_sport,
      player_a_tier: form.player_a_tier,
      player_a_avatar: form.player_a_avatar || form.player_a_name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase(),
      player_b_name: form.player_b_name,
      player_b_sport: form.player_b_sport,
      player_b_tier: form.player_b_tier,
      player_b_avatar: form.player_b_avatar || form.player_b_name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase(),
      status: form.status,
      pool: form.pool,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Match created!");
    setForm({ ...empty });
    setCreating(false);
    qc.invalidateQueries({ queryKey: ["matches"] });
  };

  const updateScores = async (m: Match) => {
    const s = editScores[m.id];
    if (!s) return;
    const { error } = await supabase.from("matches").update({ score_a: s.sA, score_b: s.sB }).eq("id", m.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Scores updated!");
    setEditScores(p => { const n = { ...p }; delete n[m.id]; return n; });
    qc.invalidateQueries({ queryKey: ["matches"] });
  };

  const setStatus = async (id: string, status: "live" | "upcoming" | "finished") => {
    const { error } = await supabase.from("matches").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Status → ${status}`);
    qc.invalidateQueries({ queryKey: ["matches"] });
  };

  const declareWinner = async (id: string, winner: "a" | "b") => {
    const { error } = await supabase.from("matches").update({ winner, status: "finished" as const }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Winner declared!");
    qc.invalidateQueries({ queryKey: ["matches"] });
  };

  const deleteMatch = async (id: string) => {
    const { error } = await supabase.from("matches").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Match deleted");
    qc.invalidateQueries({ queryKey: ["matches"] });
  };

  return (
    <div className="h-full overflow-y-auto pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-5 w-5" /></Button>
        <img src={logo} alt="SuperFans" className="h-6 object-contain" />
        <h1 className="font-display text-lg font-bold tracking-tight">Admin Panel</h1>
        <div className="ml-auto">
          <Button size="sm" onClick={() => setCreating(!creating)}>
            <Plus className="h-4 w-4 mr-1" />{creating ? "Cancel" : "New Match"}
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Create form */}
        {creating && (
          <Card className="border-primary/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Create Match</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input placeholder="Match title" value={form.title} onChange={e => set("title", e.target.value)} />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">Player A</p>
                  <Input placeholder="Name" value={form.player_a_name} onChange={e => set("player_a_name", e.target.value)} />
                  <Input placeholder="Sport" value={form.player_a_sport} onChange={e => set("player_a_sport", e.target.value)} />
                  <Input placeholder="Tier" value={form.player_a_tier} onChange={e => set("player_a_tier", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">Player B</p>
                  <Input placeholder="Name" value={form.player_b_name} onChange={e => set("player_b_name", e.target.value)} />
                  <Input placeholder="Sport" value={form.player_b_sport} onChange={e => set("player_b_sport", e.target.value)} />
                  <Input placeholder="Tier" value={form.player_b_tier} onChange={e => set("player_b_tier", e.target.value)} />
                </div>
              </div>
              <div className="flex gap-3">
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.status}
                  onChange={e => set("status", e.target.value)}
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="live">Live</option>
                  <option value="finished">Finished</option>
                </select>
                <Input type="number" placeholder="Prize pool" value={form.pool || ""} onChange={e => set("pool", Number(e.target.value))} />
              </div>
              <Button className="w-full" onClick={createMatch}>Create Match</Button>
            </CardContent>
          </Card>
        )}

        {/* Matches list */}
        {isLoading ? (
          <p className="text-center text-muted-foreground py-8">Loading matches…</p>
        ) : !matches?.length ? (
          <p className="text-center text-muted-foreground py-8">No matches yet</p>
        ) : (
          <div className="space-y-3">
            {matches.map(m => {
              const scores = editScores[m.id] ?? { sA: m.sA, sB: m.sB };
              return (
                <Card key={m.id}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-sm">{m.title}</p>
                        <p className="text-xs text-muted-foreground">{m.pA.name} vs {m.pB.name}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        m.status === "live" ? "bg-primary/20 text-primary" :
                        m.status === "finished" ? "bg-muted text-muted-foreground" :
                        "bg-secondary/20 text-secondary"
                      }`}>{m.status}</span>
                    </div>

                    {/* Scores */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-8">{m.pA.av}</span>
                      <Input
                        type="number"
                        className="w-16 h-8 text-center text-sm"
                        value={scores.sA}
                        onChange={e => setEditScores(p => ({ ...p, [m.id]: { ...scores, sA: Number(e.target.value) } }))}
                      />
                      <span className="text-muted-foreground">–</span>
                      <Input
                        type="number"
                        className="w-16 h-8 text-center text-sm"
                        value={scores.sB}
                        onChange={e => setEditScores(p => ({ ...p, [m.id]: { ...scores, sB: Number(e.target.value) } }))}
                      />
                      <span className="text-xs text-muted-foreground w-8">{m.pB.av}</span>
                      <Button size="sm" variant="outline" className="h-8" onClick={() => updateScores(m)}>
                        <Save className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      {m.status !== "live" && (
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setStatus(m.id, "live")}>
                          Set Live
                        </Button>
                      )}
                      {m.status !== "upcoming" && (
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setStatus(m.id, "upcoming")}>
                          Set Upcoming
                        </Button>
                      )}
                      {m.status !== "finished" && (
                        <>
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => declareWinner(m.id, "a")}>
                            <Trophy className="h-3 w-3 mr-1" />{m.pA.av} Wins
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => declareWinner(m.id, "b")}>
                            <Trophy className="h-3 w-3 mr-1" />{m.pB.av} Wins
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="destructive" className="h-7 text-xs ml-auto" onClick={() => deleteMatch(m.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
