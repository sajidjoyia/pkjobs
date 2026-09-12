import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

const STEP_ORDER = [
  "pending",
  "payment_received",
  "expert_assigned",
  "in_progress",
  "applied",
  "completed",
] as const;

const STEP_LABEL: Record<string, string> = {
  pending: "Submitted — awaiting payment",
  payment_received: "Paid",
  expert_assigned: "Expert assigned",
  in_progress: "Expert working on it",
  applied: "Applied to the department",
  completed: "Completed",
};

export default defineTool({
  name: "track_my_applications",
  title: "Track my application progress",
  description:
    "List the signed-in user's applications with the latest completed step (paid, expert assigned, applied, receipt uploaded) and the timestamps for each milestone.",
  inputSchema: {
    job_id: z.string().optional().describe("Optional job id (UUID) to track a single application."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ job_id }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);

    let q = supabase
      .from("applications")
      .select(
        "id,job_id,status,payment_amount,payment_date,receipt_url,expert_id,notes,created_at,updated_at,jobs(title,department,last_date)"
      )
      .eq("user_id", ctx.getUserId()!)
      .order("created_at", { ascending: false });
    if (job_id?.trim()) q = q.eq("job_id", job_id.trim());

    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const applications = (data ?? []).map((a: Record<string, unknown>) => {
      const status = String(a.status);
      const reached = STEP_ORDER.indexOf(status as (typeof STEP_ORDER)[number]);
      const timeline = [
        { step: "submitted", done: true, at: a.created_at },
        { step: "paid", done: reached >= 1 || Boolean(a.payment_date), at: a.payment_date ?? null },
        { step: "expert_assigned", done: reached >= 2 || Boolean(a.expert_id), at: reached >= 2 ? a.updated_at : null },
        { step: "in_progress", done: reached >= 3, at: reached >= 3 ? a.updated_at : null },
        { step: "applied", done: reached >= 4, at: reached >= 4 ? a.updated_at : null },
        { step: "receipt_uploaded", done: Boolean(a.receipt_url), at: a.receipt_url ? a.updated_at : null },
        { step: "completed", done: reached >= 5, at: reached >= 5 ? a.updated_at : null },
      ];
      const doneSteps = timeline.filter((t) => t.done);
      return {
        application_id: a.id,
        job_id: a.job_id,
        job: a.jobs,
        status,
        status_label: STEP_LABEL[status] ?? status,
        latest_step: doneSteps[doneSteps.length - 1]?.step ?? "submitted",
        latest_step_at: doneSteps[doneSteps.length - 1]?.at ?? a.created_at,
        payment_amount: a.payment_amount,
        receipt_uploaded: Boolean(a.receipt_url),
        notes: a.notes,
        created_at: a.created_at,
        updated_at: a.updated_at,
        timeline,
        url: `https://pkjobs.lovable.app/jobs/${a.job_id}`,
      };
    });

    return {
      content: [{ type: "text", text: JSON.stringify(applications, null, 2) }],
      structuredContent: { applications, count: applications.length },
    };
  },
});
