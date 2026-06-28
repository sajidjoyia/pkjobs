GRANT SELECT ON public.jobs TO anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon;
GRANT SELECT ON public.global_seo_settings TO anon;
GRANT SELECT ON public.news_items TO anon;