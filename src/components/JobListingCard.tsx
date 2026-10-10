import { useState } from "react";
import { Link } from "react-router-dom";
import { Building2, CalendarDays, GraduationCap, MapPin, Users, ArrowUpRight, FileText, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatSeats } from "@/lib/utils";
import type { Job } from "@/hooks/useJobs";
import type { ReactNode } from "react";

interface JobListingCardProps {
  job: Job;
  expired: boolean;
  eligibilityBadge: ReactNode;
  educationText: string;
  fieldText: string;
  provinceText: string;
}

export default function JobListingCard({ job, expired, eligibilityBadge, educationText, fieldText, provinceText }: JobListingCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const destination = `/jobs/${job.id}`;
  const deadline = new Date(job.last_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const facts = [
    { icon: GraduationCap, label: "Education", value: educationText, extra: fieldText },
    { icon: Users, label: "Age limit", value: `${job.min_age}–${job.max_age} years` },
    { icon: UserRound, label: "Gender", value: job.gender_requirement ? job.gender_requirement.charAt(0).toUpperCase() + job.gender_requirement.slice(1) : "Any gender" },
    { icon: MapPin, label: "Domicile / region", value: job.domicile || provinceText, extra: job.domicile ? provinceText : undefined },
  ];

  return (
    <article className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground transition-colors motion-safe:duration-200 hover:border-primary/40">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_210px]">
        <div className="min-w-0 p-5 sm:p-6">
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="rounded-sm border-border bg-muted/50 font-normal">{formatSeats(job.total_seats)}</Badge>
            {eligibilityBadge}
          </div>
          <div className="flex items-start gap-4">
            <Link to={destination} aria-label={`View advertisement for ${job.title}`} className="flex h-20 w-16 shrink-0 items-center justify-center overflow-hidden rounded border border-border bg-muted sm:h-24 sm:w-20">
              {job.advertisement_image && !imageFailed ? <img src={job.advertisement_image} alt={`${job.title} advertisement`} loading="lazy" decoding="async" className="h-full w-full object-contain" onError={() => setImageFailed(true)} /> : <FileText className="h-7 w-7 text-primary" strokeWidth={1.5} />}
            </Link>
            <div className="min-w-0 flex-1">
              <p className="mb-2 flex items-start gap-1.5 text-sm text-muted-foreground"><Building2 className="mt-0.5 h-4 w-4 shrink-0" /><span>{job.department}</span></p>
              <h2 className="font-reading text-xl font-semibold leading-snug sm:text-2xl"><Link to={destination} className="break-words hover:text-primary focus-visible:underline">{job.title}</Link></h2>
              {job.description && <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{job.description}</p>}
            </div>
          </div>
          <dl className="mt-6 grid grid-cols-2 gap-x-5 gap-y-5 border-t border-border pt-5 xl:grid-cols-4">
            {facts.map(fact => <div key={fact.label} className="min-w-0">
              <dt className="mb-1.5 flex items-center gap-1.5 text-xs text-muted-foreground"><fact.icon className="h-3.5 w-3.5 shrink-0" />{fact.label}</dt>
              <dd className="break-words text-sm font-medium leading-relaxed">{fact.value}{fact.extra && <span className="mt-1 block text-xs font-normal leading-relaxed text-muted-foreground">{fact.extra}</span>}</dd>
            </div>)}
          </dl>
        </div>
        <div className="flex flex-col justify-between gap-5 border-t border-border bg-muted/30 p-5 sm:p-6 lg:border-l lg:border-t-0">
          <div className="flex justify-between gap-4 lg:flex-col lg:gap-6">
            <div><p className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarDays className="h-3.5 w-3.5" />{expired ? "Deadline passed" : "Last date to apply"}</p><p className={`text-base font-semibold ${expired ? "text-destructive" : "text-foreground"}`}>{deadline}</p></div>
            <div><p className="mb-1 text-xs text-muted-foreground">Total application cost</p><p className="text-xl font-semibold text-primary">Rs. {Number(job.total_fee).toLocaleString("en-PK")}</p></div>
          </div>
          <Button asChild variant={expired ? "outline" : "default"} className="w-full gap-2 rounded-md"><Link to={destination}>View Details<ArrowUpRight className="h-4 w-4" /></Link></Button>
        </div>
      </div>
    </article>
  );
}