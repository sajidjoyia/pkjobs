export interface JobShareRecord {
  id: string;
  title: string;
  department: string;
  description: string | null;
  last_date: string;
  total_seats: number | null;
  total_fee: number | null;
  provinces: string[] | null;
  is_active: boolean;
}

export interface JobShareSummary extends JobShareRecord {
  shareTitle: string;
  seatsText: string;
  lastDateText: string;
  feeText: string;
  factsText: string;
  descriptionText: string;
}

export const JOB_SHARE_COLUMNS =
  "id,title,department,description,last_date,total_seats,total_fee,provinces,is_active";

export function buildJobShareSummary(job: JobShareRecord): JobShareSummary {
  const seatsText =
    job.total_seats && job.total_seats > 0
      ? `${job.total_seats} seat${job.total_seats > 1 ? "s" : ""}`
      : "Seats not specified";
  const lastDateText = new Date(job.last_date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const feeText = `Rs. ${Number(job.total_fee || 0).toLocaleString("en-PK")}`;
  const factsText = `${job.department} · Last date ${lastDateText} · ${seatsText} · Total fee ${feeText}`;
  const adminDescription = String(job.description || "").replace(/\s+/g, " ").trim();
  const fullDescription = adminDescription ? `${factsText} — ${adminDescription}` : factsText;

  return {
    ...job,
    shareTitle: job.title,
    seatsText,
    lastDateText,
    feeText,
    factsText,
    descriptionText:
      fullDescription.length > 240 ? `${fullDescription.slice(0, 237)}…` : fullDescription,
  };
}