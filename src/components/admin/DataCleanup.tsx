import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Trash2, RefreshCw, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

type Row = { id: string; label: string; sub?: string; extra?: string };

interface SectionProps {
  title: string;
  description: string;
  rows: Row[];
  loading: boolean;
  onDelete: (ids: string[]) => Promise<void>;
  onRefresh: () => void;
  emptyText?: string;
}

const Section = ({ title, description, rows, loading, onDelete, onRefresh, emptyText }: SectionProps) => {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  const toggle = (id: string) => {
    setSelected((p) => {
      const n = new Set(p);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };
  const toggleAll = () => {
    setSelected(selected.size === rows.length ? new Set() : new Set(rows.map((r) => r.id)));
  };

  const handleDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Permanently delete ${selected.size} item(s) from "${title}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await onDelete(Array.from(selected));
      toast.success(`${selected.size} item(s) deleted`);
      setSelected(new Set());
      onRefresh();
    } catch (e: any) {
      toast.error(e.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              {title}
              <Badge variant="secondary">{rows.length}</Badge>
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={selected.size === 0 || deleting}
              className="gap-1.5"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Delete ({selected.size})
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-6 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">{emptyText || "Nothing to clean up here."}</p>
        ) : (
          <div className="space-y-1">
            <div className="flex items-center gap-2 pb-2 border-b">
              <Checkbox
                checked={selected.size === rows.length && rows.length > 0}
                onCheckedChange={toggleAll}
              />
              <span className="text-xs text-muted-foreground">Select all</span>
            </div>
            <div className="max-h-72 overflow-y-auto divide-y">
              {rows.map((r) => (
                <label key={r.id} className="flex items-start gap-3 py-2 cursor-pointer hover:bg-muted/40 px-1 rounded">
                  <Checkbox checked={selected.has(r.id)} onCheckedChange={() => toggle(r.id)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{r.label}</p>
                    {r.sub && <p className="text-xs text-muted-foreground truncate">{r.sub}</p>}
                  </div>
                  {r.extra && <span className="text-xs text-muted-foreground shrink-0">{r.extra}</span>}
                </label>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const DataCleanup = () => {
  const qc = useQueryClient();
  const [daysOld, setDaysOld] = useState(90);
  const cutoffISO = new Date(Date.now() - daysOld * 86400000).toISOString();
  const todayISO = new Date().toISOString().slice(0, 10);

  // 1. Expired jobs
  const expiredJobs = useQuery({
    queryKey: ["cleanup-expired-jobs", todayISO],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("id, title, department, last_date, is_active")
        .lt("last_date", todayISO)
        .order("last_date", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // 2. Inactive jobs (manually disabled)
  const inactiveJobs = useQuery({
    queryKey: ["cleanup-inactive-jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("id, title, department, last_date, is_active, updated_at")
        .eq("is_active", false)
        .order("updated_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // 3. Completed applications (old)
  const completedApps = useQuery({
    queryKey: ["cleanup-completed-apps", cutoffISO],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("id, status, updated_at, receipt_url, job:jobs(title), profile:profiles!applications_user_id_fkey(full_name)")
        .eq("status", "completed")
        .lt("updated_at", cutoffISO)
        .order("updated_at", { ascending: true });
      if (error) {
        // fallback without join
        const { data: d2 } = await supabase
          .from("applications")
          .select("id, status, updated_at, receipt_url")
          .eq("status", "completed")
          .lt("updated_at", cutoffISO);
        return d2 || [];
      }
      return data || [];
    },
  });

  // 4. Completed work requests (old)
  const completedWR = useQuery({
    queryKey: ["cleanup-completed-wr", cutoffISO],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("work_requests")
        .select("id, status, updated_at, receipt_url")
        .eq("status", "completed")
        .lt("updated_at", cutoffISO)
        .order("updated_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // 5. Inactive users (no applications, no work_requests, created > cutoff)
  const inactiveUsers = useQuery({
    queryKey: ["cleanup-inactive-users", cutoffISO],
    queryFn: async () => {
      const { data: profs, error } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, phone, created_at")
        .lt("created_at", cutoffISO);
      if (error) throw error;
      if (!profs?.length) return [];
      const ids = profs.map((p) => p.user_id);
      const [{ data: apps }, { data: wrs }, { data: roles }] = await Promise.all([
        supabase.from("applications").select("user_id").in("user_id", ids),
        supabase.from("work_requests").select("user_id").in("user_id", ids),
        supabase.from("user_roles").select("user_id, role").in("user_id", ids),
      ]);
      const active = new Set<string>([
        ...(apps || []).map((a: any) => a.user_id),
        ...(wrs || []).map((w: any) => w.user_id),
      ]);
      const privileged = new Set(
        (roles || [])
          .filter((r: any) => r.role === "admin" || r.role === "expert")
          .map((r: any) => r.user_id)
      );
      return profs.filter((p) => !active.has(p.user_id) && !privileged.has(p.user_id));
    },
  });

  // 6. Old read notifications
  const oldNotifs = useQuery({
    queryKey: ["cleanup-notifs", cutoffISO],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("id, title, type, created_at, is_read")
        .eq("is_read", true)
        .lt("created_at", cutoffISO)
        .order("created_at", { ascending: true })
        .limit(500);
      if (error) throw error;
      return data || [];
    },
  });

  // 7. Old team applications (CV submissions)
  const oldTeamApps = useQuery({
    queryKey: ["cleanup-team-apps", cutoffISO],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_applications")
        .select("id, full_name, position, email, cv_path, created_at")
        .lt("created_at", cutoffISO)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const deleteFromTable = (table: any) => async (ids: string[]) => {
    const { error } = await supabase.from(table).delete().in("id", ids);
    if (error) throw error;
  };

  const deleteAppsWithReceipts = async (ids: string[]) => {
    const items = (completedApps.data || []).filter((a: any) => ids.includes(a.id));
    const paths = items.map((a: any) => a.receipt_url).filter(Boolean);
    if (paths.length) await supabase.storage.from("user-documents").remove(paths).catch(() => {});
    await deleteFromTable("applications")(ids);
  };

  const deleteWRWithReceipts = async (ids: string[]) => {
    const items = (completedWR.data || []).filter((w: any) => ids.includes(w.id));
    const paths = items.map((w: any) => w.receipt_url).filter(Boolean);
    if (paths.length) await supabase.storage.from("user-documents").remove(paths).catch(() => {});
    await deleteFromTable("work_requests")(ids);
  };

  const deleteTeamAppsWithCVs = async (ids: string[]) => {
    const items = (oldTeamApps.data || []).filter((a: any) => ids.includes(a.id));
    const paths = items.map((a: any) => a.cv_path).filter(Boolean);
    if (paths.length) await supabase.storage.from("team-cvs").remove(paths).catch(() => {});
    await deleteFromTable("team_applications")(ids);
  };

  const refreshAll = () => qc.invalidateQueries({ predicate: (q) => String(q.queryKey[0]).startsWith("cleanup-") });

  return (
    <div className="space-y-6">
      <Card className="border-warning/40 bg-warning/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Data Cleanup
          </CardTitle>
          <CardDescription>
            Permanently remove old or unused records. Deletes here cannot be undone — files in storage are removed too.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="days-old">"Old" threshold (days)</Label>
              <Input
                id="days-old"
                type="number"
                min={1}
                value={daysOld}
                onChange={(e) => setDaysOld(Math.max(1, parseInt(e.target.value) || 90))}
                className="w-32"
              />
            </div>
            <Button variant="outline" size="sm" onClick={refreshAll} className="gap-1.5">
              <RefreshCw className="h-4 w-4" /> Refresh all
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Section
          title="Expired Jobs"
          description="Jobs whose last date has passed."
          loading={expiredJobs.isLoading}
          rows={(expiredJobs.data || []).map((j: any) => ({
            id: j.id,
            label: j.title,
            sub: j.department,
            extra: `Expired ${j.last_date}`,
          }))}
          onDelete={deleteFromTable("jobs")}
          onRefresh={() => expiredJobs.refetch()}
        />

        <Section
          title="Inactive Jobs"
          description="Jobs manually disabled (is_active = false)."
          loading={inactiveJobs.isLoading}
          rows={(inactiveJobs.data || []).map((j: any) => ({
            id: j.id,
            label: j.title,
            sub: j.department,
            extra: `Last date ${j.last_date}`,
          }))}
          onDelete={deleteFromTable("jobs")}
          onRefresh={() => inactiveJobs.refetch()}
        />

        <Section
          title={`Completed Applications (>${daysOld}d)`}
          description="Completed job applications older than the threshold. Receipts are removed from storage."
          loading={completedApps.isLoading}
          rows={(completedApps.data || []).map((a: any) => ({
            id: a.id,
            label: a.job?.title || "Application",
            sub: a.profile?.full_name || a.id,
            extra: new Date(a.updated_at).toLocaleDateString(),
          }))}
          onDelete={deleteAppsWithReceipts}
          onRefresh={() => completedApps.refetch()}
        />

        <Section
          title={`Completed Work Requests (>${daysOld}d)`}
          description="Completed custom service requests older than the threshold."
          loading={completedWR.isLoading}
          rows={(completedWR.data || []).map((w: any) => ({
            id: w.id,
            label: `Request ${w.id.slice(0, 8)}`,
            extra: new Date(w.updated_at).toLocaleDateString(),
          }))}
          onDelete={deleteWRWithReceipts}
          onRefresh={() => completedWR.refetch()}
        />

        <Section
          title={`Inactive Users (>${daysOld}d, no activity)`}
          description="Users who never submitted an application or work request. Profiles only — auth accounts are not removed."
          loading={inactiveUsers.isLoading}
          rows={(inactiveUsers.data || []).map((u: any) => ({
            id: u.id,
            label: u.full_name || "Unnamed",
            sub: u.phone || u.user_id,
            extra: new Date(u.created_at).toLocaleDateString(),
          }))}
          onDelete={deleteFromTable("profiles")}
          onRefresh={() => inactiveUsers.refetch()}
        />

        <Section
          title={`Old Read Notifications (>${daysOld}d)`}
          description="Read notifications older than the threshold."
          loading={oldNotifs.isLoading}
          rows={(oldNotifs.data || []).map((n: any) => ({
            id: n.id,
            label: n.title,
            sub: n.type,
            extra: new Date(n.created_at).toLocaleDateString(),
          }))}
          onDelete={deleteFromTable("notifications")}
          onRefresh={() => oldNotifs.refetch()}
        />

        <Section
          title={`Old Career CVs (>${daysOld}d)`}
          description="Team application submissions and their uploaded CVs."
          loading={oldTeamApps.isLoading}
          rows={(oldTeamApps.data || []).map((t: any) => ({
            id: t.id,
            label: t.full_name,
            sub: `${t.position} • ${t.email}`,
            extra: new Date(t.created_at).toLocaleDateString(),
          }))}
          onDelete={deleteTeamAppsWithCVs}
          onRefresh={() => oldTeamApps.refetch()}
        />
      </div>
    </div>
  );
};

export default DataCleanup;
