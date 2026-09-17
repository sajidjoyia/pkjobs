import { useState } from "react";
import { Bell, Mail, Smartphone, MessageCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
  DEFAULT_PREFERENCES,
} from "@/hooks/useNotificationPreferences";
import { enablePush, isPushConfigured } from "@/lib/push";

interface Props {
  compact?: boolean;
}

const AlertPreferences = ({ compact = false }: Props) => {
  const { data, isLoading } = useNotificationPreferences();
  const update = useUpdateNotificationPreferences();
  const { toast } = useToast();
  const [enablingPush, setEnablingPush] = useState(false);

  const prefs = { ...DEFAULT_PREFERENCES, ...(data ?? {}) };

  const save = (updates: Record<string, unknown>) => {
    update.mutate(
      { ...prefs, ...updates } as never,
      {
        onError: (e) =>
          toast({
            title: "Could not save",
            description: e instanceof Error ? e.message : "Please try again.",
            variant: "destructive",
          }),
      }
    );
  };

  const handlePushToggle = async (checked: boolean) => {
    if (!checked) {
      save({ push_enabled: false });
      return;
    }
    setEnablingPush(true);
    const result = await enablePush();
    setEnablingPush(false);

    if (result.status === "registered") {
      save({ push_enabled: true });
      toast({ title: "Browser alerts turned on", description: "You'll get a popup for matching jobs." });
      return;
    }

    const messages: Record<string, string> = {
      "not-configured": "Browser alerts aren't set up on this site yet. Please check back soon.",
      unsupported: "Your browser doesn't support these alerts. Try Chrome on Android or desktop.",
      "open-in-new-tab": "Open the site in its own browser tab, then turn this on again.",
      denied: "Notifications are blocked. Allow them for this site in your browser settings.",
      error: result.status === "error" ? result.message ?? "Something went wrong." : "",
    };
    toast({
      title: "Browser alerts not enabled",
      description: messages[result.status],
      variant: "destructive",
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const body = (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Label className="text-base">Pause all job alerts</Label>
          <p className="text-sm text-muted-foreground">
            Stops every alert without losing your choices below.
          </p>
        </div>
        <Switch checked={prefs.paused} onCheckedChange={(v) => save({ paused: v })} />
      </div>

      <Separator />

      <div className={prefs.paused ? "opacity-50 pointer-events-none space-y-6" : "space-y-6"}>
        <div className="space-y-4">
          <Label className="text-base">How should we alert you?</Label>

          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-3">
              <Mail className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Email</p>
                <p className="text-sm text-muted-foreground">Sent to your registered email address.</p>
              </div>
            </div>
            <Switch checked={prefs.email_enabled} onCheckedChange={(v) => save({ email_enabled: v })} />
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-3">
              <Smartphone className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Browser notifications</p>
                <p className="text-sm text-muted-foreground">
                  {isPushConfigured()
                    ? "Pops up on your phone or computer, even when the site is closed."
                    : "Coming soon on this site."}
                </p>
              </div>
            </div>
            {enablingPush ? (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            ) : (
              <Switch
                checked={prefs.push_enabled}
                disabled={!isPushConfigured()}
                onCheckedChange={handlePushToggle}
              />
            )}
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-3">
              <MessageCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">WhatsApp</p>
                <p className="text-sm text-muted-foreground">Coming soon.</p>
              </div>
            </div>
            <Switch checked={false} disabled />
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <Label className="text-base">How often?</Label>
          <RadioGroup
            value={prefs.frequency}
            onValueChange={(v) => save({ frequency: v })}
            className="space-y-2"
          >
            <div className="flex items-center gap-3">
              <RadioGroupItem value="instant" id="freq-instant" />
              <Label htmlFor="freq-instant" className="font-normal cursor-pointer">
                Right away — one alert per matching job
              </Label>
            </div>
            <div className="flex items-center gap-3">
              <RadioGroupItem value="daily" id="freq-daily" />
              <Label htmlFor="freq-daily" className="font-normal cursor-pointer">
                Once a day — a single summary of new matching jobs
              </Label>
            </div>
          </RadioGroup>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Alerts inside the site (the bell icon) always stay on.
      </p>
    </div>
  );

  if (compact) return body;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          Job Alerts
        </CardTitle>
        <CardDescription>
          Get told about new government jobs that match your profile.
        </CardDescription>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  );
};

export default AlertPreferences;
