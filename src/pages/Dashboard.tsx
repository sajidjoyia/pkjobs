import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Briefcase,
  Clock,
  CheckCircle,
  FileText,
  MessageSquare,
  Upload,
  User,
  Calendar,
  MapPin,
  GraduationCap,
  Settings,
} from "lucide-react";

// Mock data
const mockApplications = [
  {
    id: "1",
    jobTitle: "Assistant Sub Inspector (ASI)",
    department: "Punjab Police",
    appliedDate: "2024-01-20",
    status: "in_progress",
    progress: 60,
    expert: "Ahmed Khan",
    lastUpdate: "Expert reviewing documents",
  },
  {
    id: "2",
    jobTitle: "Junior Clerk",
    department: "Federal Board of Revenue",
    appliedDate: "2024-01-18",
    status: "applied",
    progress: 100,
    expert: "Sara Ali",
    lastUpdate: "Application submitted successfully",
    receipt: "receipt-123.pdf",
  },
];

const mockUserProfile = {
  name: "Muhammad Ali",
  email: "ali@example.com",
  phone: "+92 300 1234567",
  dob: "1998-05-15",
  age: 26,
  gender: "Male",
  education: "Bachelor's Degree",
  province: "Punjab",
  domicile: "Lahore",
};

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("applications");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "in_progress":
        return <Badge className="bg-info">In Progress</Badge>;
      case "applied":
        return <Badge className="bg-success">Applied</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="py-8">
      <div className="container">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {mockUserProfile.name.split(" ")[0]}!
          </h1>
          <p className="text-muted-foreground">
            Track your applications and manage your profile
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">2</p>
                <p className="text-sm text-muted-foreground">Applications</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">1</p>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">1</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-secondary/50 flex items-center justify-center">
                <FileText className="h-5 w-5 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">12</p>
                <p className="text-sm text-muted-foreground">Eligible Jobs</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="applications" className="gap-2">
              <Briefcase className="h-4 w-4" />
              My Applications
            </TabsTrigger>
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-2">
              <FileText className="h-4 w-4" />
              Documents
            </TabsTrigger>
          </TabsList>

          {/* Applications Tab */}
          <TabsContent value="applications">
            <div className="space-y-4">
              {mockApplications.map((app) => (
                <div key={app.id} className="card-elevated p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-3">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">
                            {app.jobTitle}
                          </h3>
                          <p className="text-muted-foreground">{app.department}</p>
                        </div>
                        {getStatusBadge(app.status)}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{app.progress}%</span>
                        </div>
                        <Progress value={app.progress} className="h-2" />
                        <p className="text-sm text-muted-foreground">
                          {app.lastUpdate}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="text-sm text-muted-foreground">
                        Expert: <span className="font-medium text-foreground">{app.expert}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="gap-2">
                          <MessageSquare className="h-4 w-4" />
                          Chat
                        </Button>
                        {app.receipt && (
                          <Button variant="outline" size="sm" className="gap-2">
                            <FileText className="h-4 w-4" />
                            Receipt
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <div className="card-elevated p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-foreground">
                  Personal Information
                </h2>
                <Button variant="outline" size="sm" className="gap-2">
                  <Settings className="h-4 w-4" />
                  Edit
                </Button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <User className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Full Name</p>
                      <p className="font-medium text-foreground">
                        {mockUserProfile.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Date of Birth / Age
                      </p>
                      <p className="font-medium text-foreground">
                        {mockUserProfile.dob} ({mockUserProfile.age} years)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <User className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Gender</p>
                      <p className="font-medium text-foreground">
                        {mockUserProfile.gender}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Education</p>
                      <p className="font-medium text-foreground">
                        {mockUserProfile.education}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <MapPin className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Province</p>
                      <p className="font-medium text-foreground">
                        {mockUserProfile.province}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <MapPin className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Domicile</p>
                      <p className="font-medium text-foreground">
                        {mockUserProfile.domicile}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <div className="card-elevated p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-foreground">
                  My Documents
                </h2>
                <Button className="gap-2">
                  <Upload className="h-4 w-4" />
                  Upload Document
                </Button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {["CNIC", "Matric Certificate", "Intermediate Certificate", "Domicile"].map(
                  (doc) => (
                    <div
                      key={doc}
                      className="flex items-center justify-between p-4 rounded-lg border border-dashed border-border"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <span className="text-muted-foreground">{doc}</span>
                      </div>
                      <Button variant="ghost" size="sm">
                        Upload
                      </Button>
                    </div>
                  )
                )}
              </div>

              <p className="mt-4 text-sm text-muted-foreground">
                Documents are optional but help our AI auto-fill your information
                and speed up the application process.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
