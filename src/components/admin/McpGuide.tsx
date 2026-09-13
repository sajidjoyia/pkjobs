import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Copy, ExternalLink, ShieldCheck, Bot, Settings2 } from "lucide-react";
import { toast } from "sonner";

const ENDPOINT = "https://qrxgpjvhepznplmpctbw.supabase.co/functions/v1/mcp";

const TOOLS: { name: string; what: string; access: "Any signed-in user" | "Admin only" }[] = [
  { name: "search_jobs", what: "Find active job listings by keyword, province or education level.", access: "Any signed-in user" },
  { name: "get_job", what: "Read the full detail of one job listing.", access: "Any signed-in user" },
  { name: "get_my_profile", what: "Read the signed-in person's profile and education records.", access: "Any signed-in user" },
  { name: "check_my_eligibility", what: "Explain, point by point, why the person is or is not eligible for a job.", access: "Any signed-in user" },
  { name: "list_my_applications", what: "List the person's applications with current status.", access: "Any signed-in user" },
  { name: "track_my_applications", what: "Show each application's latest step (paid, expert assigned, applied, receipt uploaded) with dates.", access: "Any signed-in user" },
  { name: "apply_to_job", what: "Submit an application for the signed-in person.", access: "Any signed-in user" },
  { name: "create_job", what: "Post a new job listing with education, age, gender, domicile, deadline, seats and fees.", access: "Admin only" },
];

const copy = (text: string, label: string) => {
  navigator.clipboard.writeText(text);
  toast.success(`${label} copied`);
};

const McpGuide = () => (
  <div className="space-y-6">
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Bot className="h-4 w-4 text-primary" /> What this is
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>
          People can connect an AI assistant (ChatGPT, Claude, Cursor and similar) to PakJobs. The
          assistant can then search jobs, check eligibility, track applications and apply — all on
          behalf of the person who connected it.
        </p>
        <p>
          Nothing is shared automatically. The assistant only works after the person signs in on our
          approval screen, and it can only see that person's own data — exactly the same limits as the
          website itself.
        </p>
      </CardContent>
    </Card>

    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Settings2 className="h-4 w-4 text-primary" /> How to set it up
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <ol className="list-decimal space-y-3 pl-5 text-muted-foreground">
          <li>
            Publish the site. The assistant connection goes live with the published version, so any
            change here only reaches assistants after a new publish.
          </li>
          <li>
            Copy the connection address below and paste it into the assistant's "add connector /
            add MCP server" box.
            <div className="mt-2 flex items-center gap-2 rounded-md border bg-muted p-2">
              <code className="flex-1 break-all text-xs">{ENDPOINT}</code>
              <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => copy(ENDPOINT, "Address")}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          </li>
          <li>
            The assistant opens our sign-in and approval page. Sign in with the account whose data the
            assistant should use, then press Approve.
          </li>
          <li>
            To use the admin tool (posting jobs), approve with an account that has the admin role.
            Roles are managed in the <strong>Users</strong> tab — that is the only setting that
            controls who can post jobs from an assistant.
          </li>
          <li>
            To cut off an assistant, remove or change the account's access in the{" "}
            <strong>Users</strong> tab, or have the person sign out of that assistant's connection.
          </li>
        </ol>
        <Separator />
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href="/mcp-docs" target="_blank" rel="noreferrer" className="gap-1.5">
              Open public reference page <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => copy(`${window.location.origin}/mcp-docs`, "Link")}>
            <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy link to share with users
          </Button>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">What an assistant can do</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {TOOLS.map((tool) => (
          <div key={tool.name} className="flex flex-wrap items-start gap-x-3 gap-y-1 rounded-md border p-3">
            <code className="font-mono text-xs font-semibold text-foreground">{tool.name}</code>
            <Badge variant={tool.access === "Admin only" ? "destructive" : "secondary"} className="text-[10px]">
              {tool.access}
            </Badge>
            <p className="w-full text-sm text-muted-foreground">{tool.what}</p>
          </div>
        ))}
      </CardContent>
    </Card>

    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-4 w-4 text-primary" /> Safety
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <p>Every request must carry a signed-in approval — anonymous assistants get nothing.</p>
        <p>A normal user's assistant can never read another person's profile, documents or chats.</p>
        <p>Posting jobs is blocked unless the approving account has the admin role.</p>
      </CardContent>
    </Card>
  </div>
);

export default McpGuide;
