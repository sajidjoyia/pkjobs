-- Create education_fields table for specializations (BS, BSc, BS Physics, etc.)
CREATE TABLE public.education_fields (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  education_level TEXT NOT NULL, -- matric, intermediate, bachelor, master, phd
  name TEXT NOT NULL, -- internal name like "bs_physics"
  display_name TEXT NOT NULL, -- Display name like "BS Physics"
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(education_level, name)
);

-- Create user_educations table for storing multiple education entries per user
CREATE TABLE public.user_educations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  education_level TEXT NOT NULL,
  education_field_id UUID REFERENCES public.education_fields(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, education_level, education_field_id)
);

-- Add required_education_fields to jobs table
ALTER TABLE public.jobs 
ADD COLUMN required_education_fields UUID[] DEFAULT NULL;

-- Enable RLS on new tables
ALTER TABLE public.education_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_educations ENABLE ROW LEVEL SECURITY;

-- Education fields policies (readable by all, manageable by admins)
CREATE POLICY "Education fields are viewable by everyone"
ON public.education_fields
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage education fields"
ON public.education_fields
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- User educations policies (users manage their own)
CREATE POLICY "Users can view their own educations"
ON public.user_educations
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own educations"
ON public.user_educations
FOR ALL
USING (auth.uid() = user_id);

-- Admins can view all user educations
CREATE POLICY "Admins can view all user educations"
ON public.user_educations
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Insert some default education fields
INSERT INTO public.education_fields (education_level, name, display_name) VALUES
-- Matric fields
('matric', 'science', 'Science'),
('matric', 'arts', 'Arts'),
('matric', 'commerce', 'Commerce'),
-- Intermediate fields
('intermediate', 'fsc_pre_medical', 'FSc Pre-Medical'),
('intermediate', 'fsc_pre_engineering', 'FSc Pre-Engineering'),
('intermediate', 'ics', 'ICS (Computer Science)'),
('intermediate', 'icom', 'I.Com (Commerce)'),
('intermediate', 'fa', 'FA (Arts)'),
-- Bachelor fields
('bachelor', 'bs_computer_science', 'BS Computer Science'),
('bachelor', 'bs_physics', 'BS Physics'),
('bachelor', 'bs_chemistry', 'BS Chemistry'),
('bachelor', 'bs_mathematics', 'BS Mathematics'),
('bachelor', 'bsc', 'BSc (General)'),
('bachelor', 'ba', 'BA (Arts)'),
('bachelor', 'bcom', 'B.Com (Commerce)'),
('bachelor', 'bba', 'BBA (Business Admin)'),
('bachelor', 'llb', 'LLB (Law)'),
('bachelor', 'mbbs', 'MBBS (Medicine)'),
('bachelor', 'bds', 'BDS (Dental)'),
('bachelor', 'be', 'BE (Engineering)'),
-- Master fields
('master', 'ms_computer_science', 'MS Computer Science'),
('master', 'msc', 'MSc (General)'),
('master', 'ma', 'MA (Arts)'),
('master', 'mba', 'MBA (Business Admin)'),
('master', 'mphil', 'M.Phil'),
('master', 'llm', 'LLM (Law)'),
('master', 'med', 'M.Ed (Education)'),
-- PhD fields
('phd', 'phd_general', 'PhD (General)'),
('phd', 'phd_science', 'PhD (Science)'),
('phd', 'phd_arts', 'PhD (Arts)');