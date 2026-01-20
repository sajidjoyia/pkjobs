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
  Banknote,
  ArrowRight,
  Filter,
} from "lucide-react";

// Mock data for jobs
const mockJobs = [
  {
    id: "1",
    title: "Assistant Sub Inspector (ASI)",
    department: "Punjab Police",
    education: "Bachelor's Degree",
    ageLimit: "18-25 years",
    gender: "Male",
    province: "Punjab",
    lastDate: "2024-02-15",
    seats: 500,
    totalCost: 2500,
    status: "active",
  },
  {
    id: "2",
    title: "Junior Clerk",
    department: "Federal Board of Revenue",
    education: "Intermediate",
    ageLimit: "18-30 years",
    gender: "Both",
    province: "All Pakistan",
    lastDate: "2024-02-20",
    seats: 200,
    totalCost: 1800,
    status: "active",
  },
  {
    id: "3",
    title: "Primary School Teacher (PST)",
    department: "Education Department Sindh",
    education: "Bachelor's Degree + B.Ed",
    ageLimit: "21-35 years",
    gender: "Female",
    province: "Sindh",
    lastDate: "2024-02-28",
    seats: 1000,
    totalCost: 2200,
    status: "active",
  },
  {
    id: "4",
    title: "Constable",
    department: "KPK Police",
    education: "Matric",
    ageLimit: "18-25 years",
    gender: "Male",
    province: "Khyber Pakhtunkhwa",
    lastDate: "2024-03-05",
    seats: 800,
    totalCost: 1500,
    status: "active",
  },
  {
    id: "5",
    title: "Data Entry Operator",
    department: "NADRA",
    education: "Intermediate + Computer Skills",
    ageLimit: "18-28 years",
    gender: "Both",
    province: "All Pakistan",
    lastDate: "2024-03-10",
    seats: 150,
    totalCost: 2000,
    status: "active",
  },
  {
    id: "6",
    title: "Stenographer",
    department: "Federal Government",
    education: "Intermediate + 80 WPM",
    ageLimit: "18-30 years",
    gender: "Both",
    province: "Islamabad",
    lastDate: "2024-03-15",
    seats: 75,
    totalCost: 2300,
    status: "active",
  },
];

const Jobs = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvince, setSelectedProvince] = useState<string>("");
  const [selectedEducation, setSelectedEducation] = useState<string>("");

  const filteredJobs = mockJobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProvince =
      !selectedProvince ||
      selectedProvince === "all" ||
      job.province.toLowerCase().includes(selectedProvince.toLowerCase());
    const matchesEducation =
      !selectedEducation ||
      selectedEducation === "all" ||
      job.education.toLowerCase().includes(selectedEducation.toLowerCase());
    return matchesSearch && matchesProvince && matchesEducation;
  });

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
                <SelectItem value="punjab">Punjab</SelectItem>
                <SelectItem value="sindh">Sindh</SelectItem>
                <SelectItem value="kpk">Khyber Pakhtunkhwa</SelectItem>
                <SelectItem value="balochistan">Balochistan</SelectItem>
                <SelectItem value="islamabad">Islamabad</SelectItem>
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
            Showing {filteredJobs.length} of {mockJobs.length} jobs
          </p>
        </div>

        {/* Job Cards */}
        <div className="grid gap-4">
          {filteredJobs.map((job) => (
            <div key={job.id} className="card-elevated p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-3 mb-3">
                    <div>
                      <h3 className="text-xl font-semibold text-foreground">
                        {job.title}
                      </h3>
                      <p className="text-muted-foreground">{job.department}</p>
                    </div>
                    <Badge variant="secondary" className="ml-auto lg:ml-0">
                      {job.seats} seats
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <GraduationCap className="h-4 w-4" />
                      {job.education}
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      {job.ageLimit}
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {job.province}
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Last Date: {new Date(job.lastDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total Cost</p>
                    <p className="text-xl font-bold text-primary">
                      Rs. {job.totalCost.toLocaleString()}
                    </p>
                  </div>
                  <Link to={`/jobs/${job.id}`}>
                    <Button className="gap-2">
                      View Details
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredJobs.length === 0 && (
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
