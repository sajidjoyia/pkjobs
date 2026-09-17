# Job Alerts: Email, Browser Push and WhatsApp

Today the site already creates in-app bell alerts when a new job matches a user. This plan adds real outside-the-site alerts, with each user choosing how and how often they are contacted.

## What users will get

**Alert settings** — a new "Alerts" section shown in two places:
- During profile setup, as a friendly opt-in step (channels default to off, in-app stays on).
- In the dashboard settings, so they can change or turn everything off any time.

Each user picks:
- Channels: Email, Browser notifications, WhatsApp (only appears once WhatsApp is enabled).
- Frequency: Instantly, or one daily summary.
- A master "pause all job alerts" switch.
- Emails also carry a one-click unsubscribe link.

**Instant alerts** — when an admin posts a job, everyone eligible and set to "instant" gets their chosen alert within a minute.

**Daily summary** — once a day at a fixed time (default 9:00 AM Pakistan time), users on "daily" get one message listing all new matching jobs from the last 24 hours. No matches means no message.

Every alert shows job title, department, last date and a link straight to the job page.

## Recommended rollout order

1. **Email** — easiest and cheapest. Needs a domain you own for sending (e.g. alerts@yourdomain.com). Without it, emails cannot be sent at all.
2. **Browser notifications** — free, works on Android and desktop, pops up even when the site is closed. Needs a free Firebase account connected, and each user must tap "Allow".
3. **WhatsApp** — highest open rate in Pakistan, but needs a paid WhatsApp Business provider account and Meta-approved message templates. Built last, behind a switch so it stays hidden until you have an account.

If you want the first useful result fast, we can ship email + settings first and add push and WhatsApp after.

## What I need from you

- A domain you own for sending email (or buy one) — required before any email goes out.
- A Firebase account (free) for browser notifications.
- A WhatsApp Business provider account if you want WhatsApp; otherwise that channel stays switched off.

## Technical details

**Database**
- `notification_preferences` table: `user_id` (unique), `email_enabled`, `push_enabled`, `whatsapp_enabled`, `frequency` (`instant` | `daily`), `paused`, `whatsapp_number`, timestamps. RLS: owner read/write, admin read, service_role all; GRANTs included.
- `push_subscriptions` table: `user_id`, `fcm_token` (unique), `user_agent`, `last_seen_at`. RLS owner-scoped.
- `notification_deliveries` table: `user_id`, `job_id`, `channel`, `status`, `error`, `sent_at` — dedupe key `(user_id, job_id, channel)` so a job never alerts twice, plus a delivery log for debugging.
- Extract the existing eligibility matching in `notify_eligible_users_on_new_job` into a reusable function `public.eligible_users_for_job(job_id uuid) returns setof uuid`, and have the current trigger call it so in-app and external channels use identical logic.
- New AFTER INSERT trigger on `jobs` calls `pg_net` to invoke the dispatch function (keeps the trigger fast and non-blocking).

**Edge functions**
- `dispatch-job-alerts` — input `{ job_id }`. Loads eligible users via `eligible_users_for_job`, joins `notification_preferences`, skips paused/daily/already-delivered users, then per channel: enqueues an app email via `send-transactional-email`, sends FCM through the Firebase Messaging connector gateway, and (when enabled) posts the WhatsApp template. Writes a `notification_deliveries` row per attempt. Stale FCM tokens (404 UNREGISTERED) are deleted.
- `send-daily-job-digest` — scheduled by `pg_cron` at 04:00 UTC (09:00 PKT). For each user on `daily`, collects jobs from the last 24h that are eligible and undelivered, sends one grouped message per channel, records deliveries.

**Email**
- `email_domain--setup_email_infra` + `scaffold_transactional_email` after the sender domain is verified.
- Two React Email templates in `supabase/functions/_shared/transactional-email-templates/`: `new-job-match.tsx` (single job) and `daily-job-digest.tsx` (list). Brand styling from `src/index.css` (green/gold), white body. Unsubscribe footer is appended automatically.
- Unsubscribe page added at the scaffolded path; unsubscribing also flips `email_enabled` off.

**Browser push**
- Connect the Firebase Cloud Messaging connector. Add `public/firebase-messaging-sw.js`, plus `src/lib/push.ts` exposing `enablePush()` handling `not-configured`, `unsupported`, `open-in-new-tab` (Lovable preview runs in an iframe), `denied` and `registered`. Token saved to `push_subscriptions`.

**WhatsApp**
- Provider-agnostic sender in the dispatch function, gated by a `whatsapp_enabled` flag in `global_seo_settings` plus provider credentials stored as secrets. Until credentials exist the channel is hidden in the UI and skipped server-side.

**Frontend**
- `src/hooks/useNotificationPreferences.tsx` (react-query read/update).
- `src/components/notifications/AlertPreferences.tsx` — reusable settings card; mounted in the dashboard settings and in the profile-completion flow.
- Admin panel: a small "Alerts" panel showing recent `notification_deliveries` counts and failures.

**Verification**
- Insert a test job as admin, confirm eligible-user rows appear in `notification_deliveries` with `sent` status and no duplicates on re-run.
- `npx tsgo --noEmit -p tsconfig.app.json`, and deploy the touched edge functions.
