import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import {
  broadcastEmailHtml,
  EmailJob,
  sendResendEmail,
  SupabaseLike,
} from "../_shared/email.ts";

const url = Deno.env.get("SUPABASE_URL")!;
const serviceClient = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

const MAX_SENDS = 500;

async function requireAdmin(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return null;
  const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data, error } = await userClient.auth.getUser();
  if (error || !data.user) return null;
  const { data: isAdmin } = await userClient.rpc("has_role", {
    _user_id: data.user.id,
    _role: "admin",
  });
  if (!isAdmin) return null;
  return { user: data.user, userClient };
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function messageToHtml(message: string): string {
  return message
    .split(/\n{2,}/)
    .map(
      (p) =>
        `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;">${p
          .split("\n")
          .map((line) => escapeHtml(line))
          .join("<br />")}</p>`
    )
    .join("");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const admin = await requireAdmin(req);
    if (!admin) return json({ error: "Admin access required" }, 403);

    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    const body = await req.json().catch(() => ({}));
    const subject = typeof body?.subject === "string" ? body.subject.trim() : "";
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    const audience = body?.audience === "job_eligible" ? "job_eligible" : "opted_in";
    const jobId = typeof body?.job_id === "string" ? body.job_id : null;

    if (subject.length < 3 || subject.length > 200) {
      return json({ error: "Subject must be 3–200 characters" }, 400);
    }
    if (message.length < 5 || message.length > 4000) {
      return json({ error: "Message must be 5–4000 characters" }, 400);
    }

    let userIds: string[] = [];
    let job: EmailJob | null = null;

    if (audience === "job_eligible") {
      if (!jobId) return json({ error: "Select a job for this audience" }, 400);
      const { data: jobRow } = await serviceClient
        .from("jobs")
        .select("id,slug,title,department,last_date,total_seats,total_fee")
        .eq("id", jobId)
        .maybeSingle();
      if (!jobRow) return json({ error: "Job not found" }, 404);
      job = jobRow as EmailJob;
      const { data: eligible, error: eligibleError } = await serviceClient.rpc(
        "eligible_users_for_job",
        { _job_id: jobId }
      );
      if (eligibleError) throw eligibleError;
      userIds = (eligible ?? []).map((r: unknown) =>
        typeof r === "string" ? r : (r as { eligible_users_for_job: string }).eligible_users_for_job
      );
    }

    let prefsQuery = serviceClient
      .from("notification_preferences")
      .select("user_id, unsubscribe_token")
      .eq("email_enabled", true)
      .eq("paused", false);
    if (userIds.length > 0) prefsQuery = prefsQuery.in("user_id", userIds);

    const { data: prefs, error: prefsError } = await prefsQuery;
    if (prefsError) throw prefsError;

    const recipients = (prefs ?? []).slice(0, MAX_SENDS);
    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const pref of recipients) {
      try {
        const { data: authUser } = await serviceClient.auth.admin.getUserById(pref.user_id);
        const email = authUser?.user?.email;
        if (!email) continue;
        const html = broadcastEmailHtml(
          job
            ? `${messageToHtml(message)}
               <div style="border:1px solid #e5e7eb;border-radius:8px;padding:16px 18px;margin-top:6px;">
                 <a href="https://pkjobs.lovable.app/jobs/${job.slug || job.id}" style="font-size:16px;font-weight:bold;color:#15522f;text-decoration:none;">${escapeHtml(job.title)}</a>
                 <div style="color:#6b7280;font-size:13px;margin-top:6px;">${escapeHtml(job.department)} • Last date: ${escapeHtml(job.last_date)}</div>
                 <a href="https://pkjobs.lovable.app/jobs/${job.slug || job.id}" style="display:inline-block;margin-top:12px;background:#1d7243;color:#ffffff;text-decoration:none;font-size:13px;font-weight:bold;padding:9px 16px;border-radius:6px;">View job &amp; apply</a>
               </div>`
            : messageToHtml(message),
          pref.unsubscribe_token,
          subject
        );
        const result = await sendResendEmail(serviceClient as unknown as SupabaseLike, {
          to: email,
          subject,
          html,
          unsubscribeToken: pref.unsubscribe_token,
        });
        if (result.skipped) {
          return json({ matched: recipients.length, sent: 0, failed: 0, skipped: result.skipped });
        }
        if (result.error) {
          failed++;
          if (errors.length < 5) errors.push(result.error);
        } else {
          sent++;
        }
      } catch (e) {
        failed++;
        if (errors.length < 5) errors.push(e instanceof Error ? e.message : String(e));
      }
    }

    return json({
      matched: recipients.length,
      sent,
      failed,
      errors,
      truncated: (prefs ?? []).length > MAX_SENDS,
    });
  } catch (e) {
    console.error("email-broadcast failed:", e instanceof Error ? e.message : e);
    return json({ error: "Request failed" }, 500);
  }
});
