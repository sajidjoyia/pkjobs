import { useEffect, useState } from "react";
import { Smartphone, Loader2, Save, CircleCheck, CircleDashed, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { clearPushConfigCache, usePushConfigured } from "@/lib/push";
import { toast } from "sonner";

const emptyForm = {
  web_api_key: "",
  project_id: "",
  app_id: "",
  vapid_key: "",
  service_account_json: "",
};

const FirebasePushSetup = () => {
  const pushReady = usePushConfigured();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("push_config")
      .select("web_api_key, project_id, app_id, vapid_key, service_account_json")
      .limit(1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) toast.error("Could not load saved Firebase settings");
        if (data) {
          setForm({
            web_api_key: data.web_api_key ?? "",
            project_id: data.project_id ?? "",
            app_id: data.app_id ?? "",
            vapid_key: data.vapid_key ?? "",
            service_account_json: data.service_account_json ?? "",
          });
        }
        setLoading(false);
      });
  }, []);

  const set = (key: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value.trim() }));

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("push_config")
      .upsert({
        id: true,
        web_api_key: form.web_api_key || null,
        project_id: form.project_id || null,
        app_id: form.app_id || null,
        vapid_key: form.vapid_key || null,
        service_account_json: form.service_account_json || null,
        updated_at: new Date().toISOString(),
      });
    setSaving(false);
    if (error) {
      toast.error("Save failed: " + error.message);
      return;
    }
    clearPushConfigCache();
    toast.success("Firebase settings saved. Publish the site once so they go live for users.");
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 font-medium">
        <Smartphone className="h-4 w-4 text-primary" />
        Browser notifications (Firebase)
        {pushReady ? (
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
        <li>
          Go to{" "}
          <a
            href="https://console.firebase.google.com"
            target="_blank"
            rel="noreferrer"
            className="text-primary underline inline-flex items-center gap-0.5"
          >
            console.firebase.google.com <ExternalLink className="h-3 w-3" />
          </a>{" "}
          and create a free project (no billing needed).
        </li>
        <li>In Project Overview, click the web icon (&lt;/&gt;) to add a "Web app" and register it.</li>
        <li>
          Firebase shows your app settings — copy <strong>apiKey</strong>, <strong>projectId</strong> and{" "}
          <strong>appId</strong> into the form below.
        </li>
        <li>
          For the VAPID key: open Project Settings → Cloud Messaging → Web Push certificates → "Generate key
          pair", and copy the key.
        </li>
        <li>
          Optional but recommended: Project Settings → Service accounts → "Generate new private key" — paste the
          whole JSON file contents below so the server can send notifications.
        </li>
        <li>Save below, then publish the site once. The "Browser notifications" switch turns on for users automatically.</li>
      </ol>

      <Card className="mt-3">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Enter your Firebase keys</CardTitle>
          <CardDescription>Saved securely in the database — only admins can see or change them.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="fb-api-key">Web API key (apiKey)</Label>
                  <Input id="fb-api-key" value={form.web_api_key} onChange={set("web_api_key")} placeholder="AIza..." />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fb-project-id">Project ID (projectId)</Label>
                  <Input id="fb-project-id" value={form.project_id} onChange={set("project_id")} placeholder="my-project-123" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fb-app-id">App ID (appId)</Label>
                  <Input id="fb-app-id" value={form.app_id} onChange={set("app_id")} placeholder="1:123456789:web:abc..." />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fb-vapid">VAPID key (Web Push certificate)</Label>
                  <Input id="fb-vapid" value={form.vapid_key} onChange={set("vapid_key")} placeholder="B..." />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fb-sa">Service account JSON (optional, for sending from the server)</Label>
                <Textarea
                  id="fb-sa"
                  value={form.service_account_json}
                  onChange={set("service_account_json")}
                  placeholder='{"type": "service_account", "project_id": "...", ...}'
                  rows={4}
                  className="font-mono text-xs"
                />
              </div>
              <Button onClick={save} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Firebase settings
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FirebasePushSetup;
