import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Calendar,
  GraduationCap,
  MapPin,
  Users,
  Banknote,
  CheckCircle,
  AlertCircle,
  Building2,
  Clock,
  FileText,
} from "lucide-react";

// Mock job data
const getJobById = (id: string) => ({
  id,
  title: "Assistant Sub Inspector (ASI)",
  department: "Punjab Police",
  organization: "Government of Punjab",
  description:
    "Punjab Police is seeking qualified candidates for the position of Assistant Sub Inspector (ASI). The selected candidates will be responsible for maintaining law and order, investigating crimes, and ensuring public safety.",
  requirements: [
    "Bachelor's degree from HEC recognized university",
    "Height: 5'7\" for male, 5'2\" for female",
    "Chest: 33\"-35\" for male",
    "Physical fitness test required",
    "No criminal record",
  ],
  education: "Bachelor's Degree",
  ageLimit: "18-25 years",
  gender: "Male",
  province: "Punjab",
  domicile: "Punjab (Any District)",
  lastDate: "2024-02-15",
  seats: 500,
  bps: "BPS-11",
  fees: {
    challan: 500,
    postOffice: 300,
    photocopy: 200,
    expertService: 1500,
  },
  totalCost: 2500,
  status: "active",
  postedDate: "2024-01-15",
});

const JobDetail = () => {
  const { id } = useParams();
  const job = getJobById(id || "1");

  const isEligible = true; // This would come from user profile matching

  return (
    <div className="py-8">
      <div className="container max-w-5xl">
        {/* Back button */}
        <Link
          to="/jobs"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Jobs
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div className="card-elevated p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-foreground mb-2">
                    {job.title}
                  </h1>
                  <p className="text-lg text-muted-foreground">{job.department}</p>
                </div>
                <Badge className={isEligible ? "bg-success" : "bg-destructive"}>
                  {isEligible ? "Eligible" : "Not Eligible"}
                </Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">{job.bps}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">{job.seats} seats</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">
                    Due: {new Date(job.lastDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">
                    Posted: {new Date(job.postedDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="card-elevated p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Job Description
              </h2>
              <p className="text-muted-foreground">{job.description}</p>
            </div>

            {/* Requirements */}
            <div className="card-elevated p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Requirements
              </h2>
              <ul className="space-y-3">
                {job.requirements.map((req, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-success mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Eligibility */}
            <div className="card-elevated p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Eligibility Criteria
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Education</p>
                    <p className="font-medium text-foreground">{job.education}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Age Limit</p>
                    <p className="font-medium text-foreground">{job.ageLimit}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Gender</p>
                    <p className="font-medium text-foreground">{job.gender}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <MapPin className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Domicile</p>
                    <p className="font-medium text-foreground">{job.domicile}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Fee Breakdown */}
            <div className="card-elevated p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Fee Breakdown
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bank Challan Fee</span>
                  <span className="font-medium">
                    Rs. {job.fees.challan.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Post Office Fee</span>
                  <span className="font-medium">
                    Rs. {job.fees.postOffice.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Photocopy Charges</span>
                  <span className="font-medium">
                    Rs. {job.fees.photocopy.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expert Service Fee</span>
                  <span className="font-medium">
                    Rs. {job.fees.expertService.toLocaleString()}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="font-bold text-primary">
                    Rs. {job.totalCost.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <Button className="w-full" size="lg">
                  <Banknote className="h-5 w-5 mr-2" />
                  Apply Now - Rs. {job.totalCost.toLocaleString()}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Expert will handle complete application process
                </p>
              </div>

              {/* Warning */}
              <div className="mt-6 p-4 rounded-lg bg-warning/10 border border-warning/20">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-warning shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Application Deadline
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Apply before {new Date(job.lastDate).toLocaleDateString()} to
                      avoid missing this opportunity.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetail;
