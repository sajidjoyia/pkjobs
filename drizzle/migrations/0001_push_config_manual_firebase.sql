CREATE TABLE public.push_config (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  web_api_key text,
  project_id text,
  app_id text,
  vapid_key text,
  service_account_json text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.push_config TO authenticated;
GRANT ALL ON public.push_config TO service_role;

ALTER TABLE public.push_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage push config"
ON public.push_config FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.push_config (id) VALUES (true);

CREATE OR REPLACE FUNCTION public.get_push_web_config()
RETURNS TABLE (web_api_key text, project_id text, app_id text, vapid_key text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT web_api_key, project_id, app_id, vapid_key
  FROM public.push_config
  WHERE id = true
$$;

GRANT EXECUTE ON FUNCTION public.get_push_web_config() TO anon, authenticated;