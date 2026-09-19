import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SITE_URL = "https://pkjobs.lovable.app";
const GATEWAY_URL = "https://connector-gateway.lovable.dev/firebase_messaging";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

interface JobRow {
  id: string;
  title: string;
  department: string;
  last_date: string;
  total_seats: number | null;
}

const formatSeats = (seats: number | null) =>
  !seats || seats < 1 ? "Seats not specified" : `${seats} seat${seats === 1 ? "" : "s"}`;

async function recordDelivery(user_id: string, job_id: string, channel: string, status: string, error?: string) {
  await supabase
    .from("notification_deliveries")
    .upsert({ user_id, job_id, channel, status, error: error ?? null }, {
      onConflict: "user_id,job_id,channel",
    });
}

async function pushDigest(tokens: string[], count: number) {
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  const connectionKey = Deno.env.get("FIREBASE_MESSAGING_API_KEY");
  if (!lovableKey || !connectionKey) return false;

  for (const token of tokens) {
    const res = await fetch(`${GATEWAY_URL}/v1/projects/_/messages:send`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": connectionKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          token,
          notification: {
            title: `${count} new job${count === 1 ? "" : "s"} match your profile`,
            body: "Tap to see today's matching government jobs.",
          },
          data: { path: "/jobs" },
        },
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`FCM digest failed [${res.status}]: ${body}`);
      if (res.status === 404 || res.status === 400) {
        await supabase.from("push_subscriptions").delete().eq("fcm_token", token);
      }
    }
  }
  return true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: jobs, error: jobsError } = await supabase
      .from("jobs")
      .select("id,title,department,last_date,total_seats")
      .eq("is_active", true)
      .gte("created_at", since);
    if (jobsError) throw jobsError;

    if (!jobs || jobs.length === 0) {
      return new Response(JSON.stringify({ jobs: 0, users: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Map each daily-frequency user to the jobs they match
    const perUser = new Map<string, JobRow[]>();
    for (const job of jobs as JobRow[]) {
      const { data: eligible, error } = await supabase.rpc("eligible_users_for_job", { _job_id: job.id });
      if (error) {
        console.error(`eligibility failed for job ${job.id}: ${error.message}`);
        continue;
      }
      const ids: string[] = (eligible ?? []).map((r: unknown) =>
        typeof r === "string" ? r : (r as { eligible_users_for_job: string }).eligible_users_for_job
      );
      for (const id of ids) {
        perUser.set(id, [...(perUser.get(id) ?? []), job]);
      }
    }

    if (perUser.size === 0) {
      return new Response(JSON.stringify({ jobs: jobs.length, users: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: prefs } = await supabase
      .from("notification_preferences")
      .select("*")
      .in("user_id", [...perUser.keys()])
      .eq("paused", false)
      .eq("frequency", "daily");

    const { data: alreadySent } = await supabase
      .from("notification_deliveries")
      .select("user_id,job_id,channel")
      .gte("sent_at", since);
    const sentKey = new Set((alreadySent ?? []).map((d) => `${d.user_id}:${d.job_id}:${d.channel}`));

    let usersNotified = 0;

    for (const pref of prefs ?? []) {
      const allMatches = perUser.get(pref.user_id) ?? [];

      if (pref.email_enabled) {
        const fresh = allMatches.filter((j) => !sentKey.has(`${pref.user_id}:${j.id}:email`));
        if (fresh.length) {
          try {
            const { data: authUser } = await supabase.auth.admin.getUserById(pref.user_id);
            const email = authUser?.user?.email;
            if (email) {
              const { error } = await supabase.functions.invoke("send-transactional-email", {
                body: {
                  templateName: "daily-job-digest",
                  recipientEmail: email,
                  idempotencyKey: `digest-${pref.user_id}-${new Date().toISOString().slice(0, 10)}`,
                  templateData: {
                    count: fresh.length,
                    jobs: fresh.map((j) => ({
                      title: j.title,
                      department: j.department,
                      lastDate: j.last_date,
                      seats: formatSeats(j.total_seats),
                      url: `${SITE_URL}/jobs/${j.id}`,
                    })),
                  },
                },
              });
              if (error) throw error;
              for (const j of fresh) await recordDelivery(pref.user_id, j.id, "email", "sent");
              usersNotified++;
            }
          } catch (e) {
            for (const j of fresh) {
              await recordDelivery(
                pref.user_id,
                j.id,
                "email",
                "failed",
                e instanceof Error ? e.message : String(e)
              );
            }
          }
        }
      }

      if (pref.push_enabled) {
        const fresh = allMatches.filter((j) => !sentKey.has(`${pref.user_id}:${j.id}:push`));
        if (fresh.length) {
          const { data: subs } = await supabase
            .from("push_subscriptions")
            .select("fcm_token")
            .eq("user_id", pref.user_id);
          const tokens = (subs ?? []).map((s) => s.fcm_token);
          if (tokens.length && (await pushDigest(tokens, fresh.length))) {
            for (const j of fresh) await recordDelivery(pref.user_id, j.id, "push", "sent");
          }
        }
      }
    }

    return new Response(JSON.stringify({ jobs: jobs.length, users: usersNotified }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("send-daily-job-digest failed:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
