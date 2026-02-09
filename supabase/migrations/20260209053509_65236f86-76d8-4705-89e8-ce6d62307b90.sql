-- Create table for global SEO settings (singleton pattern - only one row)
CREATE TABLE public.global_seo_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Basic SEO
  site_title TEXT,
  site_description TEXT,
  default_meta_title TEXT,
  default_meta_description TEXT,
  default_meta_keywords TEXT,
  -- Open Graph
  default_og_image_url TEXT,
  default_og_title TEXT,
  default_og_description TEXT,
  -- Organization/Website Schema
  organization_name TEXT,
  website_name TEXT,
  logo_url TEXT,
  website_url TEXT,
  social_facebook TEXT,
  social_twitter TEXT,
  social_linkedin TEXT,
  social_instagram TEXT,
  social_youtube TEXT,
  -- Verification & Analytics
  google_search_console_verification TEXT,
  google_analytics_id TEXT,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.global_seo_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage SEO settings
CREATE POLICY "Admins can manage SEO settings"
  ON public.global_seo_settings
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can read SEO settings (needed for head injection)
CREATE POLICY "Anyone can read SEO settings"
  ON public.global_seo_settings
  FOR SELECT
  USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_global_seo_settings_updated_at
  BEFORE UPDATE ON public.global_seo_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default row
INSERT INTO public.global_seo_settings (site_title, site_description)
VALUES ('PKJobs', 'Find and apply to government jobs in Pakistan');

-- Create storage bucket for SEO assets
INSERT INTO storage.buckets (id, name, public) VALUES ('seo-assets', 'seo-assets', true);

-- Storage policies for SEO assets
CREATE POLICY "Anyone can view SEO assets"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'seo-assets');

CREATE POLICY "Admins can upload SEO assets"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'seo-assets' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update SEO assets"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'seo-assets' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete SEO assets"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'seo-assets' AND has_role(auth.uid(), 'admin'::app_role));