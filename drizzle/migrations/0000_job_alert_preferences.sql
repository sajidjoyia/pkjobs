-- Reusable eligibility matcher (same logic as notify_eligible_users_on_new_job)
CREATE OR REPLACE FUNCTION public.eligible_users_for_job(_job_id uuid)
RETURNS SETOF uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  j RECORD;
  job_provinces text[];
  job_edu_levels text[];
  job_edu_fields text[];
  min_required_rank int;
  max_field_rank int;
BEGIN
  SELECT * INTO j FROM jobs WHERE id = _job_id;
  IF NOT FOUND THEN RETURN; END IF;

  job_provinces := COALESCE(j.provinces, '{}');
  job_edu_levels := COALESCE(j.required_education_levels, '{}');
  job_edu_fields := COALESCE(j.required_education_fields, '{}');

  SELECT COALESCE(MIN(
    CASE lvl
      WHEN 'matric' THEN 1 WHEN 'intermediate' THEN 2 WHEN 'bachelor' THEN 3
      WHEN 'master' THEN 4 WHEN 'phd' THEN 5 ELSE 0 END
  ), 0) INTO min_required_rank
  FROM unnest(job_edu_levels) AS lvl;

  SELECT COALESCE(MAX(
    CASE ef.education_level
      WHEN 'matric' THEN 1 WHEN 'intermediate' THEN 2 WHEN 'bachelor' THEN 3
      WHEN 'master' THEN 4 WHEN 'phd' THEN 5 ELSE 0 END
  ), 0) INTO max_field_rank
  FROM education_fields ef
  WHERE ef.id::text = ANY(job_edu_fields);

  RETURN QUERY
  SELECT DISTINCT p.user_id
  FROM profiles p
  WHERE
    (p.date_of_birth IS NULL OR (
      EXTRACT(YEAR FROM age(CURRENT_DATE, p.date_of_birth))::int BETWEEN j.min_age AND j.max_age
    ))
    AND (j.gender_requirement IS NULL OR p.gender IS NULL OR p.gender::text = j.gender_requirement::text)
    AND (
      array_length(job_provinces, 1) IS NULL
      OR p.province IS NULL
      OR EXISTS (
        SELECT 1 FROM unnest(job_provinces) prov
        WHERE lower(prov) = lower(p.province) OR lower(prov) LIKE '%all%'
      )
    )
    AND (
      array_length(job_edu_levels, 1) IS NULL
      OR EXISTS (
        SELECT 1 FROM user_educations ue
        WHERE ue.user_id = p.user_id
        AND (CASE ue.education_level
          WHEN 'matric' THEN 1 WHEN 'intermediate' THEN 2 WHEN 'bachelor' THEN 3
          WHEN 'master' THEN 4 WHEN 'phd' THEN 5 ELSE 0 END) >= min_required_rank
      )
    )
    AND (
      array_length(job_edu_fields, 1) IS NULL
      OR EXISTS (
        SELECT 1 FROM user_educations ue
        WHERE ue.user_id = p.user_id
        AND ue.education_field_id IS NOT NULL
        AND ue.education_field_id::text = ANY(job_edu_fields)
      )
      OR (max_field_rank > 0 AND EXISTS (
        SELECT 1 FROM user_educations ue
        WHERE ue.user_id = p.user_id
        AND (CASE ue.education_level
          WHEN 'matric' THEN 1 WHEN 'intermediate' THEN 2 WHEN 'bachelor' THEN 3
          WHEN 'master' THEN 4 WHEN 'phd' THEN 5 ELSE 0 END) > max_field_rank
      ))
    )
    AND NOT EXISTS (
      SELECT 1 FROM user_roles ur WHERE ur.user_id = p.user_id AND ur.role = 'admin'
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.eligible_users_for_job(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.eligible_users_for_job(uuid) TO service_role;

-- Preferences
CREATE TABLE public.notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  email_enabled boolean NOT NULL DEFAULT false,
  push_enabled boolean NOT NULL DEFAULT false,
  whatsapp_enabled boolean NOT NULL DEFAULT false,
  whatsapp_number text,
  frequency text NOT NULL DEFAULT 'instant',
  paused boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT notification_preferences_frequency_check CHECK (frequency IN ('instant','daily'))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_preferences TO authenticated;
GRANT ALL ON public.notification_preferences TO service_role;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own notification preferences"
ON public.notification_preferences FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view notification preferences"
ON public.notification_preferences FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_notification_preferences_updated_at
BEFORE UPDATE ON public.notification_preferences
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Push subscriptions
CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  fcm_token text NOT NULL UNIQUE,
  user_agent text,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own push subscriptions"
ON public.push_subscriptions FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_push_subscriptions_user ON public.push_subscriptions(user_id);

-- Delivery log / dedupe
CREATE TABLE public.notification_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  job_id uuid,
  channel text NOT NULL,
  status text NOT NULL DEFAULT 'sent',
  error text,
  sent_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT notification_deliveries_unique UNIQUE (user_id, job_id, channel)
);

GRANT SELECT ON public.notification_deliveries TO authenticated;
GRANT ALL ON public.notification_deliveries TO service_role;
ALTER TABLE public.notification_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own deliveries"
ON public.notification_deliveries FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins view all deliveries"
ON public.notification_deliveries FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_notification_deliveries_sent_at ON public.notification_deliveries(sent_at DESC);