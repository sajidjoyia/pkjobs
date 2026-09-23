import { supabase } from "@/integrations/supabase/client";

export type PushResult =
  | { status: "registered"; token: string }
  | { status: "not-configured" | "unsupported" | "open-in-new-tab" | "denied" | "error"; message?: string };

export interface PushWebConfig {
  apiKey: string;
  projectId: string;
  appId: string;
  vapidKey: string;
  messagingSenderId: string;
}

const envAppId = import.meta.env.VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_APP_ID as string | undefined;
const envConfig = {
  apiKey: import.meta.env.VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_WEB_API_KEY as string | undefined,
  projectId: import.meta.env.VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_PROJECT_ID as string | undefined,
  appId: envAppId,
  vapidKey: import.meta.env.VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_VAPID_KEY as string | undefined,
};

const build = (c: {
  apiKey?: string | null;
  projectId?: string | null;
  appId?: string | null;
  vapidKey?: string | null;
}): PushWebConfig | null => {
  const senderId = c.appId?.split(":")[1] ?? "";
  if (!c.apiKey || !c.projectId || !c.appId || !c.vapidKey || !senderId) return null;
  return {
    apiKey: c.apiKey,
    projectId: c.projectId,
    appId: c.appId,
    vapidKey: c.vapidKey,
    messagingSenderId: senderId,
  };
};

let cached: PushWebConfig | null | undefined;

/** Reads the Firebase web settings saved in the admin panel, falling back to connector env vars. */
export async function fetchPushConfig(): Promise<PushWebConfig | null> {
  if (cached !== undefined) return cached;

  const fromEnv = build(envConfig);
  if (fromEnv) {
    cached = fromEnv;
    return cached;
  }

  const { data, error } = await supabase.rpc("get_push_web_config");
  const row = Array.isArray(data) ? data[0] : data;
  cached = error || !row
    ? null
    : build({
        apiKey: row.web_api_key,
        projectId: row.project_id,
        appId: row.app_id,
        vapidKey: row.vapid_key,
      });
  return cached;
}

export const clearPushConfigCache = () => {
  cached = undefined;
};

/** Must be called from a click handler — browsers ignore permission requests without a user gesture. */
export async function enablePush(): Promise<PushResult> {
  const config = await fetchPushConfig();
  if (!config) return { status: "not-configured" };

  try {
    const { initializeApp, getApps } = await import("firebase/app");
    const { getMessaging, getToken, isSupported } = await import("firebase/messaging");

    if (!("Notification" in window) || !(await isSupported())) return { status: "unsupported" };
    if (window.top !== window.self) return { status: "open-in-new-tab" };

    const permission =
      Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
    if (permission !== "granted") return { status: "denied" };

    const { vapidKey, ...firebaseConfig } = config;
    const query = new URLSearchParams(firebaseConfig as unknown as Record<string, string>).toString();
    const serviceWorkerRegistration = await navigator.serviceWorker.register(
      `/firebase-messaging-sw.js?${query}`
    );
    const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig as never);
    const messaging = getMessaging(app);
    const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration });
    if (!token) return { status: "denied" };

    const { data: auth } = await supabase.auth.getUser();
    if (auth.user) {
      await supabase.from("push_subscriptions").upsert(
        {
          user_id: auth.user.id,
          fcm_token: token,
          user_agent: navigator.userAgent,
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: "fcm_token" }
      );
    }

    return { status: "registered", token };
  } catch (e) {
    return { status: "error", message: e instanceof Error ? e.message : String(e) };
  }
}
