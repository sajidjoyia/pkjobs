import { Link } from "react-router-dom";
import { lazy, Suspense } from "react";
import { ArrowDown, ArrowRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/pakjobs-editorial.webp";

const BelowFold = lazy(() => import("./index-sections/BelowFold"));

const Index = () => (
  <div className="editorial-home bg-editorial-paper text-editorial-ink">
    <section className="editorial-hero relative isolate flex items-center justify-center overflow-hidden">
      <img src={heroImage} alt="Pakistani applicants holding document folders outside a civic building — editorial illustration" width={1920} height={1024} loading="eager" decoding="async" className="editorial-hero-photo absolute inset-0 -z-20 h-full w-full object-cover" />
      <div className="editorial-hero-shade absolute inset-0 -z-10" />
      <div className="mx-auto w-full max-w-5xl px-6 py-14 text-center text-editorial-inverse motion-safe:animate-fade-in">
        <div className="mb-6 flex items-center justify-center gap-4 text-editorial-gold">
          <span className="h-px w-10 bg-editorial-gold" />
          <p className="text-xs font-semibold uppercase">Independent application assistance</p>
          <span className="h-px w-10 bg-editorial-gold" />
        </div>
        <h1 className="mb-6 text-6xl font-bold leading-tight md:text-8xl lg:text-9xl">PakJobs</h1>
        <p className="mx-auto mb-4 max-w-3xl font-editorial text-2xl leading-relaxed md:text-3xl">Government job applications<br className="hidden sm:block" /> in <span className="text-editorial-gold">Pakistan.</span></p>
        <p className="mx-auto mb-8 max-w-xl text-base leading-relaxed text-editorial-inverse/90">Find opportunities that match your profile. Get expert help with your application, and follow every step in one place.</p>
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Button asChild variant="editorial" className="h-12"><a href="#user-guide"><BookOpen />Read the Guide</a></Button>
          <Button asChild variant="editorial-outline" className="h-12"><Link to="/jobs">Browse Jobs<ArrowRight /></Link></Button>
        </div>
        <p className="mt-6 text-sm text-editorial-inverse/80">Not a government agency. Application assistance, not a job guarantee.</p>
      </div>
    </section>
    <nav aria-label="Homepage contents" className="border-b border-editorial-line">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-5 lg:px-10">
        <span className="text-xs font-semibold uppercase text-editorial-muted">Your career, clearly mapped</span>
        <div className="flex flex-wrap gap-x-7 gap-y-3 text-sm font-medium">
          <a href="#user-guide" className="hover:text-editorial-green">The guide</a>
          <a href="#features" className="hover:text-editorial-green">Features</a>
          <a href="#questions" className="hover:text-editorial-green">Questions</a>
          <Link to="/auth?mode=register" className="inline-flex items-center gap-2 text-editorial-green">Create an account<ArrowRight className="h-4 w-4" /></Link>
        </div>
      </div>
    </nav>
    <Suspense fallback={<div className="min-h-96 px-6 py-16" role="status">Loading the guide…</div>}><BelowFold /></Suspense>
  </div>
);
export default Index;
