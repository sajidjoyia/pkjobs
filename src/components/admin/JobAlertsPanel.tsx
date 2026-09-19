import { useQuery } from "@tanstack/react-query";
import { Bell, Mail, Smartphone, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
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
