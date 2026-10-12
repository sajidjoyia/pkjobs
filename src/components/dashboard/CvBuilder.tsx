import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserEducations } from "@/hooks/useEducationFields";
import { cn } from "@/lib/utils";

type EduRow = { degree: string; institute: string; year: string; marks: string };
type ExpRow = { title: string; organization: string; period: string; details: string };
export type CvData = {
  father_name: string; cnic: string; religion: string; marital_status: string; nationality: string;
  address: string; email: string; objective: string;
  education: EduRow[]; experience: ExpRow[];
  skills: string; languages: string; references: string;
};
type Template = "classic" | "modern" | "minimal";

const TEMPLATES: { id: Template; name: string; desc: string }[] = [
  { id: "classic", name: "Classic Bio-Data", desc: "Traditional Pakistani bio-data with photo and table layout" },
  { id: "modern", name: "Modern Green", desc: "Coloured sidebar, ideal for private & semi-gov jobs" },
  { id: "minimal", name: "Simple Formal", desc: "Clean, single-column — prints well in black & white" },
];

const LEVEL_LABEL: Record<string, string> = { matric: "Matric / SSC", intermediate: "Intermediate / HSSC", bachelor: "Bachelor", master: "Master", phd: "PhD" };

const emptyData = (): CvData => ({
  father_name: "", cnic: "", religion: "Islam", marital_status: "", nationality: "Pakistani",
  address: "", email: "", objective: "To obtain a challenging position in a reputable organisation where I can use my skills and education for its growth and my own professional development.",
  education: [], experience: [], skills: "", languages: "Urdu, English", references: "Will be furnished on demand.",
});

const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "");
const list = (s: string) => s.split(/[,\n]/).map((x) => x.trim()).filter(Boolean);

const CvBuilder = () => {
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const { data: educations = [] } = useUserEducations(user?.id);
  const [template, setTemplate] = useState<Template>("classic");
  const [data, setData] = useState<CvData>(emptyData());
  const [loaded, setLoaded] = useState(false);
  const [exporting, setExporting] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const { data: saved, isLoading } = useQuery({
    queryKey: ["my-cv", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("user_cvs").select("*").eq("user_id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (isLoading || loaded) return;
    if (saved) {
      setTemplate((saved.template as Template) || "classic");
      setData({ ...emptyData(), ...(saved.data as Partial<CvData>) });
    } else {
      setData((d) => ({ ...d, email: (profile as any)?.gmail || user?.email || "" }));
    }
    setLoaded(true);
  }, [isLoading, saved, loaded, profile, user]);

  // Pre-fill education from profile once if empty
  useEffect(() => {
    if (!loaded || data.education.length || !educations.length) return;
    setData((d) => ({
      ...d,
      education: educations.map((e) => ({
        degree: [LEVEL_LABEL[e.education_level] || e.education_level, e.education_field?.display_name].filter(Boolean).join(" — "),
        institute: "", year: "", marks: "",
      })),
    }));
  }, [loaded, educations]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("user_cvs").upsert({ user_id: user!.id, template, data: data as any }, { onConflict: "user_id" });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-cv"] }); toast.success("CV saved"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const set = <K extends keyof CvData>(k: K, v: CvData[K]) => setData((d) => ({ ...d, [k]: v }));
  const setRow = <T,>(k: "education" | "experience", i: number, patch: Partial<T>) =>
    setData((d) => ({ ...d, [k]: (d[k] as any[]).map((r, idx) => (idx === i ? { ...r, ...patch } : r)) }));
  const removeRow = (k: "education" | "experience", i: number) => setData((d) => ({ ...d, [k]: (d[k] as any[]).filter((_, idx) => idx !== i) }));

  const exportPdf = async () => {
    if (!previewRef.current) return;
    setExporting(true);
    try {
      save.mutate();
      const html2pdf = (await import("html2pdf.js")).default;
      const name = (profile?.full_name || "CV").replace(/[^a-zA-Z0-9]+/g, "_");
      await html2pdf()
        .set({
          margin: 0,
          filename: `${name}_BioData.pdf`,
          image: { type: "jpeg", quality: 0.96 },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
          pagebreak: { mode: ["css", "legacy"] },
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
          <Button onClick={() => save.mutate()} variant="outline" disabled={save.isPending} className="gap-2 bg-background">
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

/* ---------- PDF document (fixed print colours, intentionally not themed) ---------- */
const CvDocument = ({ template, data, profile }: { template: Template; data: CvData; profile: any }) => {
  const personal = useMemo(() => ([
    ["Father's Name", data.father_name], ["CNIC No.", data.cnic], ["Date of Birth", fmtDate(profile?.date_of_birth)],
    ["Gender", profile?.gender ? profile.gender[0].toUpperCase() + profile.gender.slice(1) : ""], ["Religion", data.religion],
    ["Marital Status", data.marital_status], ["Nationality", data.nationality], ["Domicile", profile?.domicile],
    ["Province", profile?.province], ["Contact No.", profile?.phone], ["Email", data.email], ["Address", data.address],
  ] as [string, string | undefined][]).filter(([, v]) => v), [data, profile]);

  const name = profile?.full_name || "Your Name";
  const accent = template === "classic" ? "#16734F" : template === "modern" ? "#16734F" : "#202923";
  const page: React.CSSProperties = { width: 794, minHeight: 1123, background: "#fff", color: "#202923", fontFamily: template === "minimal" ? "Georgia, 'Times New Roman', serif" : "Arial, Helvetica, sans-serif", fontSize: 13, lineHeight: 1.5, boxSizing: "border-box" };
  const h = (t: string) => (
    <h3 style={{ fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: accent, borderBottom: `2px solid ${template === "minimal" ? "#202923" : "#D5A62F"}`, padding: "0 0 3px", margin: "18px 0 8px" }}>{t}</h3>
  );
  const photo = profile?.avatar_url ? (
    <img src={profile.avatar_url} crossOrigin="anonymous" alt="" style={{ width: 110, height: 130, objectFit: "cover", border: "1px solid #ccc" }} />
  ) : (
    <div style={{ width: 110, height: 130, border: "1px dashed #999", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#777", textAlign: "center" }}>Paste<br />Photo</div>
  );
  const td: React.CSSProperties = { border: "1px solid #cfd8d3", padding: "5px 8px", verticalAlign: "top" };

  const eduTable = data.education.length > 0 && (
    <>{h("Academic Qualification")}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr style={{ background: template === "minimal" ? "#eee" : "#E8F3EE" }}>{["Degree / Certificate", "Board / University", "Year", "Marks / Grade"].map((x) => <th key={x} style={{ ...td, textAlign: "left" }}>{x}</th>)}</tr></thead>
        <tbody>{data.education.map((r, i) => <tr key={i}><td style={td}>{r.degree}</td><td style={td}>{r.institute}</td><td style={td}>{r.year}</td><td style={td}>{r.marks}</td></tr>)}</tbody>
      </table></>
  );
  const exp = data.experience.length > 0 && (
    <>{h("Experience")}{data.experience.map((r, i) => (
      <div key={i} style={{ marginBottom: 8 }}><b>{r.title}</b>{r.organization && <> — {r.organization}</>} {r.period && <span style={{ color: "#666" }}>({r.period})</span>}
        {r.details && <div style={{ color: "#444" }}>{r.details}</div>}</div>))}</>
  );
  const bullets = (t: string, s: string) => list(s).length > 0 && (<>{h(t)}<ul style={{ margin: 0, paddingLeft: 18 }}>{list(s).map((x) => <li key={x}>{x}</li>)}</ul></>);
  const tail = (<>{data.references && <>{h("References")}<p style={{ margin: 0 }}>{data.references}</p></>}
    <div style={{ marginTop: 40, display: "flex", justifyContent: "space-between", fontSize: 12 }}><span>Date: ____________</span><span>Signature: ____________</span></div></>);

  if (template === "modern") {
    return (
      <div style={{ ...page, display: "flex" }}>
        <aside style={{ width: 250, background: "#16734F", color: "#fff", padding: 24, boxSizing: "border-box" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>{photo}</div>
          <h3 style={{ fontSize: 13, letterSpacing: 1, textTransform: "uppercase", borderBottom: "2px solid #D5A62F", paddingBottom: 3 }}>Personal Info</h3>
          {personal.map(([k, v]) => <div key={k} style={{ marginBottom: 6, fontSize: 12 }}><div style={{ opacity: 0.75, fontSize: 10, textTransform: "uppercase" }}>{k}</div><div style={{ wordBreak: "break-word" }}>{v}</div></div>)}
          {list(data.languages).length > 0 && <><h3 style={{ fontSize: 13, letterSpacing: 1, textTransform: "uppercase", borderBottom: "2px solid #D5A62F", paddingBottom: 3, marginTop: 16 }}>Languages</h3>{list(data.languages).map((x) => <div key={x} style={{ fontSize: 12 }}>{x}</div>)}</>}
        </aside>
        <main style={{ flex: 1, padding: 32 }}>
          <h1 style={{ fontSize: 30, margin: 0, color: "#16734F" }}>{name}</h1>
          <div style={{ height: 4, width: 60, background: "#D5A62F", margin: "8px 0 4px" }} />
          {data.objective && <>{h("Objective")}<p style={{ margin: 0 }}>{data.objective}</p></>}
          {eduTable}{exp}{bullets("Skills", data.skills)}{tail}
        </main>
      </div>
    );
  }

  return (
    <div style={{ ...page, padding: 40 }}>
      {template === "classic" ? (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "3px double #16734F", paddingBottom: 12 }}>
          <div><p style={{ margin: 0, fontSize: 12, letterSpacing: 3, color: "#D5A62F", fontWeight: 700 }}>BIO-DATA</p>
            <h1 style={{ fontSize: 28, margin: "4px 0", color: "#16734F" }}>{name}</h1>
            <p style={{ margin: 0, fontSize: 12 }}>{[profile?.phone, data.email].filter(Boolean).join("  |  ")}</p></div>
          {photo}
        </div>
      ) : (
        <div style={{ textAlign: "center", borderBottom: "1px solid #202923", paddingBottom: 10 }}>
          <h1 style={{ fontSize: 28, margin: 0, letterSpacing: 2, textTransform: "uppercase" }}>{name}</h1>
          <p style={{ margin: "4px 0 0", fontSize: 12 }}>{[profile?.phone, data.email, data.address].filter(Boolean).join("  •  ")}</p>
        </div>
      )}
      {data.objective && <>{h("Career Objective")}<p style={{ margin: 0 }}>{data.objective}</p></>}
      {h("Personal Information")}
      <table style={{ width: "100%", borderCollapse: "collapse" }}><tbody>
        {personal.map(([k, v]) => <tr key={k}><td style={{ ...td, width: 170, fontWeight: 700, background: template === "minimal" ? "#f5f5f5" : "#F8FAF9" }}>{k}</td><td style={td}>{v}</td></tr>)}
      </tbody></table>
      {eduTable}{exp}{bullets("Skills", data.skills)}{bullets("Languages", data.languages)}{tail}
    </div>
  );
};

export default CvBuilder;
