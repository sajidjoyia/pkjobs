import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "apply_to_job",
  title: "Apply to a job",
  description:
    "Submit an application for the signed-in user to a job listing. Fails if an application already exists.",
  inputSchema: { job_id: z.string().describe("The job id (UUID) to apply for.") },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ job_id }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const userId = ctx.getUserId();

    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id,title,total_fee,is_active")
      .eq("id", job_id)
      .maybeSingle();
    if (jobError) return { content: [{ type: "text", text: jobError.message }], isError: true };
    if (!job || !job.is_active) {
      return { content: [{ type: "text", text: "This job is not available." }], isError: true };
    }

    const { data: existing } = await supabase
      .from("applications")
      .select("id")
      .eq("user_id", userId!)
      .eq("job_id", job_id)
      .maybeSingle();
    if (existing) {
      return {
        content: [{ type: "text", text: "You have already applied for this job." }],
        isError: true,
      };
    }

    const { data, error } = await supabase
      .from("applications")
      .insert({ user_id: userId!, job_id, payment_amount: job.total_fee, status: "pending" })
      .select("id,job_id,status,payment_amount,created_at")
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    return {
      content: [
        { type: "text", text: `Application submitted for "${job.title}". ${JSON.stringify(data)}` },
      ],
      structuredContent: { application: data },
    };
  },
});
