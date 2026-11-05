import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

// Public unsubscribe endpoint: GET validates a token, POST stops email alerts for that user.
// Token is a secret UUID stored on notification_preferences; without it nothing is exposed.

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function maskEmailForToken(token: string): Promise<{ valid: boolean; masked: string | null }> {
  const { data: pref } = await supabase
    .from("notification_preferences")
    .select("user_id, email_enabled")
    .eq("unsubscribe_token", token)
    .maybeSingle();
  if (!pref) return { valid: false, masked: null };

  try {
    const { data: authUser } = await supabase.auth.admin.getUserById(pref.user_id);
    const email = authUser?.user?.email ?? null;
    if (!email) return { valid: true, masked: null };
    const [local, domain] = email.split("@");
    const masked = `${local.slice(0, 1)}${"*".repeat(Math.max(local.length - 1, 2))}@${domain}`;
    return { valid: true, masked };
  } catch {
    return { valid: true, masked: null };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const token =
      req.method === "GET" ? url.searchParams.get("token") : (await req.json().catch(() => ({})))?.token;

    if (typeof token !== "string" || !token) {
      return json({ error: "token is required" }, 400);
    }

    if (req.method === "GET") {
      const { valid, masked } = await maskEmailForToken(token);
      return json({ valid, masked });
    }

    // POST — one-click unsubscribe
    const { data, error } = await supabase
      .from("notification_preferences")
      .update({ email_enabled: false })
      .eq("unsubscribe_token", token)
      .select("user_id");
    if (error) throw error;
    if (!data || data.length === 0) return json({ unsubscribed: false, valid: false }, 404);
    return json({ unsubscribed: true });
  } catch (e) {
    console.error("email-unsubscribe failed:", e instanceof Error ? e.message : e);
    return json({ error: "Something went wrong. Please try again." }, 500);
  }
});
