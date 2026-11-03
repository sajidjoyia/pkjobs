-- Helper: is this CV publicly shared?
CREATE OR REPLACE FUNCTION public.is_cv_public(_cv_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_cvs WHERE id = _cv_id AND is_public = true
  );
$$;

-- Helper: does the caller own this CV?
CREATE OR REPLACE FUNCTION public.owns_cv(_cv_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_cvs WHERE id = _cv_id AND user_id = auth.uid()
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_cv_public(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.owns_cv(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.is_cv_public(uuid) FROM public;
REVOKE EXECUTE ON FUNCTION public.owns_cv(uuid) FROM public;
REVOKE EXECUTE ON FUNCTION public.owns_cv(uuid) FROM anon;

-- Anonymous view / PDF-download events for public CVs
CREATE TABLE public.cv_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cv_id uuid NOT NULL REFERENCES public.user_cvs(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('view','pdf_download')),
  visitor_key text NOT NULL CHECK (char_length(visitor_key) <= 64),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_cv_events_cv_type ON public.cv_events (cv_id, event_type);
GRANT INSERT ON public.cv_events TO anon, authenticated;
GRANT ALL ON public.cv_events TO service_role;
ALTER TABLE public.cv_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can record a public CV event"
  ON public.cv_events FOR INSERT TO anon, authenticated
  WITH CHECK (public.is_cv_public(cv_id) = true);

-- Employer -> candidate contact messages on public CVs
CREATE TABLE public.cv_contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cv_id uuid NOT NULL REFERENCES public.user_cvs(id) ON DELETE CASCADE,
  sender_name text NOT NULL CHECK (char_length(sender_name) BETWEEN 1 AND 100),
  sender_email text NOT NULL CHECK (char_length(sender_email) <= 255),
  company text CHECK (company IS NULL OR char_length(company) <= 120),
  message text NOT NULL CHECK (char_length(message) BETWEEN 1 AND 2000),
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_cv_contact_messages_cv ON public.cv_contact_messages (cv_id, created_at DESC);
GRANT INSERT ON public.cv_contact_messages TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.cv_contact_messages TO authenticated;
GRANT ALL ON public.cv_contact_messages TO service_role;
ALTER TABLE public.cv_contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can contact a public CV owner"
  ON public.cv_contact_messages FOR INSERT TO anon, authenticated
  WITH CHECK (public.is_cv_public(cv_id) = true);
CREATE POLICY "CV owners can read their contact messages"
  ON public.cv_contact_messages FOR SELECT TO authenticated
  USING (public.owns_cv(cv_id) = true);
CREATE POLICY "CV owners can mark contact messages read"
  ON public.cv_contact_messages FOR UPDATE TO authenticated
  USING (public.owns_cv(cv_id) = true)
  WITH CHECK (public.owns_cv(cv_id) = true);
CREATE POLICY "CV owners can delete spam contact messages"
  ON public.cv_contact_messages FOR DELETE TO authenticated
  USING (public.owns_cv(cv_id) = true);

-- Per-CV stats summary for the owner
CREATE OR REPLACE FUNCTION public.get_my_cv_stats()
RETURNS TABLE (
  cv_id uuid, cv_name text, cv_slug text, cv_is_public boolean,
  total_views bigint, unique_views bigint, pdf_downloads bigint,
  total_messages bigint, unread_messages bigint
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT c.id, c.name, c.slug, c.is_public,
    count(e.id) FILTER (WHERE e.event_type = 'view'),
    count(DISTINCT e.visitor_key) FILTER (WHERE e.event_type = 'view'),
    count(e.id) FILTER (WHERE e.event_type = 'pdf_download'),
    (SELECT count(*) FROM public.cv_contact_messages m WHERE m.cv_id = c.id),
    (SELECT count(*) FROM public.cv_contact_messages m WHERE m.cv_id = c.id AND NOT m.is_read)
  FROM public.user_cvs c
  LEFT JOIN public.cv_events e ON e.cv_id = c.id
  WHERE c.user_id = auth.uid()
  GROUP BY c.id, c.name, c.slug, c.is_public;
$$;
GRANT EXECUTE ON FUNCTION public.get_my_cv_stats() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.get_my_cv_stats() FROM public, anon;

-- In-app notification for the CV owner when a message arrives
CREATE OR REPLACE FUNCTION public.notify_on_cv_contact()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_owner uuid;
  v_cv_name text;
BEGIN
  SELECT user_id, name INTO v_owner, v_cv_name FROM public.user_cvs WHERE id = NEW.cv_id;
  IF v_owner IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, reference_id, reference_type)
    VALUES (
      v_owner,
      'cv_contact',
      'New message about your CV',
      COALESCE(NEW.sender_name, 'Someone') || ' (potential employer) sent you a message about "' || COALESCE(v_cv_name, 'your CV') || '".',
      NEW.id,
      'cv_contact_message'
    );
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER cv_contact_notify
  AFTER INSERT ON public.cv_contact_messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_cv_contact();
REVOKE EXECUTE ON FUNCTION public.notify_on_cv_contact() FROM public, anon, authenticated;

-- Expose the CV id and owner on the public CV payload (contact box + owner-view skip)
CREATE OR REPLACE FUNCTION public.get_public_cv(_slug text)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT jsonb_build_object(
    'name', p.full_name,
    'avatar_url', p.avatar_url,
    'date_of_birth', p.date_of_birth,
    'gender', p.gender,
    'phone', p.phone,
    'province', p.province,
    'domicile', p.domicile,
    'template', c.template,
    'data', c.data,
    'updated_at', c.updated_at,
    'slug', c.slug,
    'cv_id', c.id,
    'owner_user_id', c.user_id
  )
  FROM public.user_cvs c
  JOIN public.profiles p ON p.user_id = c.user_id
  WHERE c.slug = _slug
    AND c.is_public = true
  LIMIT 1;
$function$;