import { useQuery } from "@tanstack/react-query";
import { Bell, Mail, Smartphone, CheckCircle2, AlertTriangle, Loader2, CircleCheck, CircleDashed } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { isPushConfigured } from "@/lib/push";
import { formatDistanceToNow } from "date-fns";

const JobAlertsPanel = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-job-alerts"],
    queryFn: async () => {
      const [prefsRes, deliveriesRes] = await Promise.all([
        supabase.from("notification_preferences").select("*"),
        supabase
          .from("notification_deliveries")
          .select("*")
          .order("sent_at", { ascending: false })
          .limit(50),
      ]);
      if (prefsRes.error) throw prefsRes.error;
      if (deliveriesRes.error) throw deliveriesRes.error;
      return { prefs: prefsRes.data ?? [], deliveries: deliveriesRes.data ?? [] };
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const prefs = data?.prefs ?? [];
  const deliveries = data?.deliveries ?? [];
  const emailOn = prefs.filter((p) => p.email_enabled && !p.paused).length;
  const pushOn = prefs.filter((p) => p.push_enabled && !p.paused).length;
  const failed = deliveries.filter((d) => d.status === "failed").length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <Bell className="h-5 w-5 text-primary" />
            <div>
              <p className="text-2xl font-bold">{prefs.filter((p) => !p.paused).length}</p>
              <p className="text-xs text-muted-foreground">Users receiving alerts</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <Mail className="h-5 w-5 text-primary" />
            <div>
              <p className="text-2xl font-bold">{emailOn}</p>
              <p className="text-xs text-muted-foreground">Email alerts on</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <Smartphone className="h-5 w-5 text-primary" />
            <div>
              <p className="text-2xl font-bold">{pushOn}</p>
              <p className="text-xs text-muted-foreground">Browser alerts on</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            {failed > 0 ? (
              <AlertTriangle className="h-5 w-5 text-destructive" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-primary" />
            )}
            <div>
              <p className="text-2xl font-bold">{failed}</p>
              <p className="text-xs text-muted-foreground">Recent failures</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>How job alerts work</CardTitle>
          <CardDescription>
            When you publish a job, everyone whose profile matches it is alerted automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>1. A new job is posted and marked active.</p>
          <p>2. The site finds every user matching its age, gender, education and province rules.</p>
          <p>3. Matching users get a bell notification instantly, plus email or browser alerts if they chose them.</p>
          <p>4. Users who picked a daily summary get one combined message each morning at 9:00 AM.</p>
          <p>5. Each user can pause or change their alerts anytime from their dashboard.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Setup guide</CardTitle>
          <CardDescription>
            Each channel starts working by itself as soon as its setup is done — no other changes needed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 text-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-medium">
              <Smartphone className="h-4 w-4 text-primary" />
              Browser notifications (Firebase)
              {isPushConfigured() ? (
                <Badge variant="secondary" className="gap-1">
                  <CircleCheck className="h-3 w-3" /> Connected
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1">
                  <CircleDashed className="h-3 w-3" /> Not connected yet
                </Badge>
              )}
            </div>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Create a free project at firebase.google.com (no billing needed).</li>
              <li>In the Firebase project, add a "Web app" and copy its settings.</li>
              <li>Ask in chat to "connect Firebase" and pick your project — include web push when asked.</li>
              <li>Publish the site once after connecting. The "Browser notifications" switch then turns on for users automatically.</li>
            </ol>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-medium">
              <Mail className="h-4 w-4 text-primary" />
              Email alerts
              <Badge variant="outline" className="gap-1">
                <CircleDashed className="h-3 w-3" /> Needs a sender domain
              </Badge>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>You need a domain you own (e.g. yourdomain.com). You can buy one in Project Settings → Domains.</li>
              <li>Ask in chat to "set up email domain" and follow the short steps shown.</li>
              <li>Once verified, job alert emails start sending automatically — nothing else to change.</li>
            </ol>
          </div>
          <p className="text-xs text-muted-foreground">
            Until a channel is connected, users simply don't see it — bell alerts inside the site keep working regardless.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent alert deliveries</CardTitle>
          <CardDescription>The last 50 alerts sent out.</CardDescription>
        </CardHeader>
        <CardContent>
          {deliveries.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No alerts sent yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Channel</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>When</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deliveries.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="capitalize">{d.channel}</TableCell>
                      <TableCell>
                        <Badge variant={d.status === "sent" ? "secondary" : "destructive"}>
                          {d.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {d.sent_at
                          ? formatDistanceToNow(new Date(d.sent_at), { addSuffix: true })
                          : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[240px] truncate">
                        {d.error ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default JobAlertsPanel;
