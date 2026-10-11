CREATE TABLE public.user_cvs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  template text NOT NULL DEFAULT 'classic',
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_cvs TO authenticated;
GRANT ALL ON public.user_cvs TO service_role;
ALTER TABLE public.user_cvs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own CV" ON public.user_cvs FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view CVs" ON public.user_cvs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_user_cvs_updated_at BEFORE UPDATE ON public.user_cvs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();