import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_job",
  title: "Get job details",
  description: "Fetch the full details of a single job listing by its id, including fee breakdown.",
  inputSchema: { job_id: z.string().describe("The job id (UUID).") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ job_id }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase.from("jobs").select("*").eq("id", job_id).maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data) return { content: [{ type: "text", text: "No job found with that id." }], isError: true };

    const job = { ...data, url: `https://pkjobs.lovable.app/jobs/${data.id}` };
    return {
      content: [{ type: "text", text: JSON.stringify(job, null, 2) }],
      structuredContent: { job },
    };
  },
});
