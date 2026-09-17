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
  total_fee: number | null;
  is_active: boolean;
}

const formatSeats = (seats: number | null) =>
  !seats || seats < 1 ? "Seats not specified" : `${seats} seat${seats === 1 ? "" : "s"}`;

async function recordDelivery(
  user_id: string,
  job_id: string,
  channel: string,
  status: string,
  error?: string
) {
  await supabase
    .from("notification_deliveries")
    .upsert({ user_id, job_id, channel, status, error: error ?? null }, {
      onConflict: "user_id,job_id,channel",
    });
}

async function sendPush(tokens: string[], job: JobRow) {
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  const connectionKey = Deno.env.get("FIREBASE_MESSAGING_API_KEY");
  if (!lovableKey || !connectionKey) return { skipped: true, stale: [] as string[] };

  const stale: string[] = [];
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
            title: "New job match!",
            body: `${job.title} — ${job.department}. Apply before ${job.last_date}.`,
          },
          data: { path: `/jobs/${job.id}` },
        },
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`FCM send failed [${res.status}]: ${body}`);
      if (res.status === 404 || res.status === 400) stale.push(token);
    }
  }
  return { skipped: false, stale };
}

async function sendEmail(email: string, job: JobRow) {
  const { error } = await supabase.functions.invoke("send-transactional-email", {
    body: {
      templateName: "new-job-match",
      recipientEmail: email,
      idempotencyKey: `job-match-${job.id}-${email}`,
      templateData: {
        jobTitle: job.title,
        department: job.department,
        lastDate: job.last_date,
        seats: formatSeats(job.total_seats),
        totalFee: job.total_fee ? `PKR ${job.total_fee}` : "Not specified",
        jobUrl: `${SITE_URL}/jobs/${job.id}`,
      },
    },
  });
  if (error) throw error;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { job_id } = await req.json();
    if (typeof job_id !== "string" || !job_id) {
      return new Response(JSON.stringify({ error: "job_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id,title,department,last_date,total_seats,total_fee,is_active")
      .eq("id", job_id)
      .maybeSingle();
    if (jobError) throw jobError;
    if (!job || !job.is_active) {
      return new Response(JSON.stringify({ skipped: "job inactive or missing" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: eligible, error: eligibleError } = await supabase.rpc("eligible_users_for_job", {
      _job_id: job_id,
    });
    if (eligibleError) throw eligibleError;

    const userIds: string[] = (eligible ?? []).map((r: unknown) =>
      typeof r === "string" ? r : (r as { eligible_users_for_job: string }).eligible_users_for_job
    );
    if (userIds.length === 0) {
      return new Response(JSON.stringify({ eligible: 0, sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: prefs } = await supabase
      .from("notification_preferences")
      .select("*")
      .in("user_id", userIds)
      .eq("paused", false)
      .eq("frequency", "instant");

    const { data: alreadySent } = await supabase
      .from("notification_deliveries")
      .select("user_id,channel")
      .eq("job_id", job_id);
    const sentKey = new Set((alreadySent ?? []).map((d) => `${d.user_id}:${d.channel}`));

    let sent = 0;

    for (const pref of prefs ?? []) {
      if (pref.email_enabled && !sentKey.has(`${pref.user_id}:email`)) {
        try {
          const { data: authUser } = await supabase.auth.admin.getUserById(pref.user_id);
          const email = authUser?.user?.email;
          if (email) {
            await sendEmail(email, job as JobRow);
            await recordDelivery(pref.user_id, job_id, "email", "sent");
            sent++;
          }
        } catch (e) {
          await recordDelivery(
            pref.user_id,
            job_id,
            "email",
            "failed",
            e instanceof Error ? e.message : String(e)
          );
        }
      }

      if (pref.push_enabled && !sentKey.has(`${pref.user_id}:push`)) {
        try {
          const { data: subs } = await supabase
            .from("push_subscriptions")
            .select("fcm_token")
            .eq("user_id", pref.user_id);
          const tokens = (subs ?? []).map((s) => s.fcm_token);
          if (tokens.length) {
            const { skipped, stale } = await sendPush(tokens, job as JobRow);
            if (stale.length) {
              await supabase.from("push_subscriptions").delete().in("fcm_token", stale);
            }
            if (!skipped) {
              await recordDelivery(pref.user_id, job_id, "push", "sent");
              sent++;
            }
          }
        } catch (e) {
          await recordDelivery(
            pref.user_id,
            job_id,
            "push",
            "failed",
            e instanceof Error ? e.message : String(e)
          );
        }
      }
    }

    return new Response(JSON.stringify({ eligible: userIds.length, sent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("dispatch-job-alerts failed:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
