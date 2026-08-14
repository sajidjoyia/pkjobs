import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "search_jobs",
  title: "Search government jobs",
  description:
    "Search active Pakistani government job listings by keyword, province, or education level.",
  inputSchema: {
    query: z.string().optional().describe("Keyword matched against job title and department."),
    province: z.string().optional().describe("Province name, e.g. Punjab or Sindh."),
    education_level: z
      .string()
      .optional()
      .describe("Education level value, e.g. matric, intermediate, bachelors, masters, phd."),
    limit: z.number().int().optional().describe("Maximum jobs to return (default 20, max 50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, province, education_level, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const max = Math.min(Math.max(limit ?? 20, 1), 50);

    let q = supabase
      .from("jobs")
      .select(
        "id,title,department,description,required_education_levels,provinces,min_age,max_age,total_seats,last_date,total_fee,advertisement_link"
      )
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(max);

    if (query?.trim()) {
      const safe = query.replace(/[\\%_*]/g, "\\$&").replace(/[,()]/g, " ").trim();
      if (safe) q = q.or(`title.ilike.%${safe}%,department.ilike.%${safe}%`);
    }
    if (province?.trim()) q = q.contains("provinces", [province.trim()]);
    if (education_level?.trim()) q = q.contains("required_education_levels", [education_level.trim()]);

    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const jobs = (data ?? []).map((j) => ({
      ...j,
      url: `https://pkjobs.lovable.app/jobs/${j.id}`,
    }));
    return {
      content: [{ type: "text", text: JSON.stringify(jobs, null, 2) }],
      structuredContent: { jobs, count: jobs.length },
    };
  },
});
