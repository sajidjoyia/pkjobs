import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2, MailX, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

type State = "checking" | "valid" | "done" | "invalid" | "error";

const EmailUnsubscribe = () => {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<State>("checking");
  const [masked, setMasked] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setState("invalid");
      return;
    }
    (async () => {
      try {
        const res = await fetch(`${FUNCTIONS_URL}/email-unsubscribe?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (data.valid) {
          setMasked(data.masked ?? null);
          setState("valid");
        } else {
          setState("invalid");
        }
      } catch {
        setState("error");
      }
    })();
  }, [token]);

  const confirm = async () => {
    try {
      const res = await fetch(`${FUNCTIONS_URL}/email-unsubscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      setState(data.unsubscribed ? "done" : "error");
    } catch {
      setState("error");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 flex items-start justify-center px-4 py-16 sm:py-24">
        <Card className="w-full max-w-md text-center">
          <CardHeader className="space-y-3">
            {state === "checking" && (
              <>
                <Loader2 className="h-10 w-10 mx-auto animate-spin text-primary" />
                <CardTitle>Checking your unsubscribe link…</CardTitle>
              </>
            )}
            {state === "valid" && (
              <>
                <MailX className="h-10 w-10 mx-auto text-primary" />
                <CardTitle>Stop job alert emails?</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {masked
                    ? `This will turn off email job alerts for ${masked}.`
                    : "This will turn off email job alerts for your account."}{" "}
                  Alerts inside the website keep working. You can turn email alerts back on
                  anytime from your dashboard.
                </p>
              </>
            )}
            {state === "done" && (
              <>
                <CheckCircle2 className="h-10 w-10 mx-auto text-primary" />
                <CardTitle>You're unsubscribed</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Email job alerts are now off for this account. Sign-in and password-reset
                  emails still work normally.
                </p>
              </>
            )}
            {(state === "invalid" || state === "error") && (
              <>
                <XCircle className="h-10 w-10 mx-auto text-destructive" />
                <CardTitle>
                  {state === "invalid" ? "Link not recognised" : "Something went wrong"}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {state === "invalid"
                    ? "This unsubscribe link is invalid or was already used. Open the latest email and use its link."
                    : "Please try again in a moment."}
                </p>
              </>
            )}
          </CardHeader>
          <CardContent>
            {state === "valid" && (
              <Button onClick={confirm} className="w-full">
                Turn off email job alerts
              </Button>
            )}
            {(state === "done" || state === "invalid") && (
              <Button asChild variant="outline" className="w-full">
                <a href="/">Back to PakJobs</a>
              </Button>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default EmailUnsubscribe;
