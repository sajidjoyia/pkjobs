import { useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Download, ExternalLink, Link2, Loader2, Mail, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import GlobalSeoHead from "@/components/seo/GlobalSeoHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
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
  cv_id: string;
  owner_user_id: string | null;
};

const VISITOR_KEY = "pk-visitor-id";
const VIEW_THROTTLE_MS = 30 * 60 * 1000; // one view per visitor per 30 minutes

const getVisitorId = (): string => {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `v-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return `v-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  }
};

const throttled = (key: string, ms: number): boolean => {
  try {
    const now = Date.now();
    const last = Number(localStorage.getItem(key) || 0);
    if (now - last < ms) return false;
    localStorage.setItem(key, String(now));
  } catch { /* storage unavailable — still record */ }
  return true;
};

const PublicCv = () => {
  const { slug = "" } = useParams();
  const docRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const { user } = useAuth();
  const [contact, setContact] = useState({ name: "", email: "", company: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

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

  const recordEvent = async (type: "view" | "pdf_download", cvId: string) => {
    if (!cvId) return;
    try {
      await supabase.from("cv_events").insert({ cv_id: cvId, event_type: type, visitor_key: getVisitorId() });
    } catch { /* analytics must never break the page */ }
  };

  const trackView = (cvId: string) => {
    if (user && user.id === (data?.owner_user_id || null)) return; // don't count the owner's own visits
    if (!throttled(`pk-cv-view-${cvId}`, VIEW_THROTTLE_MS)) return;
    recordEvent("view", cvId);
  };

  const exportPdf = async () => {
    if (!docRef.current || !data) return;
    setExporting(true);
    recordEvent("pdf_download", data.cv_id);
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

  const submitContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;
    const name = contact.name.trim();
    const email = contact.email.trim();
    const message = contact.message.trim();
    const company = contact.company.trim();
    if (!name || name.length > 100) return toast.error("Please enter your name (max 100 characters).");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast.error("Please enter a valid email address.");
    if (company.length > 120) return toast.error("Company name is too long.");
    if (!message || message.length > 2000) return toast.error("Please write a short message (max 2000 characters).");
    setSending(true);
    try {
      const { error } = await supabase.from("cv_contact_messages").insert({
        cv_id: data.cv_id,
        sender_name: name,
        sender_email: email,
        company: company || null,
        message,
      });
      if (error) throw error;
      setSent(true);
      setContact({ name: "", email: "", company: "", message: "" });
      toast.success("Message sent — the candidate will get your details.");
    } catch {
      toast.error("Could not send the message. Please try again.");
    } finally {
      setSending(false);
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

  const isOwner = !!user && user.id === data.owner_user_id;
  if (!isOwner) trackView(data.cv_id);

  return (
    <div className="py-8">
      <GlobalSeoHead
        pageTitle={`${data.name} — CV | PakJobs`}
        pageDescription={`Bio-data / CV of ${data.name}: education, experience, skills and personal details.`}
        pageOgTitle={`${data.name} — CV`}
        pageOgDescription={`Online bio-data of ${data.name} — education, experience and skills.`}
        pageOgImage={data.avatar_url || undefined}
        canonicalUrl={pageUrl}
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

        {!isOwner && (
          <section className="card-elevated mt-6 p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-1">
              <Mail className="h-4 w-4 text-primary" />
              <h2 className="text-base font-semibold">Contact {data.name}</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Recruiting or have an opportunity? Leave your details — {data.name.split(" ")[0]} gets your name, email and message.
            </p>
            {sent ? (
              <div className="rounded-lg border border-border bg-muted p-4 text-sm">
                <p className="font-medium">Message sent</p>
                <p className="text-muted-foreground mt-1">
                  Your details reached the candidate. They may reply to your email directly.
                </p>
                <Button size="sm" variant="outline" className="mt-3" onClick={() => setSent(false)}>
                  Send another message
                </Button>
              </div>
            ) : (
              <form onSubmit={submitContact} className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Your name *</Label>
                    <Input maxLength={100} value={contact.name} onChange={(e) => setContact((c) => ({ ...c, name: e.target.value }))} required />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Your email *</Label>
                    <Input type="email" maxLength={255} value={contact.email} onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))} required />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Company / organisation (optional)</Label>
                  <Input maxLength={120} placeholder="e.g. Allied Bank" value={contact.company} onChange={(e) => setContact((c) => ({ ...c, company: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Message *</Label>
                  <Textarea
                    rows={4}
                    maxLength={2000}
                    placeholder="Introduce yourself and the role you have in mind…"
                    value={contact.message}
                    onChange={(e) => setContact((c) => ({ ...c, message: e.target.value }))}
                    required
                  />
                  <p className="text-[11px] text-muted-foreground">{contact.message.length}/2000</p>
                </div>
                <Button type="submit" size="sm" className="gap-1" disabled={sending}>
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send message
                </Button>
              </form>
            )}
          </section>
        )}

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
