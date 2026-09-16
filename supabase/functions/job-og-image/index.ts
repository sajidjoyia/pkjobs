// Per-job Open Graph image (1200×630).
// - If the job has an admin-uploaded advertisement_image, we 302-redirect
//   to it (it's already the perfect asset for sharing).
// - Otherwise we render a branded SVG card on the fly. Facebook, X and
//   WhatsApp all accept image/svg+xml here.
//
// URL shape: GET /functions/v1/job-og-image?id=<job_id>

import { createClient } from "npm:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_ANON_KEY")!,
);

function esc(s: string) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function wrap(text: string, max: number, maxLines: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > max) {
      if (line) lines.push(line);
      line = w;
      if (lines.length === maxLines - 1) break;
    } else {
      line = (line ? line + " " : "") + w;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  if (words.join(" ").length > lines.join(" ").length) {
    const last = lines[lines.length - 1];
    if (last && last.length > max - 1) lines[lines.length - 1] = last.slice(0, max - 1) + "…";
    else if (last) lines[lines.length - 1] = last + "…";
  }
  return lines;
}

function svgFor(job: {
  title: string;
  department: string;
  total_seats: number | null;
  last_date: string;
}): string {
  const titleLines = wrap(job.title, 32, 3);
  const dueDate = new Date(job.last_date).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
  const seatsText =
    job.total_seats && job.total_seats > 0
      ? `${job.total_seats} seat${job.total_seats > 1 ? "s" : ""}`
      : "Seats not specified";
  const seatsWidth = Math.max(180, seatsText.length * 14 + 48);

  const titleTspans = titleLines
    .map((l, i) => `<tspan x="80" dy="${i === 0 ? 0 : 84}">${esc(l)}</tspan>`)
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0a5e2a"/>
      <stop offset="100%" stop-color="#06381a"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#f4c430"/>
      <stop offset="100%" stop-color="#d99e1e"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="1050" cy="120" r="280" fill="#ffffff" opacity="0.04"/>
  <circle cx="120" cy="560" r="220" fill="#ffffff" opacity="0.04"/>
  <rect x="0" y="0" width="14" height="630" fill="url(#accent)"/>

  <g font-family="Georgia, 'Playfair Display', serif" fill="#f4c430">
    <text x="80" y="100" font-size="28" font-weight="700" letter-spacing="4">PAKJOBS · GOVERNMENT JOBS</text>
  </g>

  <g font-family="Georgia, 'Playfair Display', serif" fill="#ffffff" font-weight="700">
    <text x="80" y="220" font-size="72">${titleTspans}</text>
  </g>

  <g font-family="Inter, Arial, sans-serif" fill="#ffffff" opacity="0.92">
    <text x="80" y="${230 + titleLines.length * 84 + 30}" font-size="32" font-weight="500">${esc(job.department)}</text>
  </g>

  <g transform="translate(80, 510)" font-family="Inter, Arial, sans-serif" fill="#ffffff">
    <rect x="0" y="0" rx="26" ry="26" width="${seatsWidth}" height="52" fill="#ffffff" opacity="0.14"/>
    <text x="28" y="34" font-size="22" font-weight="600">${esc(seatsText)}</text>

    <rect x="${seatsWidth + 20}" y="0" rx="26" ry="26" width="320" height="52" fill="#ffffff" opacity="0.14"/>
    <text x="${seatsWidth + 48}" y="34" font-size="22" font-weight="600">Apply by ${esc(dueDate)}</text>
  </g>

  <g font-family="Inter, Arial, sans-serif" fill="#f4c430" text-anchor="end">
    <text x="1120" y="590" font-size="22" font-weight="600">pkjobs.lovable.app</text>
  </g>
</svg>`;
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    let id = url.searchParams.get("id");
    if (!id) {
      const parts = url.pathname.split("/").filter(Boolean);
      const last = parts[parts.length - 1];
      if (last && last !== "job-og-image") id = last;
    }
    if (!id || !/^[0-9a-f-]{8,}$/i.test(id)) {
      return new Response("Missing/invalid id", { status: 400 });
    }

    const { data: job, error } = await supabase
      .from("jobs")
      .select("title,department,total_seats,last_date,advertisement_image")
      .eq("id", id)
      .maybeSingle();

    if (error || !job) return new Response("Not found", { status: 404 });

    if (job.advertisement_image && /^https?:\/\//.test(job.advertisement_image)) {
      return new Response(null, {
        status: 302,
        headers: {
          Location: job.advertisement_image,
          "Cache-Control": "public, max-age=3600, s-maxage=86400",
        },
      });
    }

    const svg = svgFor({
      title: job.title,
      department: job.department,
      total_seats: job.total_seats,
      last_date: job.last_date,
    });

    return new Response(svg, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    });
  } catch {
    return new Response("Server error", { status: 500 });
  }
});
