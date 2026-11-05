import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import {
  isResendConfigured,
  loadSenderConfig,
  sendResendEmail,
  testEmailHtml,
  SupabaseLike,
} from "../_shared/email.ts";

const url = Deno.env.get("SUPABASE_URL")!;
const serviceClient = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

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

async function ensureUnsubscribeToken(userId: string): Promise<string | null> {
  const { data: pref } = await serviceClient
    .from("notification_preferences")
    .select("unsubscribe_token")
    .eq("user_id", userId)
    .maybeSingle();
  if (pref?.unsubscribe_token) return pref.unsubscribe_token;
  const { data: created } = await serviceClient
    .from("notification_preferences")
    .upsert({ user_id: userId }, { onConflict: "user_id" })
    .select("unsubscribe_token")
    .single();
  return created?.unsubscribe_token ?? null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const admin = await requireAdmin(req);
    if (!admin) return json({ error: "Admin access required" }, 403);

    if (req.method === "GET") {
      const sender = await loadSenderConfig(serviceClient as unknown as SupabaseLike);
      return json({ resend_connected: isResendConfigured(), sender });
    }

    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const testEmail =
        typeof body?.test_email === "string" && body.test_email.includes("@")
          ? body.test_email.trim()
          : admin.user.email;
      if (!testEmail) return json({ error: "No email address to send the test to" }, 400);

      const token = await ensureUnsubscribeToken(admin.user.id);
      if (!token) return json({ error: "Could not prepare unsubscribe token" }, 500);

      const sender = await loadSenderConfig(serviceClient as unknown as SupabaseLike);
      const result = await sendResendEmail(serviceClient as unknown as SupabaseLike, {
        to: testEmail,
        subject: "PakJobs test email — job alerts are working",
        html: testEmailHtml(token, sender?.from_name ?? "PakJobs"),
        unsubscribeToken: token,
      });
      return json(result);
    }

    return json({ error: "Method not allowed" }, 405);
  } catch (e) {
    console.error("email-status failed:", e instanceof Error ? e.message : e);
    return json({ error: "Request failed" }, 500);
  }
});
