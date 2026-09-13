import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import GlobalSeoHead from "@/components/seo/GlobalSeoHead";

const ENDPOINT = "https://qrxgpjvhepznplmpctbw.supabase.co/functions/v1/mcp";

type ToolDoc = {
  name: string;
  title: string;
  access: "Any signed-in user" | "Admin only";
  description: string;
  request: unknown;
  response: unknown;
};

const TOOLS: ToolDoc[] = [
  {
    name: "search_jobs",
    title: "Search government jobs",
    access: "Any signed-in user",
    description: "Search active listings by keyword, province or education level.",
    request: { query: "clerk", province: "Punjab", education_level: "intermediate", limit: 5 },
    response: {
      jobs: [
        {
          id: "8f1c…",
          title: "Junior Clerk (BPS-11)",
          department: "Punjab Police",
          required_education_levels: ["intermediate"],
          provinces: ["Punjab"],
          min_age: 18,
          max_age: 30,
          total_seats: 25,
          last_date: "2026-10-15",
          total_fee: 1500,
          url: "https://pkjobs.lovable.app/jobs/8f1c…",
        },
      ],
      count: 1,
    },
  },
  {
    name: "get_job",
    title: "Get job details",
    access: "Any signed-in user",
    description: "Full details of one listing, including the fee breakdown.",
    request: { job_id: "8f1c0f4e-2b5a-4c9d-9a11-0e2d4f6a7b88" },
    response: {
      job: {
        id: "8f1c…",
        title: "Junior Clerk (BPS-11)",
        department: "Punjab Police",
        description: "Clerical post in the district office.",
        expert_fee: 1000,
        bank_challan_fee: 300,
        photocopy_fee: 100,
        post_office_fee: 100,
        total_fee: 1500,
        last_date: "2026-10-15",
        is_active: true,
      },
    },
  },
  {
    name: "get_my_profile",
    title: "Get my profile",
    access: "Any signed-in user",
    description: "The signed-in user's profile used for eligibility matching.",
    request: {},
    response: {
      profile: {
        full_name: "Ahmed Raza",
        date_of_birth: "2001-04-12",
        gender: "male",
        province: "Punjab",
        domicile: "Lahore",
        phone: "+92300…",
      },
    },
  },
  {
    name: "check_my_eligibility",
    title: "Check my eligibility for a job",
    access: "Any signed-in user",
    description: "Per-criterion verdict with the exact reasons you do or do not qualify.",
    request: { job_id: "8f1c0f4e-2b5a-4c9d-9a11-0e2d4f6a7b88" },
    response: {
      eligible: false,
      checks: [
        {
          criterion: "age",
          passed: true,
          requirement: "18-30 years",
          your_value: "25 years",
          reason: "Your age (25) is within the allowed range 18-30.",
        },
        {
          criterion: "education_level",
          passed: false,
          requirement: "bachelor",
          your_value: "intermediate",
          reason: "Your highest education (intermediate) is below the required level (bachelor).",
        },
      ],
      why_eligible: ["Your age (25) is within the allowed range 18-30."],
      why_not_eligible: [
        "Your highest education (intermediate) is below the required level (bachelor).",
      ],
    },
  },
  {
    name: "list_my_applications",
    title: "List my applications",
    access: "Any signed-in user",
    description: "Applications with status, payment info and linked job details.",
    request: { status: "pending" },
    response: {
      applications: [
        {
          id: "a11b…",
          job_id: "8f1c…",
          status: "pending",
          payment_amount: 1500,
          created_at: "2026-09-01T10:12:00Z",
          jobs: { title: "Junior Clerk (BPS-11)", department: "Punjab Police", last_date: "2026-10-15" },
        },
      ],
    },
  },
  {
    name: "track_my_applications",
    title: "Track my application progress",
    access: "Any signed-in user",
    description: "Latest milestone (paid, expert assigned, applied, receipt uploaded) with timestamps.",
    request: { job_id: "8f1c0f4e-2b5a-4c9d-9a11-0e2d4f6a7b88" },
    response: {
      applications: [
        {
          application_id: "a11b…",
          status: "expert_assigned",
          status_label: "Expert assigned",
          latest_step: "expert_assigned",
          latest_step_at: "2026-09-05T08:40:00Z",
          receipt_uploaded: false,
          timeline: [
            { step: "submitted", done: true, at: "2026-09-01T10:12:00Z" },
            { step: "paid", done: true, at: "2026-09-03T14:02:00Z" },
            { step: "expert_assigned", done: true, at: "2026-09-05T08:40:00Z" },
            { step: "applied", done: false, at: null },
          ],
        },
      ],
      count: 1,
    },
  },
  {
    name: "apply_to_job",
    title: "Apply to a job",
    access: "Any signed-in user",
    description: "Submit an application. Fails if you already applied to that job.",
    request: { job_id: "8f1c0f4e-2b5a-4c9d-9a11-0e2d4f6a7b88" },
    response: {
      application: {
        id: "a11b…",
        job_id: "8f1c…",
        status: "pending",
        payment_amount: 1500,
        created_at: "2026-09-12T04:20:00Z",
      },
    },
  },
  {
    name: "create_job",
    title: "Create a job listing",
    access: "Admin only",
    description: "Publish a new listing with education, age, gender, domicile, deadline, seats and fees.",
    request: {
      title: "Junior Clerk (BPS-11)",
      department: "Punjab Police",
      description: "Clerical post in the district office.",
      required_education_levels: ["intermediate"],
      min_age: 18,
      max_age: 30,
      gender_requirement: "male",
      domicile: "Punjab",
      provinces: ["Punjab"],
      last_date: "2026-10-15",
      total_seats: 25,
      expert_fee: 1000,
      bank_challan_fee: 300,
      photocopy_fee: 100,
      post_office_fee: 100,
    },
    response: {
      job: {
        id: "8f1c…",
        title: "Junior Clerk (BPS-11)",
        total_fee: 1500,
        is_active: true,
        url: "https://pkjobs.lovable.app/jobs/8f1c…",
      },
    },
  },
];

const CodeBlock = ({ label, value }: { label: string; value: unknown }) => {
  const text = JSON.stringify(value, null, 2);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2"
          onClick={() => {
            navigator.clipboard.writeText(text);
            toast.success("Copied");
          }}
        >
          <Copy className="h-3.5 w-3.5" />
        </Button>
      </div>
      <pre className="overflow-x-auto rounded-md border bg-muted p-3 text-xs leading-relaxed">
        <code>{text}</code>
      </pre>
    </div>
  );
};

const McpDocs = () => (
  <div className="container mx-auto max-w-4xl px-4 py-10">
    <GlobalSeoHead
      pageTitle="Agent (MCP) tools & API reference | PakJobs"
      pageDescription="Sample requests and responses for every PakJobs agent tool: search jobs, check eligibility, track applications, apply, and create listings."
    />

    <h1 className="font-serif text-3xl font-bold">Agent tools (MCP) reference</h1>
    <p className="mt-2 text-muted-foreground">
      Connect an AI assistant to PakJobs and use these tools on your own account. Every call runs as the
      signed-in user, so you only ever see your own data.
    </p>

    <Card className="mt-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Connect your agent</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Add this server URL in ChatGPT, Claude, Cursor or any MCP client, then approve the sign-in
          screen that appears.
        </p>
        <div className="flex items-center gap-2 rounded-md border bg-muted p-3">
          <code className="flex-1 break-all text-xs">{ENDPOINT}</code>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            onClick={() => {
              navigator.clipboard.writeText(ENDPOINT);
              toast.success("Endpoint copied");
            }}
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>

    <div className="mt-8 space-y-6">
      {TOOLS.map((tool) => (
        <Card key={tool.name} id={tool.name}>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="font-mono text-base">{tool.name}</CardTitle>
              <Badge variant={tool.access === "Admin only" ? "destructive" : "secondary"}>
                {tool.access}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{tool.description}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <CodeBlock label="Sample request" value={tool.request} />
            <CodeBlock label="Sample response" value={tool.response} />
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

export default McpDocs;
