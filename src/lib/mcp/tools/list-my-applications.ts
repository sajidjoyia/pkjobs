import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_my_applications",
  title: "List my applications",
  description:
    "List the signed-in user's job applications with their current status and linked job details.",
  inputSchema: {
    status: z
      .string()
      .optional()
      .describe("Optional status filter, e.g. pending, in_progress, completed."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let q = supabase
      .from("applications")
      .select("id,job_id,status,payment_amount,payment_date,notes,created_at,jobs(title,department,last_date)")
      .eq("user_id", ctx.getUserId())
      .order("created_at", { ascending: false });
    if (status?.trim()) q = q.eq("status", status.trim() as never);

    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { applications: data ?? [] },
    };
  },
});
