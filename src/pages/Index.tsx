import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, Users, Shield, FileText, Sparkles } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden hero-gradient">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/4 w-[800px] h-[800px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/4 w-[600px] h-[600px] rounded-full bg-secondary/5 blur-3xl" />
      </div>

      <div className="container relative py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8 animate-slide-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              Trusted by 50,000+ job seekers
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              Your Gateway to{" "}
              <span className="text-gradient-primary">Government Jobs</span>{" "}
              in Pakistan
            </h1>

            <p className="text-lg text-muted-foreground max-w-lg">
              We simplify the government job application process. From finding eligible 
              jobs to expert-assisted applications, we handle everything so you can 
              focus on your career.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/auth?mode=register">
                <Button variant="hero" className="w-full sm:w-auto">
                  Get Started Free
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/how-it-works">
                <Button variant="hero-outline" className="w-full sm:w-auto">
                  How It Works
                </Button>
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap gap-6 pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-5 w-5 text-success" />
                Free eligibility check
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-5 w-5 text-success" />
                Expert assistance
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-5 w-5 text-success" />
                Full transparency
              </div>
            </div>
          </div>

          {/* Image */}
          <div className="relative animate-fade-in">
            <div className="relative rounded-2xl overflow-hidden shadow-xl">
              <img
                src={heroImage}
                alt="Professional Pakistanis ready for government careers"
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent" />
            </div>

            {/* Floating cards */}
            <div className="absolute -bottom-6 -left-6 card-elevated p-4 animate-scale-in" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-success/20 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">1,200+</p>
                  <p className="text-xs text-muted-foreground">Jobs Available</p>
                </div>
              </div>
            </div>

            <div className="absolute -top-6 -right-6 card-elevated p-4 animate-scale-in" style={{ animationDelay: '0.5s' }}>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">50,000+</p>
                  <p className="text-xs text-muted-foreground">Happy Users</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const FeaturesSection = () => {
  const features = [
    {
      icon: Users,
      title: "Smart Job Matching",
      description: "Our system automatically matches your profile with eligible government jobs based on your education, age, and domicile.",
    },
    {
      icon: Shield,
      title: "Expert Assistance",
      description: "Dedicated experts handle your application process, from form filling to document submission and fee payment.",
    },
    {
      icon: FileText,
      title: "Complete Transparency",
      description: "Track every step of your application. View all payments, receipts, and chat history in one place.",
    },
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Why Choose <span className="text-primary">PakJobs</span>?
          </h2>
          <p className="text-muted-foreground">
            We've simplified the complex government job application process into a seamless experience.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="card-elevated p-8 text-center animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-xl bg-primary/10 mb-6">
                <feature.icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const HowItWorksSection = () => {
  const steps = [
    {
      step: "01",
      title: "Create Your Profile",
      description: "Register and enter your details - age, education, province, and domicile.",
    },
    {
      step: "02",
      title: "Find Eligible Jobs",
      description: "Browse jobs that match your eligibility. No more wasted applications.",
    },
    {
      step: "03",
      title: "Select & Pay",
      description: "Choose a job, review the complete fee breakdown, and make payment.",
    },
    {
      step: "04",
      title: "Expert Applies for You",
      description: "Our expert handles everything - forms, documents, and official fee payment.",
    },
  ];

  return (
    <section className="py-20">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            How It <span className="text-primary">Works</span>
          </h2>
          <p className="text-muted-foreground">
            Four simple steps to your government career
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          {steps.map((item, index) => (
            <div key={item.step} className="relative">
              <div className="card-elevated p-6 h-full">
                <span className="text-5xl font-bold text-primary/10">
                  {item.step}
                </span>
                <h3 className="text-lg font-semibold text-foreground mt-4 mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-0.5 bg-border" />
              )}
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link to="/auth?mode=register">
            <Button size="xl">
              Start Your Journey
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

const StatsSection = () => {
  const stats = [
    { value: "50,000+", label: "Registered Users" },
    { value: "1,200+", label: "Active Jobs" },
    { value: "35,000+", label: "Applications Submitted" },
    { value: "98%", label: "Success Rate" },
  ];

  return (
    <section className="py-16 bg-primary">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-primary-foreground">
                {stat.value}
              </p>
              <p className="text-primary-foreground/80 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const CTASection = () => {
  return (
    <section className="py-20">
      <div className="container">
        <div className="card-elevated p-12 text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Ready to Start Your Government Career?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join thousands of successful applicants who found their dream government 
            jobs through PakJobs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth?mode=register">
              <Button size="xl">
                Create Free Account
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/jobs">
              <Button variant="outline" size="xl">
                Browse Jobs
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

const Index = () => {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <StatsSection />
      <HowItWorksSection />
      <CTASection />
    </>
  );
};

export default Index;
