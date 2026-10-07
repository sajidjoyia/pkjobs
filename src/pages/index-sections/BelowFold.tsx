import { Link } from "react-router-dom";
import { ArrowRight, Bell, Bot, CheckCheck, FileCheck, FolderLock, MessageCircle, SearchCheck, Share2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const steps = [
  { title: "Build your profile", text: "Create an account, then complete your personal details, date of birth, gender, education level and field, province, and domicile. Keep these accurate: they determine your profile-based job matches.", link: "/auth?mode=register", label: "Create your account" },
  { title: "Check the job requirements", text: "Sign in to browse jobs. Review the department, education, age limit, gender, domicile, last date, and seats. Compare the original advertisement with your qualifications; a profile match is guidance, not the department’s final eligibility decision.", link: "/jobs", label: "Browse opportunities" },
  { title: "Prepare your documents", text: "Open My Documents in your dashboard. Upload readable CNIC and Matric documents, plus other qualifications or documents required by the advertisement. Documents are private and made available to authorized people handling your request.", link: "/dashboard", label: "Open your dashboard" },
  { title: "Review fees & request assistance", text: "The job page shows bank challan, post office, photocopy, and expert service fees, along with the total. Choose Apply for Me, review your request, and follow the payment instructions provided. Keep proof of payment and resolve questions in chat before proceeding.", link: "/jobs", label: "Review job fees" },
  { title: "Coordinate with your expert", text: "After assignment, your expert helps prepare and submit the application. Use the application chat to clarify missing details and provide requested documents. Respond promptly, especially when the application deadline is near.", link: "/dashboard", label: "View your applications" },
  { title: "Track progress & keep receipts", text: "Check your dashboard for the application status, progress steps, messages, and uploaded receipts. Follow the recruiting department’s official instructions for tests and interviews. Submission does not guarantee shortlisting, selection, or employment.", link: "/dashboard", label: "Track your request" },
];
const highlights = [
  { icon: SearchCheck, title: "Profile-based matching", text: "Compare education level and field, age, gender, province and domicile with the listed requirements.", dark: false },
  { icon: FileCheck, title: "Expert-assisted applications", text: "Get help with forms, required documents, submission and official fee handling.", dark: true },
  { icon: Wallet, title: "A clear fee breakdown", text: "Bank challan, postage, photocopies and expert service charges — see the total before proceeding.", dark: false },
  { icon: CheckCheck, title: "Progress you can follow", text: "Keep application milestones, messages, payment records and receipts together in your dashboard.", dark: false },
];
const extras = [
  { icon: FolderLock, title: "Private documents", text: "Keep CNIC and education documents in My Documents for your application requests." },
  { icon: MessageCircle, title: "Application chat", text: "Talk to the people handling your request, with messages and attachments in context." },
  { icon: Bell, title: "Eligible-job alerts", text: "In-site notifications for matching new jobs. Email and browser alerts depend on service setup; choose timing or pause them in Job Alerts. WhatsApp alerts are not available yet." },
  { icon: Share2, title: "Share job opportunities", text: "Share a job link on WhatsApp, Facebook or X with its department, deadline, seats status and total fee." },
  { icon: Bot, title: "AI assistant access", text: "Connect a compatible AI assistant with your permission to find jobs, check your eligibility and track your applications. Access follows your account permissions." },
];
const questions = [
  { q: "Is PakJobs an official government website?", a: "No. PakJobs is an independent government-job discovery and application-assistance service. The recruiting department makes all eligibility and selection decisions. Always check the original advertisement and official instructions." },
  { q: "How does government job eligibility matching work?", a: "PakJobs compares your profile with the job’s recorded education level and field, age, gender, and domicile requirements. Complete your profile accurately and read the official advertisement for additional conditions, exemptions or age relaxations." },
  { q: "What if the number of seats is unknown?", a: "The job shows ‘Seats not specified’ when no number is available. It does not mean the job has no vacancies. Check the original advertisement or the recruiting department for confirmation." },
  { q: "What do I pay for application assistance?", a: "Charges vary by job. The fee breakdown lists bank challan, post office, photocopy and expert service fees, with a total. Review the amount shown on the job page before requesting assistance." },
  { q: "Can I receive alerts without keeping the website open?", a: "In-site bell alerts are available when you return to PakJobs. Email and browser notifications require the respective services to be configured and your permission or subscription. You can choose instant or daily alerts, or pause external alerts, in Dashboard → Job Alerts. WhatsApp alerts are not available yet." },
  { q: "Does application assistance guarantee a government job?", a: "No. Assistance covers the application process, not recruitment outcomes. Tests, interviews, merit, eligibility and final selection are controlled by the recruiting department." },
];

const BelowFold = () => (
  <>
    <section className="mx-auto grid max-w-7xl grid-cols-1 gap-14 px-6 py-16 lg:grid-cols-12 lg:gap-16 lg:px-10 lg:py-24">
      <div id="user-guide" className="editorial-step lg:col-span-5">
        <p className="mb-4 text-xs font-semibold uppercase text-editorial-muted">From profile to submission</p>
        <h2 className="mb-6 text-3xl font-bold text-editorial-green md:text-4xl">The User Guide</h2>
        <p className="mb-12 border-l-2 border-editorial-gold pl-5 text-lg leading-relaxed text-editorial-muted">A clear path through your government job application — with the right details, documents and support.</p>
        <ol className="space-y-10">
          {steps.map((step, i) => <li key={step.title} className="grid grid-cols-[42px_minmax(0,1fr)] gap-4">
            <span className="font-editorial text-3xl text-editorial-green" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
            <div><h3 className="mb-3 text-lg font-bold leading-relaxed">{step.title}</h3><p className="text-sm leading-7 text-editorial-muted">{step.text}</p><Button asChild variant="editorial-link" className="mt-3 text-sm"><Link to={step.link}>{step.label}<ArrowRight /></Link></Button></div>
          </li>)}
        </ol>
      </div>
      <div id="features" className="editorial-step lg:col-span-7">
        <p className="mb-4 text-xs font-semibold uppercase text-editorial-muted">The feature index</p>
        <h2 className="mb-8 text-3xl font-bold md:text-4xl">More clarity.<br />Less paperwork.</h2>
        <div className="grid grid-cols-1 gap-px overflow-hidden border border-editorial-line bg-editorial-line sm:grid-cols-2">
          {highlights.map((feature) => <article key={feature.title} className={`flex min-h-72 flex-col justify-between p-7 xl:min-h-80 xl:p-9 ${feature.dark ? "bg-editorial-green text-editorial-inverse" : "bg-editorial-surface text-editorial-ink"}`}>
            <feature.icon className={`mb-8 h-8 w-8 ${feature.dark ? "text-editorial-gold" : "text-editorial-green"}`} strokeWidth={1.5} />
            <div><h3 className="mb-4 text-xl leading-relaxed">{feature.title}</h3><p className={`text-sm leading-7 ${feature.dark ? "text-editorial-inverse/90" : "text-editorial-muted"}`}>{feature.text}</p></div>
          </article>)}
        </div>
        <div className="mt-10 divide-y divide-editorial-line">
          {extras.map(feature => <article key={feature.title} className="flex gap-5 py-6"><feature.icon className="mt-1 h-5 w-5 shrink-0 text-editorial-green" /><div><h3 className="mb-2 text-base font-bold">{feature.title}</h3><p className="text-sm leading-7 text-editorial-muted">{feature.text}</p>{feature.title === "AI assistant access" && <Button asChild variant="editorial-link" className="mt-3"><Link to="/mcp-docs">Read the AI connection guide<ArrowRight /></Link></Button>}</div></article>)}
        </div>
        <div className="mt-8 border-t-2 border-editorial-gold pt-6"><h3 className="mb-3 text-lg">Before you apply</h3><p className="text-sm leading-7 text-editorial-muted">Use accurate profile details, check the official advertisement and deadline, and keep your payment and submission receipts. Never share your password in chat.</p></div>
      </div>
    </section>
    <section id="questions" className="editorial-step border-y border-editorial-line bg-editorial-surface">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[1fr_2fr] lg:px-10">
        <div><p className="mb-4 text-xs font-semibold uppercase text-editorial-muted">Good to know</p><h2 className="text-3xl leading-relaxed">Your questions,<br />answered.</h2><Button asChild variant="editorial-link" className="mt-6"><Link to="/faq">More questions<ArrowRight /></Link></Button></div>
        <Accordion type="single" collapsible>{questions.map(item => <AccordionItem key={item.q} value={item.q} className="border-editorial-line"><AccordionTrigger className="text-left font-reading text-base leading-relaxed">{item.q}</AccordionTrigger><AccordionContent className="text-sm leading-7 text-editorial-muted">{item.a}</AccordionContent></AccordionItem>)}</Accordion>
      </div>
    </section>
    <section className="px-6 py-16 text-center lg:py-20"><p className="mb-4 text-xs font-semibold uppercase text-editorial-green">Take the next step</p><h2 className="mb-5 text-3xl leading-relaxed md:text-4xl">Your next application<br />starts here.</h2><p className="mx-auto mb-8 max-w-lg leading-7 text-editorial-muted">Create your profile, review matching opportunities, and choose the support you need.</p><Button asChild variant="editorial" className="h-12"><Link to="/auth?mode=register">Create an account<ArrowRight /></Link></Button><div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm text-editorial-muted"><Link to="/about" className="hover:underline">About PakJobs</Link><Link to="/privacy" className="hover:underline">Privacy</Link><Link to="/terms" className="hover:underline">Terms of service</Link><Link to="/careers" className="hover:underline">Join our team</Link></div></section>
  </>
);
export default BelowFold;
