import { useEffect } from "react";
import { useSeoSettings } from "@/hooks/useSeoSettings";

interface GlobalSeoHeadProps {
  pageTitle?: string;
  pageDescription?: string;
  pageKeywords?: string;
  pageOgImage?: string;
  pageOgTitle?: string;
  pageOgDescription?: string;
}

const GlobalSeoHead = ({
  pageTitle,
  pageDescription,
  pageKeywords,
  pageOgImage,
  pageOgTitle,
  pageOgDescription,
}: GlobalSeoHeadProps) => {
  const { data: settings } = useSeoSettings();

  useEffect(() => {
    if (!settings) return;

    // Helper to set or update meta tag
    const setMetaTag = (name: string, content: string | null, property?: boolean) => {
      if (!content) return;
      
      const attr = property ? "property" : "name";
      let meta = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
      
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute(attr, name);
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", content);
    };

    // Title
    const title = pageTitle || settings.default_meta_title || settings.site_title;
    if (title) {
      document.title = title;
    }

    // Meta Description
    const description = pageDescription || settings.default_meta_description || settings.site_description;
    setMetaTag("description", description);

    // Meta Keywords
    const keywords = pageKeywords || settings.default_meta_keywords;
    if (keywords) {
      setMetaTag("keywords", keywords);
    }

    // Open Graph
    const ogTitle = pageOgTitle || settings.default_og_title || title;
    const ogDescription = pageOgDescription || settings.default_og_description || description;
    const ogImage = pageOgImage || settings.default_og_image_url;

    setMetaTag("og:title", ogTitle, true);
    setMetaTag("og:description", ogDescription, true);
    setMetaTag("og:type", "website", true);
    if (ogImage) {
      setMetaTag("og:image", ogImage, true);
    }
    if (settings.website_url) {
      setMetaTag("og:url", settings.website_url, true);
    }
    if (settings.website_name) {
      setMetaTag("og:site_name", settings.website_name, true);
    }

    // Twitter Card
    setMetaTag("twitter:card", "summary_large_image");
    setMetaTag("twitter:title", ogTitle);
    setMetaTag("twitter:description", ogDescription);
    if (ogImage) {
      setMetaTag("twitter:image", ogImage);
    }

    // Google Search Console Verification
    if (settings.google_search_console_verification) {
      setMetaTag("google-site-verification", settings.google_search_console_verification);
    }

    // Google Analytics
    if (settings.google_analytics_id && !document.querySelector(`script[src*="${settings.google_analytics_id}"]`)) {
      const gaScript = document.createElement("script");
      gaScript.async = true;
      gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${settings.google_analytics_id}`;
      document.head.appendChild(gaScript);

      const gaConfig = document.createElement("script");
      gaConfig.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${settings.google_analytics_id}');
      `;
      document.head.appendChild(gaConfig);
    }

    // JSON-LD Schema
    const existingSchema = document.querySelector('script[type="application/ld+json"][data-seo="global"]');
    if (existingSchema) {
      existingSchema.remove();
    }

    const socialProfiles = [
      settings.social_facebook,
      settings.social_twitter,
      settings.social_linkedin,
      settings.social_instagram,
      settings.social_youtube,
    ].filter(Boolean);

    const schema: any = {
      "@context": "https://schema.org",
      "@graph": [],
    };

    // Website Schema
    if (settings.website_name || settings.website_url) {
      schema["@graph"].push({
        "@type": "WebSite",
        name: settings.website_name || settings.site_title,
        url: settings.website_url,
        description: settings.site_description,
      });
    }

    // Organization Schema
    if (settings.organization_name) {
      const orgSchema: any = {
        "@type": "Organization",
        name: settings.organization_name,
        url: settings.website_url,
      };

      if (settings.logo_url) {
        orgSchema.logo = settings.logo_url;
      }

      if (socialProfiles.length > 0) {
        orgSchema.sameAs = socialProfiles;
      }

      schema["@graph"].push(orgSchema);
    }

    if (schema["@graph"].length > 0) {
      const schemaScript = document.createElement("script");
      schemaScript.type = "application/ld+json";
      schemaScript.setAttribute("data-seo", "global");
      schemaScript.innerHTML = JSON.stringify(schema);
      document.head.appendChild(schemaScript);
    }

    // Cleanup function
    return () => {
      // Note: We don't remove meta tags on unmount as they should persist
    };
  }, [settings, pageTitle, pageDescription, pageKeywords, pageOgImage, pageOgTitle, pageOgDescription]);

  return null; // This component only manages head elements
};

export default GlobalSeoHead;
