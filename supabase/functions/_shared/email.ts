// Shared email sending for PakJobs — uses the Resend connection (connected later via Lovable connectors).
// When the Resend connection is not linked yet, every send is skipped with a clear reason (no errors).

export const SITE_URL = "https://pkjobs.lovable.app";
const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

const GREEN = "#1d7243";
const GREEN_DARK = "#15522f";
const GOLD = "#c9a227";
const TEXT = "#1f2937";
const MUTED = "#6b7280";
const BORDER = "#e5e7eb";

export interface EmailJob {
  id: string;
  slug?: string | null;
  title: string;
  department: string;
  last_date: string;
  total_seats: number | null;
  total_fee?: number | null;
}

export interface SenderConfig {
  from_email: string;
  from_name: string;
  reply_to: string | null;
}

export type SupabaseLike = {
  from: (table: string) => {
    select: (cols: string) => {
      eq: (col: string, val: unknown) => {
        maybeSingle: () => Promise<{ data: SenderConfig | null }>;
      };
    };
  };
};

export function isResendConfigured(): boolean {
  return Boolean(Deno.env.get("LOVABLE_API_KEY") && Deno.env.get("RESEND_API_KEY"));
}

export function jobUrl(job: EmailJob): string {
  return `${SITE_URL}/jobs/${job.slug || job.id}`;
}

export function formatSeats(seats: number | null): string {
  return !seats || seats < 1 ? "Seats not specified" : `${seats} seat${seats === 1 ? "" : "s"}`;
}

export function formatFee(fee: number | null | undefined): string {
  return fee && fee > 0 ? `PKR ${fee}` : "Fee not specified";
}

export async function loadSenderConfig(
  supabase: SupabaseLike
): Promise<SenderConfig | null> {
  const { data } = await supabase
    .from("email_sender_config")
    .select("from_email,from_name,reply_to")
    .eq("id", true)
    .maybeSingle();
  return data;
}

export function unsubscribeLink(token: string): string {
  return `${SITE_URL}/email-unsubscribe?token=${encodeURIComponent(token)}`;
}

// ---------- Layout ----------

function layout(bodyHtml: string, heading: string, unsubUrl: string): string {
  return `<!doctype html>
<html lang="en" dir="ltr"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f4f6f4;font-family:Arial,Helvetica,sans-serif;color:${TEXT};">
<div style="max-width:640px;margin:0 auto;background:#ffffff;">
  <div style="background:${GREEN};padding:18px 28px;">
    <span style="color:#ffffff;font-size:20px;font-weight:bold;letter-spacing:0.5px;">PakJobs</span>
    <span style="color:${GOLD};font-size:12px;margin-left:10px;">GOVERNMENT JOB APPLICATION SERVICE</span>
  </div>
  <div style="padding:28px;">
    <h1 style="margin:0 0 16px;font-size:22px;color:${GREEN_DARK};">${heading}</h1>
    ${bodyHtml}
  </div>
  <div style="padding:16px 28px;border-top:1px solid ${BORDER};color:${MUTED};font-size:12px;line-height:1.6;">
    You are receiving this email because you turned on email job alerts in your PakJobs dashboard.<br />
    <a href="${unsubUrl}" style="color:${GREEN};">Unsubscribe from email job alerts</a>
  </div>
</div>
</body></html>`;
}

function jobRow(job: EmailJob): string {
  return `
  <div style="border:1px solid ${BORDER};border-radius:8px;padding:16px 18px;margin-bottom:14px;">
    <a href="${jobUrl(job)}" style="font-size:16px;font-weight:bold;color:${GREEN_DARK};text-decoration:none;">${escapeHtml(job.title)}</a>
    <div style="color:${MUTED};font-size:13px;margin-top:6px;">${escapeHtml(job.department)}</div>
    <div style="margin-top:10px;font-size:13px;line-height:1.7;">
      <div><strong>Last date:</strong> ${escapeHtml(job.last_date)}</div>
      <div><strong>Seats:</strong> ${formatSeats(job.total_seats)}</div>
      <div><strong>Service fee:</strong> ${formatFee(job.total_fee)}</div>
    </div>
    <a href="${jobUrl(job)}" style="display:inline-block;margin-top:12px;background:${GREEN};color:#ffffff;text-decoration:none;font-size:13px;font-weight:bold;padding:9px 16px;border-radius:6px;">View details &amp; apply</a>
  </div>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ---------- Templates ----------

export function jobMatchEmailHtml(job: EmailJob, token: string): string {
  const body = `
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">A new government job matching your profile was just posted on PakJobs:</p>
    ${jobRow(job)}
    <p style="margin:16px 0 0;font-size:13px;color:${MUTED};">Apply before the last date — our experts complete and submit the application for you.</p>`;
  return layout(body, "New job match for you 🎯", unsubscribeLink(token));
}

export function digestEmailHtml(jobs: EmailJob[], token: string): string {
  const body = `
    <p style="margin:0 0 18px;font-size:15px;line-height:1.6;">${jobs.length} new government job${jobs.length === 1 ? "" : "s"} matching your profile today:</p>
    ${jobs.map((j) => jobRow(j)).join("")}
    <p style="margin:16px 0 0;font-size:13px;color:${MUTED};">Apply before the last date — our experts complete and submit the application for you.</p>`;
  return layout(body, "Today's matching jobs 📋", unsubscribeLink(token));
}

export function broadcastEmailHtml(messageHtml: string, token: string, heading: string): string {
  return layout(messageHtml, heading, unsubscribeLink(token));
}

export function testEmailHtml(token: string, senderName: string): string {
  const sample: EmailJob = {
    id: "00000000-0000-0000-0000-000000000000",
    slug: null,
    title: "Sample: Junior Clerk (BPS-11)",
    department: "Sample Department",
    last_date: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
    total_seats: 25,
    total_fee: 1500,
  };
  const body = `
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">This is a test email from ${escapeHtml(senderName)} to confirm job alert emails are working. Below is a preview of what a job alert looks like:</p>
    ${jobRow(sample)}
    <p style="margin:16px 0 0;font-size:13px;color:${MUTED};">Real alerts use real job details and links.</p>`;
  return layout(body, "Test email — it works! ✅", unsubscribeLink(token));
}

// ---------- Sending ----------

export interface SendResult {
  sent?: boolean;
  skipped?: string;
  error?: string;
}

export async function sendResendEmail(
  supabase: SupabaseLike,
  opts: {
    to: string;
    subject: string;
    html: string;
    unsubscribeToken: string;
  }
): Promise<SendResult> {
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  const connectionKey = Deno.env.get("RESEND_API_KEY");
  if (!lovableKey || !connectionKey) {
    return { skipped: "Resend is not connected yet (see Admin → Alerts setup guide)" };
  }

  const cfg = await loadSenderConfig(supabase);
  if (!cfg?.from_email) {
    return { skipped: "From email not configured yet (see Admin → Alerts setup guide)" };
  }

  const unsub = unsubscribeLink(opts.unsubscribeToken);
  const res = await fetch(`${GATEWAY_URL}/emails`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": connectionKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${cfg.from_name} <${cfg.from_email}>`,
      to: [opts.to],
      subject: opts.subject,
      html: opts.html,
      reply_to: cfg.reply_to || undefined,
      headers: {
        "List-Unsubscribe": `<${unsub}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    return { error: `Resend ${res.status}: ${body.slice(0, 300)}` };
  }
  return { sent: true };
}
