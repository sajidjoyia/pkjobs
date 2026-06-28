// Public crawler-friendly preview page for a job.
// Returns a static HTML document with proper OG/Twitter/canonical tags so
// Facebook, WhatsApp, LinkedIn, X etc. show the correct preview on the
// FIRST scrape (no re-scrape needed). Real browsers are redirected to the
// SPA at /jobs/:id.
//
// URL shape:  GET /functions/v1/job-preview?id=<job_id>
//             GET /functions/v1/job-preview/<job_id>

import { createClient } from "npm:@supabase/supabase-js@2";

const SITE_ORIGIN = "https://pkjobs.lovable.app";

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

function notFoundHtml(reason: string) {
  return new Response(
    `<!doctype html><html><head><meta charset="utf-8"><title>Job not found</title>
<meta http-equiv="refresh" content="0;url=${SITE_ORIGIN}/jobs"></head>
<body><p>${esc(reason)} Redirecting to <a href="${SITE_ORIGIN}/jobs">jobs</a>.</p></body></html>`,
    { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    // Accept ?id= or /job-preview/<id>
    let id = url.searchParams.get("id");
    if (!id) {
      const parts = url.pathname.split("/").filter(Boolean);
      const last = parts[parts.length - 1];
      if (last && last !== "job-preview") id = last;
    }
    if (!id) return notFoundHtml("Missing job id.");

    // Basic UUID-ish guard
    if (!/^[0-9a-f-]{8,}$/i.test(id)) return notFoundHtml("Invalid job id.");

    const { data: job, error } = await supabase
      .from("jobs")
      .select(
        "id,title,department,description,last_date,total_seats,provinces,advertisement_image,is_active",
      )
      .eq("id", id)
      .maybeSingle();

    if (error || !job) return notFoundHtml("Job not found.");

    const canonical = `${SITE_ORIGIN}/jobs/${job.id}`;
    const title = `${job.title} — ${job.department}`;
    const rawDesc =
      (job.description && String(job.description).replace(/\s+/g, " ").trim()) ||
      `Apply for ${job.title} in ${job.department}. ${job.total_seats} seats. Last date ${new Date(job.last_date).toLocaleDateString()}.`;
    const desc = rawDesc.length > 200 ? rawDesc.slice(0, 197) + "…" : rawDesc;

    // Per-job OG image: use the admin-uploaded advertisement image when
    // present, otherwise fall back to our dynamic generator which always
    // returns a branded 1200×630 PNG/SVG.
    const ogImage =
      job.advertisement_image && /^https?:\/\//.test(job.advertisement_image)
        ? job.advertisement_image
        : `${url.origin}/functions/v1/job-og-image?id=${job.id}`;

    const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}" />
<link rel="canonical" href="${canonical}" />

<meta property="og:type" content="article" />
<meta property="og:site_name" content="PakJobs" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(desc)}" />
<meta property="og:url" content="${canonical}" />
<meta property="og:image" content="${esc(ogImage)}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="${esc(title)}" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:description" content="${esc(desc)}" />
<meta name="twitter:image" content="${esc(ogImage)}" />

<script type="application/ld+json">${JSON.stringify({
  "@context": "https://schema.org",
  "@type": "JobPosting",
  title: job.title,
  description: rawDesc,
  datePosted: undefined,
  validThrough: job.last_date,
  employmentType: "FULL_TIME",
  hiringOrganization: { "@type": "Organization", name: job.department },
  jobLocation: (job.provinces || []).map((p: string) => ({
    "@type": "Place",
    address: { "@type": "PostalAddress", addressRegion: p, addressCountry: "PK" },
  })),
  url: canonical,
})}</script>

<meta http-equiv="refresh" content="0;url=${canonical}" />
<script>window.location.replace(${JSON.stringify(canonical)});</script>
</head>
<body>
<h1>${esc(title)}</h1>
<p>${esc(desc)}</p>
<p><a href="${canonical}">Open job page</a></p>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        // Cache at the edge for crawlers; short browser cache.
        "Cache-Control": "public, max-age=300, s-maxage=3600",
      },
    });
  } catch (e) {
    return notFoundHtml("Server error.");
  }
});
