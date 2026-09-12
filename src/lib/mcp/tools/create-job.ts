import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "create_job",
  title: "Create a job listing (admin)",
  description:
    "Admin only. Create a new government job listing with title, department, education requirements, age limits, gender, domicile/provinces, deadline, seats and fee breakdown.",
  inputSchema: {
    title: z.string().describe("Job title, e.g. Junior Clerk (BPS-11)."),
    department: z.string().describe("Hiring department or organisation."),
    description: z.string().optional().describe("Full job description / details."),
    required_education_levels: z
      .array(z.string())
      .optional()
      .describe("Education levels: matric, intermediate, bachelor, master, phd."),
    required_education_fields: z
      .array(z.string())
      .optional()
      .describe("Education field ids (UUIDs) for specialization requirements."),
    min_age: z.number().int().optional().describe("Minimum age in years (default 18)."),
    max_age: z.number().int().optional().describe("Maximum age in years (default 30)."),
    gender_requirement: z
      .string()
      .optional()
      .describe("One of male, female, other. Omit for no gender restriction."),
    domicile: z.string().optional().describe("Required domicile, e.g. Punjab."),
    provinces: z.array(z.string()).optional().describe("Provinces eligible to apply."),
    last_date: z.string().describe("Application deadline as YYYY-MM-DD."),
    total_seats: z.number().int().optional().describe("Number of vacancies (default 1)."),
    expert_fee: z.number().optional().describe("Expert service fee in PKR."),
    bank_challan_fee: z.number().optional().describe("Bank challan fee in PKR."),
    photocopy_fee: z.number().optional().describe("Photocopy / documentation fee in PKR."),
    post_office_fee: z.number().optional().describe("Post office / courier fee in PKR."),
    advertisement_link: z.string().optional().describe("Link to the official advertisement."),
    advertisement_image: z.string().optional().describe("Image URL of the advertisement."),
    is_active: z.boolean().optional().describe("Whether the listing is visible (default true)."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const userId = ctx.getUserId();

    const { data: isAdmin, error: roleError } = await supabase.rpc("has_role", {
      _user_id: userId!,
      _role: "admin",
    });
    if (roleError) return { content: [{ type: "text", text: roleError.message }], isError: true };
    if (!isAdmin) {
      return {
        content: [{ type: "text", text: "Only administrators can create job listings." }],
        isError: true,
      };
    }

    const gender = input.gender_requirement?.trim().toLowerCase();
    if (gender && !["male", "female", "other"].includes(gender)) {
      return {
        content: [{ type: "text", text: "gender_requirement must be male, female or other." }],
        isError: true,
      };
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.last_date)) {
      return { content: [{ type: "text", text: "last_date must be in YYYY-MM-DD format." }], isError: true };
    }

    const expert = input.expert_fee ?? 0;
    const challan = input.bank_challan_fee ?? 0;
    const photocopy = input.photocopy_fee ?? 0;
    const post = input.post_office_fee ?? 0;

    const { data, error } = await supabase
      .from("jobs")
      .insert({
        title: input.title.trim(),
        department: input.department.trim(),
        description: input.description ?? null,
        required_education_levels: input.required_education_levels ?? null,
        required_education_fields: input.required_education_fields ?? null,
        min_age: input.min_age ?? 18,
        max_age: input.max_age ?? 30,
        gender_requirement: (gender ?? null) as never,
        domicile: input.domicile ?? null,
        provinces: input.provinces ?? null,
        last_date: input.last_date,
        total_seats: input.total_seats ?? 1,
        expert_fee: expert,
        bank_challan_fee: challan,
        photocopy_fee: photocopy,
        post_office_fee: post,
        total_fee: expert + challan + photocopy + post,
        advertisement_link: input.advertisement_link ?? null,
        advertisement_image: input.advertisement_image ?? null,
        is_active: input.is_active ?? true,
        created_by: userId!,
      })
      .select("*")
      .single();

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const job = { ...data, url: `https://pkjobs.lovable.app/jobs/${data.id}` };
    return {
      content: [{ type: "text", text: `Job created.\n${JSON.stringify(job, null, 2)}` }],
      structuredContent: { job },
    };
  },
});
