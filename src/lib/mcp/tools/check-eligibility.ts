import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";
import { evaluateEligibility } from "../eligibility";

export default defineTool({
  name: "check_my_eligibility",
  title: "Check my eligibility for a job",
  description:
    "Check whether the signed-in user is eligible for a specific job, with the exact reasons for each criterion (age, gender, education level, specialization, province, deadline).",
  inputSchema: { job_id: z.string().describe("The job id (UUID) to evaluate.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ job_id }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const userId = ctx.getUserId();

    const [jobRes, profileRes, eduRes, fieldsRes] = await Promise.all([
      supabase.from("jobs").select("*").eq("id", job_id).maybeSingle(),
      supabase.from("profiles").select("*").eq("user_id", userId!).maybeSingle(),
      supabase.from("user_educations").select("education_level,education_field_id").eq("user_id", userId!),
      supabase.from("education_fields").select("id,education_level,display_name"),
    ]);

    if (jobRes.error) return { content: [{ type: "text", text: jobRes.error.message }], isError: true };
    if (!jobRes.data) return { content: [{ type: "text", text: "No job found with that id." }], isError: true };
    if (profileRes.error) return { content: [{ type: "text", text: profileRes.error.message }], isError: true };
    if (!profileRes.data) {
      return {
        content: [{ type: "text", text: "No profile found. Complete your profile to check eligibility." }],
        isError: true,
      };
    }

    const result = evaluateEligibility(
      profileRes.data as never,
      jobRes.data as never,
      (eduRes.data ?? []) as never,
      (fieldsRes.data ?? []) as never
    );

    const payload = {
      job: { id: jobRes.data.id, title: jobRes.data.title, department: jobRes.data.department },
      eligible: result.eligible,
      checks: result.checks,
      why_eligible: result.passed_reasons,
      why_not_eligible: result.failed_reasons,
    };

    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  },
});
