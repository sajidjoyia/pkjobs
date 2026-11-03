import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BarChart3, Copy, Download, Eye, FileDown, FilePlus2, Globe, Link2, Loader2, MailOpen, MessageCircle, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserEducations } from "@/hooks/useEducationFields";
import { cn } from "@/lib/utils";
import CvDocument, { type CvData, type EduRow, type ExpRow, type Template } from "@/components/dashboard/CvDocument";

const TEMPLATES: { id: Template; name: string; desc: string }[] = [
  { id: "classic", name: "Classic Bio-Data", desc: "Traditional Pakistani bio-data with photo and table layout" },
  { id: "modern", name: "Modern Green", desc: "Coloured sidebar, ideal for private & semi-gov jobs" },
  { id: "minimal", name: "Simple Formal", desc: "Clean, single-column — prints well in black & white" },
  { id: "executive", name: "Executive Header", desc: "Dark banner with your name on top — polished for officer posts" },
  { id: "twocolumn", name: "Two-Column Elegant", desc: "Main column plus a side panel with photo and personal details" },
  { id: "compact", name: "Compact One-Page", desc: "Space-saving layout — fits more on a single printed page" },
];

const LEVEL_LABEL: Record<string, string> = { matric: "Matric / SSC", intermediate: "Intermediate / HSSC", bachelor: "Bachelor", master: "Master", phd: "PhD" };

const emptyData = (): CvData => ({
  father_name: "", cnic: "", religion: "Islam", marital_status: "", nationality: "Pakistani",
  address: "", email: "", objective: "To obtain a challenging position in a reputable organisation where I can use my skills and education for its growth and my own professional development.",
  education: [], experience: [], skills: "", languages: "Urdu, English", references: "Will be furnished on demand.",
});

type SavedCv = { id: string; name: string; template: string; data: unknown; updated_at: string; slug: string | null; is_public: boolean };

type CvStats = {
  cv_id: string; cv_name: string; cv_slug: string | null; cv_is_public: boolean;
  total_views: number; unique_views: number; pdf_downloads: number;
  total_messages: number; unread_messages: number;
};

type ContactMessage = {
  id: string; cv_id: string; sender_name: string; sender_email: string;
  company: string | null; message: string; is_read: boolean; created_at: string;
};

const CvBuilder = () => {
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const { data: educations = [] } = useUserEducations(user?.id);
  const [template, setTemplate] = useState<Template>("classic");
  const [data, setData] = useState<CvData>(emptyData());
  const [cvName, setCvName] = useState("My CV");
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [exporting, setExporting] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);

  const { data: cvs = [], isLoading } = useQuery({
    queryKey: ["my-cvs", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("user_cvs").select("id,name,template,data,updated_at,slug,is_public").eq("user_id", user!.id).order("updated_at", { ascending: false });
      if (error) throw error;
      return (data || []) as SavedCv[];
    },
  });

  const { data: stats = [] } = useQuery({
    queryKey: ["my-cv-stats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_my_cv_stats");
      if (error) throw error;
      return (data || []) as CvStats[];
    },
  });
  const currentStats = stats.find((s) => s.cv_id === currentId) ?? null;
  const unreadTotal = stats.reduce((n, s) => n + Number(s.unread_messages || 0), 0);

  const freshData = (): CvData => {
    const d = emptyData();
    d.email = (profile as any)?.gmail || user?.email || "";
    d.education = educations.map((e) => ({
      degree: [LEVEL_LABEL[e.education_level] || e.education_level, e.education_field?.display_name].filter(Boolean).join(" — "),
      institute: "", year: "", marks: "",
    }));
    return d;
  };

  const openCv = (cv: SavedCv | null) => {
    if (cv) {
      setCurrentId(cv.id); setCvName(cv.name);
      setTemplate((cv.template as Template) || "classic");
      setData({ ...emptyData(), ...(cv.data as Partial<CvData>) });
    } else {
      setCurrentId(null); setCvName(cvs.length ? `CV ${cvs.length + 1}` : "My CV");
      setTemplate("classic"); setData(freshData());
    }
  };

  useEffect(() => {
    if (isLoading || loaded) return;
    openCv(cvs[0] ?? null);
    setLoaded(true);
  }, [isLoading, loaded, cvs]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pre-fill education from profile for a brand-new CV once educations load
  useEffect(() => {
    if (!loaded || currentId || data.education.length || !educations.length) return;
    setData((d) => ({ ...d, education: freshData().education }));
  }, [loaded, educations]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = useMutation({
    mutationFn: async (opts?: { silent?: boolean }) => {
      const row = { user_id: user!.id, name: cvName.trim() || "Untitled CV", template, data: data as any };
      if (currentId) {
        const { error } = await supabase.from("user_cvs").update(row).eq("id", currentId);
        if (error) throw error;
      } else {
        const { data: ins, error } = await supabase.from("user_cvs").insert(row).select("id").single();
        if (error) throw error;
        setCurrentId(ins.id);
      }
      return opts;
    },
    onSuccess: (opts) => { qc.invalidateQueries({ queryKey: ["my-cvs"] }); if (!opts?.silent) toast.success("CV saved"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const duplicate = async () => {
    const { data: ins, error } = await supabase.from("user_cvs")
      .insert({ user_id: user!.id, name: `${cvName} (copy)`, template, data: data as any }).select("id,name,template,data,updated_at,slug,is_public").single();
    if (error) return toast.error(error.message);
    await qc.invalidateQueries({ queryKey: ["my-cvs"] });
    openCv(ins as SavedCv);
    toast.success("Copy created — edit it for another job");
  };

  const remove = async () => {
    if (!currentId || !confirm(`Delete "${cvName}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("user_cvs").delete().eq("id", currentId);
    if (error) return toast.error(error.message);
    const rest = cvs.filter((c) => c.id !== currentId);
    await qc.invalidateQueries({ queryKey: ["my-cvs"] });
    openCv(rest[0] ?? null);
    toast.success("CV deleted");
  };

  const currentCv = cvs.find((c) => c.id === currentId) ?? null;
  const shareUrl = currentCv?.is_public && currentCv?.slug ? `${window.location.origin}/cv/${currentCv.slug}` : null;

  const copyShareLink = async () => {
    if (!shareUrl) return;
    try { await navigator.clipboard.writeText(shareUrl); toast.success("CV link copied"); }
    catch { toast.error("Could not copy — long-press the link to copy it"); }
  };

  const shareOnWhatsApp = () => {
    if (!shareUrl) return;
    const text = `CV of ${profile?.full_name || ""}`.trim();
    window.open(`https://wa.me/?text=${encodeURIComponent(`${text}\n${shareUrl}`)}`, "_blank", "noopener,noreferrer");
  };

  // Saves current edits (creating the CV if new — its link address is generated
  // on creation), then makes the saved copy public.
  const enableShare = async () => {
    if (!user) return;
    setSharing(true);
    try {
      const row = { user_id: user.id, name: cvName.trim() || "Untitled CV", template, data: data as any };
      let slug: string | null = currentCv?.slug ?? null;
      if (currentId) {
        const { error } = await supabase.from("user_cvs").update(row).eq("id", currentId);
        if (error) throw error;
      } else {
        const { data: ins, error } = await supabase.from("user_cvs").insert(row).select("id,slug").single();
        if (error) throw error;
        setCurrentId(ins.id);
        slug = (ins as { slug?: string | null }).slug ?? null;
      }
      const { error: upErr } = await supabase.from("user_cvs").update({ is_public: true }).eq("id", currentId!);
      if (upErr) throw upErr;
      await qc.invalidateQueries({ queryKey: ["my-cvs"] });
      if (slug) {
        const url = `${window.location.origin}/cv/${slug}`;
        try { await navigator.clipboard.writeText(url); toast.success("Public CV link created — link copied"); }
        catch { toast.success("Public CV link created"); }
      } else {
        toast.success("Public CV link created");
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSharing(false);
    }
  };

  const disableShare = async () => {
    if (!currentId || !confirm("Turn off sharing? The link will stop working for everyone.")) return;
    const { error } = await supabase.from("user_cvs").update({ is_public: false }).eq("id", currentId);
    if (error) return toast.error(error.message);
    await qc.invalidateQueries({ queryKey: ["my-cvs"] });
    toast.success("Sharing turned off — the link no longer works");
  };

  const { data: messages = [] } = useQuery({
    queryKey: ["cv-messages", currentId],
    enabled: !!currentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cv_contact_messages")
        .select("id,cv_id,sender_name,sender_email,company,message,is_read,created_at")
        .eq("cv_id", currentId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as ContactMessage[];
    },
  });

  const invalidateCvData = () => {
    qc.invalidateQueries({ queryKey: ["cv-messages"] });
    qc.invalidateQueries({ queryKey: ["my-cv-stats"] });
  };

  const markAllRead = async () => {
    if (!currentId) return;
    const { error } = await supabase.from("cv_contact_messages").update({ is_read: true }).eq("cv_id", currentId).eq("is_read", false);
    if (error) return toast.error(error.message);
    invalidateCvData();
  };

  const removeMessage = async (id: string) => {
    const { error } = await supabase.from("cv_contact_messages").delete().eq("id", id);
    if (error) return toast.error(error.message);
    invalidateCvData();
    toast.success("Message deleted");
  };

  const set = <K extends keyof CvData>(k: K, v: CvData[K]) => setData((d) => ({ ...d, [k]: v }));
  const setRow = <T,>(k: "education" | "experience", i: number, patch: Partial<T>) =>
    setData((d) => ({ ...d, [k]: (d[k] as any[]).map((r, idx) => (idx === i ? { ...r, ...patch } : r)) }));
  const removeRow = (k: "education" | "experience", i: number) => setData((d) => ({ ...d, [k]: (d[k] as any[]).filter((_, idx) => idx !== i) }));

  const exportPdf = async () => {
    if (!previewRef.current) return;
    setExporting(true);
    try {
      save.mutate({ silent: true });
      const html2pdf = (await import("html2pdf.js")).default;
      const name = `${profile?.full_name || "CV"} ${cvName}`.replace(/[^a-zA-Z0-9]+/g, "_");
      await html2pdf()
        .set({
          margin: 0,
          filename: `${name}_BioData.pdf`,
          image: { type: "jpeg", quality: 0.96 },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(previewRef.current)
        .save();
    } catch (e) {
      toast.error("Could not create PDF");
    } finally {
      setExporting(false);
    }
  };

  if (isLoading || !loaded) return <div className="py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <div className="space-y-6">
        <section className="card-elevated p-4 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">My saved CVs</h2>
            <Button size="sm" variant="outline" className="gap-1" onClick={() => openCv(null)}><FilePlus2 className="h-4 w-4" />New CV</Button>
          </div>
          {cvs.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {cvs.map((c) => {
                const unread = Number(stats.find((s) => s.cv_id === c.id)?.unread_messages || 0);
                return (
                  <button key={c.id} type="button" onClick={() => openCv(c)}
                    className={cn("rounded-md border px-3 py-1.5 text-sm text-left", c.id === currentId ? "border-primary bg-primary/10 font-medium" : "border-border hover:bg-muted")}>
                    {c.name}
                    <span className="block text-[11px] text-muted-foreground">
                      Updated {new Date(c.updated_at).toLocaleDateString("en-GB")}
                      {unread > 0 && <span className="text-primary font-medium"> • {unread} new message{unread > 1 ? "s" : ""}</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : <p className="text-sm text-muted-foreground">No saved CVs yet — fill the form and press Save CV.</p>}
          <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto] items-end">
            <div className="space-y-1"><Label className="text-xs">CV name (e.g. "Police Constable 2026")</Label>
              <Input value={cvName} onChange={(e) => setCvName(e.target.value)} maxLength={80} /></div>
            <Button variant="outline" className="gap-1" onClick={duplicate}><Copy className="h-4 w-4" />Duplicate</Button>
            <Button variant="outline" className="gap-1" onClick={remove} disabled={!currentId}><Trash2 className="h-4 w-4" />Delete</Button>
          </div>
          {currentId ? (
            <div className="rounded-lg border border-border p-3 space-y-2">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium flex items-center gap-1.5"><Globe className="h-3.5 w-3.5 text-primary" /> Online CV link</p>
                  <p className="text-xs text-muted-foreground">
                    {currentCv?.is_public
                      ? "Public — anyone with the link can view this CV. Press Save CV after edits to update the shared copy."
                      : "Private. Create a public link to share this CV in job applications or chat."}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {currentCv?.is_public ? (
                    <>
                      <Button size="sm" variant="outline" className="gap-1" onClick={copyShareLink}><Link2 className="h-4 w-4" />Copy link</Button>
                      <Button size="sm" variant="outline" className="gap-1" onClick={shareOnWhatsApp}><MessageCircle className="h-4 w-4" />WhatsApp</Button>
                      <Button size="sm" variant="outline" className="gap-1" onClick={disableShare}><Globe className="h-4 w-4" />Stop sharing</Button>
                    </>
                  ) : (
                    <Button size="sm" onClick={enableShare} disabled={sharing} className="gap-1">
                      {sharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />} Create public link
                    </Button>
                  )}
                </div>
              </div>
              {currentCv?.is_public && shareUrl && (
                <code className="block text-xs bg-muted rounded-md px-2 py-1.5 break-all select-all">{shareUrl}</code>
              )}
              {currentStats && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="inline-flex items-center gap-1 text-xs rounded-full border border-border px-2 py-0.5"><Eye className="h-3 w-3 text-primary" />{currentStats.total_views} view{currentStats.total_views === 1 ? "" : "s"}</span>
                  <span className="inline-flex items-center gap-1 text-xs rounded-full border border-border px-2 py-0.5"><BarChart3 className="h-3 w-3 text-primary" />{currentStats.unique_views} unique</span>
                  <span className="inline-flex items-center gap-1 text-xs rounded-full border border-border px-2 py-0.5"><FileDown className="h-3 w-3 text-primary" />{currentStats.pdf_downloads} PDF download{currentStats.pdf_downloads === 1 ? "" : "s"}</span>
                  <span className={cn("inline-flex items-center gap-1 text-xs rounded-full border px-2 py-0.5", currentStats.unread_messages > 0 ? "border-primary bg-primary/10 text-primary font-medium" : "border-border")}>
                    <MessageCircle className="h-3 w-3" />{currentStats.total_messages} message{currentStats.total_messages === 1 ? "" : "s"}
                    {currentStats.unread_messages > 0 ? ` • ${currentStats.unread_messages} new` : ""}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">This is a new, unsaved CV. Save it first, then you can create a public link.</p>
          )}
          {messages.length > 0 && (
            <div className="rounded-lg border border-border p-3 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium flex items-center gap-1.5">
                  <MessageCircle className="h-3.5 w-3.5 text-primary" /> Messages about this CV
                </p>
                <Button size="sm" variant="outline" className="gap-1" onClick={markAllRead}><MailOpen className="h-3.5 w-3.5" />Mark all read</Button>
              </div>
              <div className="space-y-2 max-h-72 overflow-auto">
                {messages.map((m) => (
                  <div key={m.id} className={cn("rounded-md border p-2.5 text-sm", m.is_read ? "border-border" : "border-primary/40 bg-primary/5")}>
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <p className="font-medium">
                        {m.sender_name}
                        {m.company && <span className="font-normal text-muted-foreground"> — {m.company}</span>}
                      </p>
                      <span className="text-[11px] text-muted-foreground">{new Date(m.created_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    <a href={`mailto:${m.sender_email}`} className="text-xs text-primary underline">{m.sender_email}</a>
                    <p className="mt-1 whitespace-pre-wrap">{m.message}</p>
                    <div className="flex gap-2 mt-1.5">
                      {!m.is_read && (
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={async () => {
                          await supabase.from("cv_contact_messages").update({ is_read: true }).eq("id", m.id);
                          invalidateCvData();
                        }}>Mark read</Button>
                      )}
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-destructive hover:text-destructive" onClick={() => removeMessage(m.id)}>
                        <Trash2 className="h-3 w-3 mr-0.5" />Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="card-elevated p-4 sm:p-6">
          <h2 className="text-lg font-semibold mb-1">1. Choose a template</h2>
          <p className="text-sm text-muted-foreground mb-4">Name, date of birth, gender, phone, province and domicile come from your profile.</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {TEMPLATES.map((t) => (
              <button key={t.id} type="button" onClick={() => setTemplate(t.id)}
                className={cn("rounded-lg border p-3 text-left transition-colors", template === t.id ? "border-primary bg-primary/10 ring-2 ring-primary" : "border-border hover:bg-muted")}>
                <p className="font-medium text-sm">{t.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{t.desc}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="card-elevated p-4 sm:p-6 space-y-4">
          <h2 className="text-lg font-semibold">2. Personal details</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {([["father_name", "Father's name"], ["cnic", "CNIC (e.g. 35202-1234567-1)"], ["religion", "Religion"], ["marital_status", "Marital status"], ["nationality", "Nationality"], ["email", "Email"]] as const).map(([k, l]) => (
              <div key={k} className="space-y-1"><Label className="text-xs">{l}</Label><Input value={data[k]} onChange={(e) => set(k, e.target.value)} /></div>
            ))}
          </div>
          <div className="space-y-1"><Label className="text-xs">Postal address</Label><Input value={data.address} onChange={(e) => set("address", e.target.value)} /></div>
          <div className="space-y-1"><Label className="text-xs">Career objective</Label><Textarea rows={3} value={data.objective} onChange={(e) => set("objective", e.target.value)} /></div>
        </section>

        <section className="card-elevated p-4 sm:p-6 space-y-3">
          <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">3. Education</h2>
            <Button size="sm" variant="outline" onClick={() => set("education", [...data.education, { degree: "", institute: "", year: "", marks: "" }])}><Plus className="h-4 w-4 mr-1" />Add</Button></div>
          {data.education.map((r, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-[2fr_2fr_1fr_1fr_auto] items-end">
              <Input placeholder="Degree" value={r.degree} onChange={(e) => setRow<EduRow>("education", i, { degree: e.target.value })} />
              <Input placeholder="Board / University" value={r.institute} onChange={(e) => setRow<EduRow>("education", i, { institute: e.target.value })} />
              <Input placeholder="Year" value={r.year} onChange={(e) => setRow<EduRow>("education", i, { year: e.target.value })} />
              <Input placeholder="Marks / CGPA" value={r.marks} onChange={(e) => setRow<EduRow>("education", i, { marks: e.target.value })} />
              <Button size="icon" variant="ghost" onClick={() => removeRow("education", i)} aria-label="Remove"><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
        </section>

        <section className="card-elevated p-4 sm:p-6 space-y-3">
          <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">4. Experience</h2>
            <Button size="sm" variant="outline" onClick={() => set("experience", [...data.experience, { title: "", organization: "", period: "", details: "" }])}><Plus className="h-4 w-4 mr-1" />Add</Button></div>
          {data.experience.length === 0 && <p className="text-sm text-muted-foreground">No experience? Leave empty — the section is hidden on the CV.</p>}
          {data.experience.map((r, i) => (
            <div key={i} className="space-y-2 rounded-lg border border-border p-3">
              <div className="grid gap-2 sm:grid-cols-3">
                <Input placeholder="Job title" value={r.title} onChange={(e) => setRow<ExpRow>("experience", i, { title: e.target.value })} />
                <Input placeholder="Organisation" value={r.organization} onChange={(e) => setRow<ExpRow>("experience", i, { organization: e.target.value })} />
                <Input placeholder="2022 – 2024" value={r.period} onChange={(e) => setRow<ExpRow>("experience", i, { period: e.target.value })} />
              </div>
              <div className="flex gap-2"><Input placeholder="Duties (optional)" value={r.details} onChange={(e) => setRow<ExpRow>("experience", i, { details: e.target.value })} />
                <Button size="icon" variant="ghost" onClick={() => removeRow("experience", i)} aria-label="Remove"><Trash2 className="h-4 w-4" /></Button></div>
            </div>
          ))}
        </section>

        <section className="card-elevated p-4 sm:p-6 space-y-3">
          <h2 className="text-lg font-semibold">5. Skills & more</h2>
          <div className="space-y-1"><Label className="text-xs">Skills (comma separated)</Label><Textarea rows={2} value={data.skills} onChange={(e) => set("skills", e.target.value)} placeholder="MS Office, Typing 40 wpm, Communication" /></div>
          <div className="space-y-1"><Label className="text-xs">Languages</Label><Input value={data.languages} onChange={(e) => set("languages", e.target.value)} /></div>
          <div className="space-y-1"><Label className="text-xs">References</Label><Input value={data.references} onChange={(e) => set("references", e.target.value)} /></div>
        </section>

        <div className="flex flex-wrap gap-2 sticky bottom-20 md:bottom-4 z-10">
          <Button onClick={() => save.mutate({})} variant="outline" disabled={save.isPending} className="gap-2 bg-background">
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save CV
          </Button>
          <Button onClick={exportPdf} disabled={exporting} className="gap-2">
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Download PDF
          </Button>
        </div>
      </div>

      <div className="xl:sticky xl:top-4 self-start">
        <p className="text-sm font-medium mb-2">Live preview (A4)</p>
        <div className="overflow-auto rounded-lg border border-border bg-muted p-2 max-h-[80vh]">
          <div style={{ width: 794, transformOrigin: "top left" }} className="mx-auto">
            <div ref={previewRef}>
              <CvDocument template={template} data={data} profile={profile} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


export default CvBuilder;
