-- Per-user secret token used in email alert unsubscribe links
ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS unsubscribe_token uuid DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX IF NOT EXISTS notification_preferences_unsubscribe_token_key
  ON public.notification_preferences (unsubscribe_token);

COMMENT ON COLUMN public.notification_preferences.unsubscribe_token IS 'Secret token embedded in job-alert email unsubscribe links';

-- Single-row admin-managed sender identity for outgoing app emails (Resend)
CREATE TABLE public.email_sender_config (
  id boolean PRIMARY KEY DEFAULT true CHECK (id = true),
  from_email text NOT NULL,
  from_name text NOT NULL DEFAULT 'PakJobs',
  reply_to text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE ON public.email_sender_config TO authenticated;
GRANT ALL ON public.email_sender_config TO service_role;

ALTER TABLE public.email_sender_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage email sender config"
  ON public.email_sender_config
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
