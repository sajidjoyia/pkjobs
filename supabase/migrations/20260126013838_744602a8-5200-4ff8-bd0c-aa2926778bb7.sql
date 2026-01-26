-- Change required_education from single enum to text array to support multiple education levels
ALTER TABLE public.jobs 
  ALTER COLUMN required_education DROP NOT NULL,
  ADD COLUMN required_education_levels text[] DEFAULT '{}';

-- Migrate existing data
UPDATE public.jobs 
SET required_education_levels = ARRAY[required_education::text]
WHERE required_education IS NOT NULL;

-- Drop the old column after migration
ALTER TABLE public.jobs DROP COLUMN required_education;

-- Change province from single text to text array to support multiple provinces
ALTER TABLE public.jobs 
  ADD COLUMN provinces text[] DEFAULT '{}';

-- Migrate existing province data
UPDATE public.jobs 
SET provinces = ARRAY[province]
WHERE province IS NOT NULL AND province != '';

-- Drop old province column
ALTER TABLE public.jobs DROP COLUMN province;

-- Create table for custom education levels that admins can add
CREATE TABLE public.custom_education_levels (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  display_name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.custom_education_levels ENABLE ROW LEVEL SECURITY;

-- Anyone can view education levels
CREATE POLICY "Anyone can view education levels"
  ON public.custom_education_levels
  FOR SELECT
  USING (true);

-- Only admins can manage education levels
CREATE POLICY "Admins can manage education levels"
  ON public.custom_education_levels
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));