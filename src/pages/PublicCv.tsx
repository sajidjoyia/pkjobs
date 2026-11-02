import { useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Download, ExternalLink, Link2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import GlobalSeoHead from "@/components/seo/GlobalSeoHead";
import { Button } from "@/components/ui/button";
import CvDocument, { defaultCvData, type CvData, type Template } from "@/components/dashboard/CvDocument";

type PublicCvPayload = {
  name: string;
  avatar_url: string | null;
  date_of_birth: string | null;
  gender: string | null;
  phone: string | null;
  province: string | null;
  domicile: string | null;
  template: string | null;
  data: Partial<CvData> | null;
  updated_at: string;
  slug: string;
};

const PublicCv = () => {
  const { slug = "" } = useParams();
  const qc = useQueryClient();
  const docRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["public-cv", slug],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_public_cv", { _slug: slug });
      if (error) throw error;
      return (data || null) as PublicCvPayload | null;
    },
    enabled: !!slug,
    staleTime: 1000 * 60 * 5,
  });

  const cvData: CvData = { ...defaultCvData(), ...(data?.data || {}) };
  const profile = data
    ? {
        full_name: data.name,
        date_of_birth: data.date_of_birth,
        gender: data.gender,
        phone: data.phone,
        province: data.province,
        domicile: data.domicile,
        avatar_url: data.avatar_url,
      }
    : null;
  const template = (data?.template as Template) || "classic";
  const pageUrl = `${window.location.origin}/cv/${slug}`;

  const exportPdf = async () => {
    if (!docRef.current || !data) return;
    setExporting(true);
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const name = (data.name || "CV").replace(/[^a-zA-Z0-9]+/g, "_");
      await html2pdf()
        .set({
          margin: 0,
          filename: `${name}_BioData.pdf`,
          image: { type: "jpeg", quality: 0.96 },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(docRef.current)
        .save();
    } catch {
      toast.error("Could not create PDF");
    } finally {
      setExporting(false);
    }
  };

  if (slug && isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-20 text-center">
        <GlobalSeoHead
          pageTitle="CV not available | PakJobs"
          pageDescription="This CV link is not available — it may be private, removed, or mistyped."
        />
        <div className="card-elevated max-w-md mx-auto p-8 space-y-2">
          <h1 className="text-xl font-semibold">This CV link is not available</h1>
          <p className="text-sm text-muted-foreground">
            The CV may be private, removed by its owner, or the link may be mistyped.
          </p>
          <Button variant="outline" className="mt-3 gap-1" onClick={() => (window.location.href = "/jobs")}>
            <ExternalLink className="h-4 w-4" /> Browse jobs on PakJobs
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <GlobalSeoHead
        pageTitle={`${data.name} — CV | PakJobs`}
        pageDescription={`Bio-data / CV of ${data.name}: education, experience, skills and personal details.`}
        pageOgTitle={`${data.name} — CV`}
        pageOgDescription={`Online bio-data of ${data.name} — education, experience and skills.`}
        pageOgImage={data.avatar_url || undefined}
        canonicalUrl={pageUrl}
        pageOgType="profile" as never
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "ProfilePage",
          mainEntity: {
            "@type": "Person",
            name: data.name,
            ...(data.domicile ? { homeLocation: { "@type": "Place", name: data.domicile } } : {}),
          },
        }}
      />
      <div className="max-w-[830px] mx-auto px-3 sm:px-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <p className="text-sm font-medium">Online CV</p>
            <p className="text-xs text-muted-foreground">
              Shared by {data.name} • Updated {new Date(data.updated_at).toLocaleDateString("en-GB")}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-1"
              onClick={async () => {
                try { await navigator.clipboard.writeText(pageUrl); toast.success("Link copied"); }
                catch { toast.error("Could not copy"); }
              }}
            >
              <Link2 className="h-4 w-4" /> Copy link
            </Button>
            <Button size="sm" className="gap-1" onClick={exportPdf} disabled={exporting}>
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Download PDF
            </Button>
          </div>
        </div>
        <div className="overflow-auto rounded-lg border border-border bg-muted p-2">
          <div style={{ width: 794, maxWidth: "none", margin: "0 auto", transformOrigin: "top left" }}>
            <div ref={docRef}>
              <CvDocument template={template} data={cvData} profile={profile} />
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-4">
          CV created with{" "}
          <a href="/" className="underline hover:text-primary">PakJobs</a>{" "}
          — government job applications with expert help.
        </p>
      </div>
    </div>
  );
};

export default PublicCv;
