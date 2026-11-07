import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, CircleDashed, Loader2, Mail, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface Status {
  resend_connected: boolean;
  sender: { from_email: string; from_name: string; reply_to: string | null } | null;
}

const EmailSetup = () => {
  const qc = useQueryClient();
  const { data: status, isLoading } = useQuery({
    queryKey: ["email-status"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("email-status", { method: "GET" });
      if (error) throw error;
      return data as Status;
    },
  });

  const { data: jobs } = useQuery({
    queryKey: ["email-broadcast-jobs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("jobs")
        .select("id,title,last_date")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(50);
      return data ?? [];
    },
  });

  const [fromEmail, setFromEmail] = useState("");
  const [fromName, setFromName] = useState("PakJobs");
  const [replyTo, setReplyTo] = useState("");
  const [saving, setSaving] = useState(false);
  const [testTo, setTestTo] = useState("");
  const [testing, setTesting] = useState(false);

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState<"opted_in" | "job_eligible">("opted_in");
  const [jobId, setJobId] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (status?.sender) {
      setFromEmail(status.sender.from_email);
      setFromName(status.sender.from_name);
      setReplyTo(status.sender.reply_to ?? "");
    }
  }, [status]);

  const saveSender = async () => {
    if (!fromEmail.includes("@")) return toast.error("Enter a valid From email");
    setSaving(true);
    const { error } = await supabase.from("email_sender_config").upsert({
      id: true,
      from_email: fromEmail.trim(),
      from_name: fromName.trim() || "PakJobs",
      reply_to: replyTo.trim() || null,
      updated_at: new Date().toISOString(),
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Sender saved");
    qc.invalidateQueries({ queryKey: ["email-status"] });
  };

  const sendTest = async () => {
    setTesting(true);
    const { data, error } = await supabase.functions.invoke("email-status", {
      method: "POST",
      body: { test_email: testTo.trim() || undefined },
    });
    setTesting(false);
    if (error) return toast.error("Test failed");
    if (data?.sent) toast.success("Test email sent — check the inbox (and spam folder)");
    else toast.error(data?.skipped || data?.error || "Test not sent");
  };

  const sendBroadcast = async () => {
    if (audience === "job_eligible" && !jobId) return toast.error("Choose a job");
    if (!confirm("Send this email to all matching subscribed users?")) return;
    setSending(true);
    const { data, error } = await supabase.functions.invoke("email-broadcast", {
      body: { subject, message, audience, job_id: jobId || undefined },
    });
    setSending(false);
    if (error) return toast.error("Sending failed");
    if (data?.error) return toast.error(data.error);
    if (data?.skipped) return toast.error(data.skipped);
    toast.success(`Sent ${data.sent} of ${data.matched}${data.failed ? `, ${data.failed} failed` : ""}`);
    if (data.sent) {
      setSubject("");
      setMessage("");
    }
  };

  const connected = status?.resend_connected;
  const senderSet = Boolean(status?.sender?.from_email);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" /> Email alerts (Resend)
        </CardTitle>
        <CardDescription>
          Job-match emails, daily summaries and admin announcements. Every email has an unsubscribe link.
        </CardDescription>
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <div className="flex flex-wrap gap-2 pt-1">
            <Badge variant={connected ? "secondary" : "outline"} className="gap-1">
              {connected ? <CheckCircle2 className="h-3 w-3" /> : <CircleDashed className="h-3 w-3" />}
              Resend {connected ? "connected" : "not connected"}
            </Badge>
            <Badge variant={senderSet ? "secondary" : "outline"} className="gap-1">
              {senderSet ? <CheckCircle2 className="h-3 w-3" /> : <CircleDashed className="h-3 w-3" />}
              Sender {senderSet ? "set" : "not set"}
            </Badge>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6 text-sm">
        <Accordion type="single" collapsible defaultValue={connected && senderSet ? undefined : "guide"}>
          <AccordionItem value="guide">
            <AccordionTrigger>Step-by-step setup guide</AccordionTrigger>
            <AccordionContent className="space-y-4 text-muted-foreground">
              <div>
                <p className="font-medium text-foreground">1. Create a Resend account</p>
                <p>Go to resend.com and sign up (free plan: 3,000 emails/month, 100/day).</p>
              </div>
              <div>
                <p className="font-medium text-foreground">2. Add and verify your domain in Resend</p>
                <ol className="list-disc list-inside space-y-1">
                  <li>You need a domain you own, e.g. pkjobs.pk. Buy one from any registrar if needed.</li>
                  <li>In Resend → Domains → Add Domain, enter it (a subdomain like mail.pkjobs.pk works well).</li>
                  <li>Resend shows a few DNS records (SPF, DKIM, MX). Add each one at your domain provider's DNS page.</li>
                  <li>Click Verify in Resend. It can take a few minutes up to 48 hours.</li>
                </ol>
                <p className="mt-1">Without a verified domain, Resend only delivers to your own Resend login email.</p>
              </div>
              <div>
                <p className="font-medium text-foreground">3. Create an API key in Resend</p>
                <p>Resend → API Keys → Create API Key → permission “Sending access”. Copy it.</p>
              </div>
              <div>
                <p className="font-medium text-foreground">4. Connect Resend to this website</p>
                <p>
                  In Lovable, open Connectors (or ask in chat: “connect Resend”), choose Resend, paste the API key
                  and link it to this project. The badge above turns to “Resend connected”.
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground">5. Fill in the sender below and send a test</p>
                <p>
                  The From email must use your verified domain, e.g. alerts@pkjobs.pk. Save, then press “Send test email”.
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground">What sends automatically after setup</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Instant job-match email when a new job fits a user (users who chose “instant”).</li>
                  <li>Daily summary at 9:00 AM for users who chose “daily”.</li>
                  <li>Announcements you send from the box below.</li>
                  <li>Users switch email alerts on/off in Dashboard → Alerts, or with the unsubscribe link in any email.</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-foreground">Password reset & sign-up emails</p>
                <p>
                  These already work today through the built-in sign-in system — no Resend needed. Users click
                  “Forgot password” on the sign-in page.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="space-y-3">
          <p className="font-medium">Sender</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label>From email</Label>
              <Input placeholder="alerts@yourdomain.pk" value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>From name</Label>
              <Input value={fromName} onChange={(e) => setFromName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Reply-to (optional)</Label>
              <Input placeholder="support@yourdomain.pk" value={replyTo} onChange={(e) => setReplyTo(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 items-end">
            <Button onClick={saveSender} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Save sender
            </Button>
            <Input
              className="max-w-xs"
              placeholder="Test to (defaults to your email)"
              value={testTo}
              onChange={(e) => setTestTo(e.target.value)}
            />
            <Button variant="outline" onClick={sendTest} disabled={testing}>
              {testing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Send test email
            </Button>
          </div>
        </div>

        <div className="space-y-3 border-t pt-5">
          <p className="font-medium">Send an announcement email</p>
          <p className="text-xs text-muted-foreground">
            Goes only to users who turned on email alerts. Up to 500 per send.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Who receives it</Label>
              <Select value={audience} onValueChange={(v) => setAudience(v as typeof audience)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="opted_in">All users with email alerts on</SelectItem>
                  <SelectItem value="job_eligible">Only users eligible for a job</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {audience === "job_eligible" && (
              <div className="space-y-1">
                <Label>Job</Label>
                <Select value={jobId} onValueChange={setJobId}>
                  <SelectTrigger><SelectValue placeholder="Choose a job" /></SelectTrigger>
                  <SelectContent>
                    {(jobs ?? []).map((j) => (
                      <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="space-y-1">
            <Label>Subject</Label>
            <Input value={subject} maxLength={200} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Message</Label>
            <Textarea rows={6} maxLength={4000} value={message} onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your message. When a job is chosen, its details and apply button are added automatically." />
          </div>
          <Button onClick={sendBroadcast} disabled={sending || subject.length < 3 || message.length < 5}>
            {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            Send email
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmailSetup;
