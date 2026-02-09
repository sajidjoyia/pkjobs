import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  MapPin,
  GraduationCap,
  Calendar,
  Users,
  ArrowRight,
  Filter,
  Loader2,
} from "lucide-react";
import { useJobs, Job } from "@/hooks/useJobs";
import { useAuth } from "@/hooks/useAuth";
import { isEligibleForJob } from "@/hooks/useProfile";

const educationLabels: Record<string, string> = {
  matric: "Matric / SSC",
  intermediate: "Intermediate",
  bachelor: "Bachelor's Degree",
  master: "Master's Degree",
  phd: "PhD / Doctorate",
};

const Jobs = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvince, setSelectedProvince] = useState<string>("");
  const [selectedEducation, setSelectedEducation] = useState<string>("");

  const { data: jobs, isLoading, error } = useJobs({
    search: searchQuery,
    province: selectedProvince,
    education: selectedEducation,
  });

  const { profile, user } = useAuth();

  const isJobExpired = (lastDate: string) => {
    return new Date(lastDate) < new Date(new Date().setHours(0, 0, 0, 0));
  };

  const getEligibilityBadge = (job: Job) => {
    if (isJobExpired(job.last_date)) {
      return (
        <Badge variant="outline" className="text-destructive border-destructive">
          Date Passed
        </Badge>
      );
    }
    
    if (!user || !profile) return null;
    
    const { eligible } = isEligibleForJob(profile, job);
    return (
      <Badge className={eligible ? "bg-success" : "bg-destructive"}>
        {eligible ? "Eligible" : "Not Eligible"}
      </Badge>
    );
  };

  const formatAgeRange = (min: number, max: number) => `${min}-${max} years`;

  const formatEducationLevels = (levels: string[]) => {
    if (levels.length === 0) return "Any";
    if (levels.length === 1) return educationLabels[levels[0]] || levels[0];
    return levels.map(l => educationLabels[l] || l).join(", ");
  };

  const formatProvinces = (provinces: string[]) => {
    if (provinces.length === 0) return "All Pakistan";
    return provinces.join(", ");
  };

  return (
    <div className="py-8">
      <div className="container">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Government Jobs
          </h1>
          <p className="text-muted-foreground">
            Browse and apply for government positions across Pakistan
          </p>
        </div>

        {/* Filters */}
        <div className="card-elevated p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-foreground">Filter Jobs</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedProvince} onValueChange={setSelectedProvince}>
              <SelectTrigger>
                <SelectValue placeholder="All Provinces" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Provinces</SelectItem>
                <SelectItem value="Punjab">Punjab</SelectItem>
                <SelectItem value="Sindh">Sindh</SelectItem>
                <SelectItem value="Khyber Pakhtunkhwa">Khyber Pakhtunkhwa</SelectItem>
                <SelectItem value="Balochistan">Balochistan</SelectItem>
                <SelectItem value="Islamabad">Islamabad</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedEducation} onValueChange={setSelectedEducation}>
              <SelectTrigger>
                <SelectValue placeholder="All Education" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Education</SelectItem>
                <SelectItem value="matric">Matric</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="bachelor">Bachelor's</SelectItem>
                <SelectItem value="master">Master's</SelectItem>
                <SelectItem value="phd">PhD</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setSelectedProvince("");
                setSelectedEducation("");
              }}
            >
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Results */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Loading..." : `Showing ${jobs?.length || 0} jobs`}
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-destructive">Failed to load jobs. Please try again.</p>
          </div>
        )}

        {/* Job Cards */}
        {!isLoading && !error && (
          <div className="grid gap-4">
            {jobs?.map((job) => {
              const expired = isJobExpired(job.last_date);
              
              return (
                <div key={job.id} className={`card-elevated p-6 ${expired ? "opacity-75" : ""}`}>
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-3">
                        <div>
                          <h3 className="text-xl font-semibold text-foreground">
                            {job.title}
                          </h3>
                          <p className="text-muted-foreground">{job.department}</p>
                        </div>
                        <div className="flex gap-2 ml-auto lg:ml-0">
                          <Badge variant="secondary">{job.total_seats} seats</Badge>
                          {getEligibilityBadge(job)}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <GraduationCap className="h-4 w-4" />
                          {formatEducationLevels(job.required_education_levels)}
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Users className="h-4 w-4" />
                          {formatAgeRange(job.min_age, job.max_age)}
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          {formatProvinces(job.provinces)}
                        </div>
                        <div className={`flex items-center gap-1.5 ${expired ? "text-destructive" : "text-muted-foreground"}`}>
                          <Calendar className="h-4 w-4" />
                          {expired ? "Deadline Passed: " : "Last Date: "}
                          {new Date(job.last_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Total Cost</p>
                        <p className="text-xl font-bold text-primary">
                          Rs. {Number(job.total_fee).toLocaleString()}
                        </p>
                      </div>
                      <Link to={`/jobs/${job.id}`}>
                        <Button variant={expired ? "outline" : "default"} className="gap-2">
                          View Details
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!isLoading && !error && jobs?.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No jobs found matching your criteria.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Jobs;