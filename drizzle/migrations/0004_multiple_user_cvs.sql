ALTER TABLE public.user_cvs DROP CONSTRAINT IF EXISTS user_cvs_user_id_key;
ALTER TABLE public.user_cvs ADD COLUMN IF NOT EXISTS name text NOT NULL DEFAULT 'My CV';
CREATE INDEX IF NOT EXISTS user_cvs_user_id_idx ON public.user_cvs(user_id, updated_at DESC);