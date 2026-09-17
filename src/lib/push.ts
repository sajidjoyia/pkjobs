import { supabase } from "@/integrations/supabase/client";

export type PushResult =
  | { status: "registered"; token: string }
  | { status: "not-configured" | "unsupported" | "open-in-new-tab" | "denied" | "error"; message?: string };

const appId = import.meta.env.VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_APP_ID as string | undefined;
const vapidKey = import.meta.env.VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_VAPID_KEY as string | undefined;

const firebaseConfig = {
  apiKey: import.meta.env.VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_WEB_API_KEY as string | undefined,
  projectId: import.meta.env.VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_PROJECT_ID as string | undefined,
  appId,
  messagingSenderId: appId?.split(":")[1] ?? "",
};

export const isPushConfigured = () =>
  Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && appId && vapidKey && firebaseConfig.messagingSenderId);

/** Must be called from a click handler — browsers ignore permission requests without a user gesture. */
export async function enablePush(): Promise<PushResult> {
  if (!isPushConfigured()) return { status: "not-configured" };

  try {
    const { initializeApp, getApps } = await import("firebase/app");
    const { getMessaging, getToken, isSupported } = await import("firebase/messaging");

    if (!("Notification" in window) || !(await isSupported())) return { status: "unsupported" };
    if (window.top !== window.self) return { status: "open-in-new-tab" };

    const permission =
      Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
    if (permission !== "granted") return { status: "denied" };

    const query = new URLSearchParams(firebaseConfig as Record<string, string>).toString();
    const serviceWorkerRegistration = await navigator.serviceWorker.register(
      `/firebase-messaging-sw.js?${query}`
    );
    const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig as never);
    const messaging = getMessaging(app);
    const token = await getToken(messaging, { vapidKey: vapidKey!, serviceWorkerRegistration });
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
