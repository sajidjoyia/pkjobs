import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertCircle } from "lucide-react";

/**
 * Listens for auth refresh failures and shows a banner so users can re-authenticate
 * instead of seeing silent 401s. Triggers on SIGNED_OUT events that happen while the
 * tab is still loaded (auto-detected stale refresh tokens).
 */
const SessionExpiredBanner = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let hadSession = false;
    supabase.auth.getSession().then(({ data }) => {
      hadSession = !!data.session;
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" && hadSession) {
        setShow(true);
      }
      if (event === "TOKEN_REFRESHED" && session) {
        setShow(false);
        hadSession = true;
      }
      if (event === "SIGNED_IN") {
        hadSession = true;
        setShow(false);
      }
    });

    // Also catch failed refresh attempts via global fetch errors (PostgREST 401)
    const onUnhandled = (e: PromiseRejectionEvent) => {
      const msg = String(e.reason?.message || e.reason || "");
      if (msg.includes("JWT") && msg.includes("expired")) setShow(true);
    };
    window.addEventListener("unhandledrejection", onUnhandled);
    return () => {
      sub.subscription.unsubscribe();
      window.removeEventListener("unhandledrejection", onUnhandled);
    };
  }, []);

  if (!show) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-[100] bg-destructive text-destructive-foreground shadow-lg">
      <div className="container flex items-center justify-between gap-3 py-2 text-sm">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Your session has expired. Please refresh to continue.</span>
        </div>
        <Button size="sm" variant="secondary" onClick={() => window.location.reload()} className="gap-1.5">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>
    </div>
  );
};

export default SessionExpiredBanner;
