import { useMemo } from "react";

export type EduRow = { degree: string; institute: string; year: string; marks: string };
export type ExpRow = { title: string; organization: string; period: string; details: string };
export type CvData = {
  father_name: string; cnic: string; religion: string; marital_status: string; nationality: string;
  address: string; email: string; objective: string;
  education: EduRow[]; experience: ExpRow[];
  skills: string; languages: string; references: string;
};
export type Template = "classic" | "modern" | "minimal" | "executive" | "compact" | "twocolumn";

export type CvProfile = {
  full_name?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  phone?: string | null;
  domicile?: string | null;
  province?: string | null;
  avatar_url?: string | null;
};

export const defaultCvData = (): CvData => ({
  father_name: "", cnic: "", religion: "", marital_status: "", nationality: "Pakistani",
  address: "", email: "", objective: "",
  education: [], experience: [], skills: "", languages: "", references: "",
});

const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "");
const list = (s: string) => (s || "").split(/[,\n]/).map((x) => x.trim()).filter(Boolean);

/* ---------- CV document (fixed print colours, intentionally not themed) ---------- */
const CvDocument = ({ template, data, profile }: { template: Template; data: CvData; profile?: CvProfile | null }) => {
  const personal = useMemo(() => ([
    ["Father's Name", data.father_name], ["CNIC No.", data.cnic], ["Date of Birth", fmtDate(profile?.date_of_birth)],
    ["Gender", profile?.gender ? profile.gender[0].toUpperCase() + profile.gender.slice(1) : ""], ["Religion", data.religion],
    ["Marital Status", data.marital_status], ["Nationality", data.nationality], ["Domicile", profile?.domicile],
    ["Province", profile?.province], ["Contact No.", profile?.phone], ["Email", data.email], ["Address", data.address],
  ] as [string, string | undefined][]).filter(([, v]) => v), [data, profile]);

  const name = profile?.full_name || "Your Name";
  const dense = template === "compact";
  const serif = template === "minimal" || template === "executive" || template === "twocolumn";
  const accent =
    template === "executive" ? "#123B2D" :
    template === "minimal" || template === "compact" ? "#202923" : "#16734F";
  const page: React.CSSProperties = {
    width: 794,
    minHeight: 1123,
    background: "#fff",
    color: "#202923",
    fontFamily: serif ? "Georgia, 'Times New Roman', serif" : "Arial, Helvetica, sans-serif",
    fontSize: dense ? 11.5 : 13,
    lineHeight: dense ? 1.4 : 1.5,
    boxSizing: "border-box",
  };
  const h = (t: string) => (
    <h3 style={{
      fontSize: dense ? 11.5 : template === "executive" ? 13 : 14,
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: dense ? 0.5 : template === "executive" ? 2 : 1,
      color: accent,
      borderBottom: `2px solid ${template === "minimal" || template === "compact" ? "#202923" : "#D5A62F"}`,
      padding: dense ? 0 : "0 0 3px",
      margin: dense ? "12px 0 5px" : "18px 0 8px",
    }}>{t}</h3>
  );
  const photoBox = (dark?: boolean) => profile?.avatar_url ? (
    <img src={profile.avatar_url} crossOrigin="anonymous" alt="" style={{ width: 110, height: 130, objectFit: "cover", border: dark ? "2px solid #D5A62F" : "1px solid #ccc" }} />
  ) : (
    <div style={{ width: 110, height: 130, border: `1px dashed ${dark ? "#7fa190" : "#999"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: dark ? "#CFE0D6" : "#777", textAlign: "center" }}>Paste<br />Photo</div>
  );
  const td: React.CSSProperties = { border: "1px solid #cfd8d3", padding: dense ? "3px 6px" : "5px 8px", verticalAlign: "top" };

  const eduTable = data.education.length > 0 && (
    <>{h("Academic Qualification")}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr style={{ background: template === "minimal" || dense ? "#eee" : "#E8F3EE" }}>{["Degree / Certificate", "Board / University", "Year", "Marks / Grade"].map((x) => <th key={x} style={{ ...td, textAlign: "left" }}>{x}</th>)}</tr></thead>
        <tbody>{data.education.map((r, i) => <tr key={i}><td style={td}>{r.degree}</td><td style={td}>{r.institute}</td><td style={td}>{r.year}</td><td style={td}>{r.marks}</td></tr>)}</tbody>
      </table></>
  );
  const exp = data.experience.length > 0 && (
    <>{h("Experience")}{data.experience.map((r, i) => (
      <div key={i} style={{ marginBottom: dense ? 5 : 8 }}><b>{r.title}</b>{r.organization && <> — {r.organization}</>} {r.period && <span style={{ color: "#666" }}>({r.period})</span>}
        {r.details && <div style={{ color: "#444" }}>{r.details}</div>}</div>))}</>
  );
  const bullets = (t: string, s: string) => list(s).length > 0 && (<>{h(t)}<ul style={{ margin: 0, paddingLeft: 18 }}>{list(s).map((x) => <li key={x}>{x}</li>)}</ul></>);
  const tail = (<>{data.references && <>{h("References")}<p style={{ margin: 0 }}>{data.references}</p></>}
    <div style={{ marginTop: dense ? 24 : 40, display: "flex", justifyContent: "space-between", fontSize: dense ? 11 : 12 }}><span>Date: ____________</span><span>Signature: ____________</span></div></>);
  const asideInfo = (label: string, value?: string | null, dark?: boolean) => value ? (
    <div key={label} style={{ marginBottom: 6, fontSize: 12 }}><div style={{ opacity: dark ? 0.75 : 0.6, fontSize: 10, textTransform: "uppercase" }}>{label}</div><div style={{ wordBreak: "break-word" }}>{value}</div></div>
  ) : null;

  if (template === "modern") {
    return (
      <div style={{ ...page, display: "flex" }}>
        <aside style={{ width: 250, background: "#16734F", color: "#fff", padding: 24, boxSizing: "border-box" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>{photoBox(true)}</div>
          <h3 style={{ fontSize: 13, letterSpacing: 1, textTransform: "uppercase", borderBottom: "2px solid #D5A62F", paddingBottom: 3 }}>Personal Info</h3>
          {personal.map(([k, v]) => asideInfo(k, v, true))}
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

  if (template === "executive") {
    return (
      <div style={{ ...page, padding: 0 }}>
        <header style={{ background: "#123B2D", color: "#fff", padding: "32px 40px 22px", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>{photoBox(true)}</div>
          <h1 style={{ fontSize: 29, margin: 0, letterSpacing: 3, textTransform: "uppercase", color: "#fff", fontWeight: 700 }}>{name}</h1>
          <div style={{ height: 2, width: 90, background: "#D5A62F", margin: "10px auto" }} />
          <p style={{ margin: 0, fontSize: 12, color: "#D7E4DC" }}>{[profile?.phone, data.email, data.address].filter(Boolean).join("   •   ")}</p>
        </header>
        <div style={{ padding: "10px 40px 40px" }}>
          {data.objective && <>{h("Career Objective")}<p style={{ margin: 0 }}>{data.objective}</p></>}
          {h("Personal Information")}
          <table style={{ width: "100%", borderCollapse: "collapse" }}><tbody>
            {personal.map(([k, v]) => <tr key={k}><td style={{ ...td, width: 170, fontWeight: 700, background: "#F5F8F6" }}>{k}</td><td style={td}>{v}</td></tr>)}
          </tbody></table>
          {eduTable}{exp}{bullets("Skills", data.skills)}{bullets("Languages", data.languages)}{tail}
        </div>
      </div>
    );
  }

  if (template === "twocolumn") {
    return (
      <div style={{ ...page, display: "flex" }}>
        <main style={{ flex: 1, padding: 32, boxSizing: "border-box" }}>
          <h1 style={{ fontSize: 27, margin: 0, color: "#16734F" }}>{name}</h1>
          <p style={{ margin: "3px 0 0", fontSize: 12, color: "#555" }}>{[profile?.phone, data.email].filter(Boolean).join("  •  ")}</p>
          {data.objective && <>{h("Career Objective")}<p style={{ margin: 0 }}>{data.objective}</p></>}
          {eduTable}{exp}
          {data.references && <>{h("References")}<p style={{ margin: 0 }}>{data.references}</p></>}
          <div style={{ marginTop: 40, display: "flex", justifyContent: "space-between", fontSize: 12 }}><span>Date: ____________</span><span>Signature: ____________</span></div>
        </main>
        <aside style={{ width: 235, background: "#F3F7F5", borderLeft: "2px solid #16734F", padding: 22, boxSizing: "border-box" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>{photoBox()}</div>
          <h3 style={{ fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: accent, borderBottom: "2px solid #D5A62F", paddingBottom: 3 }}>Personal Information</h3>
          {personal.filter(([k]) => k !== "Email" && k !== "Address").map(([k, v]) => asideInfo(k, v))}
          {bullets("Skills", data.skills)}
          {list(data.languages).length > 0 && <><h3 style={{ fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: accent, borderBottom: "2px solid #D5A62F", paddingBottom: 3, marginTop: 16 }}>Languages</h3>{list(data.languages).map((x) => <div key={x} style={{ fontSize: 12 }}>{x}</div>)}</>}
          {data.address && <><h3 style={{ fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: accent, borderBottom: "2px solid #D5A62F", paddingBottom: 3, marginTop: 16 }}>Address</h3><p style={{ margin: 0, fontSize: 12 }}>{data.address}</p></>}
        </aside>
      </div>
    );
  }

  // classic, minimal and compact share the single-column layout
  return (
    <div style={{ ...page, padding: dense ? 28 : 40 }}>
      {template === "classic" ? (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "3px double #16734F", paddingBottom: 12 }}>
          <div><p style={{ margin: 0, fontSize: 12, letterSpacing: 3, color: "#D5A62F", fontWeight: 700 }}>BIO-DATA</p>
            <h1 style={{ fontSize: 28, margin: "4px 0", color: "#16734F" }}>{name}</h1>
            <p style={{ margin: 0, fontSize: 12 }}>{[profile?.phone, data.email].filter(Boolean).join("  |  ")}</p></div>
          {photoBox()}
        </div>
      ) : (
        <div style={{ textAlign: "center", borderBottom: "1px solid #202923", paddingBottom: 10 }}>
          <h1 style={{ fontSize: dense ? 22 : 28, margin: 0, letterSpacing: dense ? 1 : 2, textTransform: "uppercase" }}>{name}</h1>
          <p style={{ margin: "4px 0 0", fontSize: dense ? 11 : 12 }}>{[profile?.phone, data.email, data.address].filter(Boolean).join("  •  ")}</p>
        </div>
      )}
      {data.objective && <>{h("Career Objective")}<p style={{ margin: 0 }}>{data.objective}</p></>}
      {h("Personal Information")}
      <table style={{ width: "100%", borderCollapse: "collapse" }}><tbody>
        {personal.map(([k, v]) => <tr key={k}><td style={{ ...td, width: 170, fontWeight: 700, background: template === "minimal" || dense ? "#f5f5f5" : "#F8FAF9" }}>{k}</td><td style={td}>{v}</td></tr>)}
      </tbody></table>
      {eduTable}{exp}{bullets("Skills", data.skills)}{bullets("Languages", data.languages)}{tail}
    </div>
  );
};

export default CvDocument;
