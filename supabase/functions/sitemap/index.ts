// Dynamic XML sitemap for published job pages.
// URL: GET /functions/v1/sitemap
//
// Lists every ACTIVE, unexpired job that has a slug, with a real
// page-specific lastmod taken from jobs.updated_at (maintained by the
// update_jobs_updated_at trigger on every edit). Static pages live in the
// hosted /sitemap.xml; robots.txt declares both sitemaps.
//
// Always reflects the database, so adding or editing a job updates it on the
// next request (edge-cached for 30 minutes).

import { createClient } from "npm:@supabase/supabase-js@2";

const SITE_ORIGIN = "https://pkjobs.lovable.app";
const PAGE_SIZE = 1000;
const MAX_URLS = 49999; // single-sitemap limit

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_ANON_KEY")!,
);

function esc(s: string | null | undefined): string {
  if (!s) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function dateOnly(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

async function fetchJobUrls(): Promise<string[]> {
  const today = new Date().toISOString().slice(0, 10);
  const urls: string[] = [];
  for (let offset = 0; offset < MAX_URLS; offset += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("jobs")
      .select("slug, updated_at")
      .eq("is_active", true)
      .gte("last_date", today)
      .not("slug", "is", null)
      .order("updated_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    const rows = (data || []) as { slug: string; updated_at: string }[];
    for (const row of rows) {
      const lastmod = dateOnly(row.updated_at);
      urls.push(
        `  <url><loc>${SITE_ORIGIN}/jobs/${esc(row.slug)}</loc>${
          lastmod ? `<lastmod>${lastmod}</lastmod>` : ""
        }</url>`,
      );
    }
    if (rows.length < PAGE_SIZE) break;
  }
  return urls;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*" } });
  }
  let urls: string[] = [];
  try {
    urls = await fetchJobUrls();
  } catch {
    // Serve an empty-but-valid urlset rather than an error page for crawlers.
  }
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;
  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      // Short edge cache so newly added/edited jobs appear quickly.
      "Cache-Control": "public, max-age=300, s-maxage=1800",
    },
  });
});
