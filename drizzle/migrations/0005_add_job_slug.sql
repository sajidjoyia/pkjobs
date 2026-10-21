ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS slug text;

CREATE UNIQUE INDEX IF NOT EXISTS jobs_slug_key ON public.jobs (slug);

-- Slug is generated once from the title plus a short id suffix so shared
-- links never change, even if the title is edited later.
CREATE OR REPLACE FUNCTION public.job_slugify(raw text) RETURNS text
LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  s text;
BEGIN
  s := lower(coalesce(raw, ''));
  s := regexp_replace(s, '[^a-z0-9\s-]', '', 'g');
  s := regexp_replace(s, '[\s-]+', '-', 'g');
  s := trim(both '-' from s);
  s := left(s, 80);
  s := trim(both '-' from s);
  IF s = '' OR s IS NULL THEN
    s := 'job';
  END IF;
  RETURN s;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_job_slug() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.slug IS NULL OR trim(NEW.slug) = '' THEN
    NEW.slug := public.job_slugify(NEW.title) || '-' || left(NEW.id::text, 8);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS jobs_set_slug ON public.jobs;
CREATE TRIGGER jobs_set_slug BEFORE INSERT ON public.jobs
FOR EACH ROW EXECUTE FUNCTION public.set_job_slug();

-- Backfill existing jobs (id suffix guarantees uniqueness).
UPDATE public.jobs
SET slug = public.job_slugify(title) || '-' || left(id::text, 8)
WHERE slug IS NULL OR trim(slug) = '';
