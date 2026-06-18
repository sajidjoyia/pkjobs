import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus, Loader2 } from "lucide-react";
import { useAllNews, useUpsertNews, useDeleteNews, NewsItem } from "@/hooks/useNewsItems";
import { useSeoSettings, useUpdateSeoSettings } from "@/hooks/useSeoSettings";

const NewsManager = () => {
  const { data: items = [], isLoading } = useAllNews();
  const upsert = useUpsertNews();
  const del = useDeleteNews();
  const { data: settings } = useSeoSettings();
  const updateSettings = useUpdateSeoSettings();

  const [draft, setDraft] = useState<Partial<NewsItem>>({ title: "", url: "", is_active: true, sort_order: 0 });
  const [speed, setSpeed] = useState<number>(((settings as any)?.news_scroll_speed_seconds) ?? 40);

  const handleAdd = async () => {
    if (!draft.title?.trim()) return;
    await upsert.mutateAsync({ title: draft.title.trim(), url: draft.url || null, is_active: draft.is_active ?? true, sort_order: Number(draft.sort_order) || 0 });
    setDraft({ title: "", url: "", is_active: true, sort_order: 0 });
  };

  const handleSaveSpeed = async () => {
    if (!settings?.id) return;
    await updateSettings.mutateAsync({ id: settings.id, updates: { news_scroll_speed_seconds: Number(speed) || 40 } as any });
  };

  return (
    <div className="space-y-6">
      {/* Speed */}
      <div className="card-elevated p-4 flex items-end gap-3 flex-wrap">
        <div className="space-y-1">
          <Label>Marquee Speed (seconds per loop, lower = faster)</Label>
          <Input type="number" min={5} max={300} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="w-40" />
        </div>
        <Button onClick={handleSaveSpeed} disabled={updateSettings.isPending}>Save Speed</Button>
      </div>

      {/* Add */}
      <div className="card-elevated p-4 space-y-3">
        <h3 className="font-semibold">Add News Item</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>Title *</Label>
            <Input value={draft.title || ""} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Breaking: New jobs added!" />
          </div>
          <div className="space-y-1">
            <Label>URL (optional)</Label>
            <Input value={draft.url || ""} onChange={(e) => setDraft({ ...draft, url: e.target.value })} placeholder="https://..." />
          </div>
          <div className="space-y-1">
            <Label>Sort Order</Label>
            <Input type="number" value={draft.sort_order ?? 0} onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })} />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <Switch checked={draft.is_active ?? true} onCheckedChange={(v) => setDraft({ ...draft, is_active: v })} />
            <Label>Active</Label>
          </div>
        </div>
        <Button onClick={handleAdd} disabled={upsert.isPending} className="gap-1.5">
          <Plus className="h-4 w-4" /> Add News
        </Button>
      </div>

      {/* List */}
      <div className="card-elevated p-4">
        <h3 className="font-semibold mb-3">All News Items</h3>
        {isLoading ? (
          <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : items.length === 0 ? (
          <p className="text-muted-foreground text-sm">No news yet.</p>
        ) : (
          <div className="space-y-2">
            {items.map((n) => (
              <div key={n.id} className="flex items-center gap-3 p-3 border rounded-md">
                <Switch
                  checked={n.is_active}
                  onCheckedChange={(v) => upsert.mutate({ ...n, is_active: v })}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{n.title}</p>
                  {n.url && <p className="text-xs text-muted-foreground truncate">{n.url}</p>}
                </div>
                <Input
                  type="number"
                  value={n.sort_order}
                  onChange={(e) => upsert.mutate({ ...n, sort_order: Number(e.target.value) })}
                  className="w-20"
                />
                <Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete?")) del.mutate(n.id); }}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsManager;
