-- Shareable CV links: permanent name-based slug + public/private toggle
ALTER TABLE public.user_cvs ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE public.user_cvs ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;

-- Slugify helper (name -> lowercase, hyphens, max 60 chars)
CREATE OR REPLACE FUNCTION public.cv_slugify(raw text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  s text := lower(coalesce(raw, ''));
BEGIN
  s := regexp_replace(s, '[^a-z0-9]+', '-', 'g');
  s := regexp_replace(s, '^-+|-+$', '', 'g');
  IF s = '' OR s IS NULL THEN s := 'cv'; END IF;
  RETURN left(s, 60);
END;
$$;

-- Slug generated once on INSERT from the owner's profile name, never overwritten
-- (shared links must stay stable). SECURITY DEFINER so it can read profiles.
CREATE OR REPLACE FUNCTION public.set_cv_slug()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base text;
  candidate text;
  n int := 0;
BEGIN
  IF new.slug IS NOT NULL THEN RETURN new; END IF;
  SELECT public.cv_slugify(p.full_name) INTO base FROM public.profiles p WHERE p.user_id = new.user_id;
  IF base IS NULL OR base = 'cv' THEN base := public.cv_slugify(new.name); END IF;
  candidate := base || '-' || left(new.id::text, 8);
  WHILE EXISTS (SELECT 1 FROM public.user_cvs WHERE slug = candidate AND id <> new.id) LOOP
    n := n + 1;
    candidate := base || '-' || left(new.id::text, 8) || '-' || n;
  END LOOP;
  new.slug := candidate;
  RETURN new;
END;
$$;

CREATE TRIGGER cv_set_slug
BEFORE INSERT ON public.user_cvs
FOR EACH ROW EXECUTE FUNCTION public.set_cv_slug();

-- Backfill slugs for existing CVs
UPDATE public.user_cvs c
SET slug = coalesce(
  (SELECT public.cv_slugify(p.full_name) FROM public.profiles p WHERE p.user_id = c.user_id),
  public.cv_slugify(c.name)
) || '-' || left(c.id::text, 8)
WHERE c.slug IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS user_cvs_slug_key
ON public.user_cvs (slug)
WHERE slug IS NOT NULL;

-- Public read of a shared CV (only when the owner made it public).
-- SECURITY DEFINER so anon visitors can fetch a shared CV without table access.
CREATE OR REPLACE FUNCTION public.get_public_cv(_slug text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
    'slug', c.slug
  )
  FROM public.user_cvs c
  JOIN public.profiles p ON p.user_id = c.user_id
  WHERE c.slug = _slug
    AND c.is_public = true
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_cv(text) TO anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_cv_slug() FROM anon, authenticated;
GRANT ALL ON FUNCTION public.set_cv_slug() TO service_role;

COMMENT ON FUNCTION public.set_cv_slug() IS 'Internal trigger: generates immutable CV share slug on insert';
COMMENT ON COLUMN public.user_cvs.slug IS 'Immutable shareable link slug: <name-slug>-<first-8-of-id>';