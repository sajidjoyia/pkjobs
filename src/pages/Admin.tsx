import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Briefcase,
  Users,
  FileText,
  Settings,
  Trash2,
  Edit,
  Eye,
  Calculator,
} from "lucide-react";

// Mock data
const mockJobs = [
  {
    id: "1",
    title: "Assistant Sub Inspector (ASI)",
    department: "Punjab Police",
    seats: 500,
    lastDate: "2024-02-15",
    status: "active",
    applications: 125,
  },
  {
    id: "2",
    title: "Junior Clerk",
    department: "Federal Board of Revenue",
    seats: 200,
    lastDate: "2024-02-20",
    status: "active",
    applications: 89,
  },
];

const Admin = () => {
  const [activeTab, setActiveTab] = useState("jobs");
  const [showAddJob, setShowAddJob] = useState(false);
  const [fees, setFees] = useState({
    challan: "",
    postOffice: "",
    photocopy: "",
    expertService: "",
  });

  const totalFees = Object.values(fees).reduce(
    (sum, fee) => sum + (parseInt(fee) || 0),
    0
  );

  return (
    <div className="py-8">
      <div className="container">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground">
              Manage jobs, users, and applications
            </p>
          </div>
          <Button onClick={() => setShowAddJob(!showAddJob)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add New Job
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">6</p>
                <p className="text-sm text-muted-foreground">Active Jobs</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">1,245</p>
                <p className="text-sm text-muted-foreground">Total Users</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">214</p>
                <p className="text-sm text-muted-foreground">Applications</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-secondary/50 flex items-center justify-center">
                <Calculator className="h-5 w-5 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">Rs. 534K</p>
                <p className="text-sm text-muted-foreground">Revenue</p>
              </div>
            </div>
          </div>
        </div>

        {/* Add Job Form */}
        {showAddJob && (
          <div className="card-elevated p-6 mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-6">
              Add New Government Job
            </h2>
            <form className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="font-medium text-foreground">Job Details</h3>
                  <div className="space-y-2">
                    <Label htmlFor="title">Job Title</Label>
                    <Input id="title" placeholder="e.g., Assistant Sub Inspector" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input id="department" placeholder="e.g., Punjab Police" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Job description and responsibilities..."
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="seats">Total Seats</Label>
                      <Input id="seats" type="number" placeholder="500" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bps">BPS Grade</Label>
                      <Input id="bps" placeholder="BPS-11" />
                    </div>
                  </div>
                </div>

                {/* Eligibility */}
                <div className="space-y-4">
                  <h3 className="font-medium text-foreground">
                    Eligibility Criteria
                  </h3>
                  <div className="space-y-2">
                    <Label htmlFor="education">Required Education</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select education level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="matric">Matric / SSC</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="bachelor">Bachelor's Degree</SelectItem>
                        <SelectItem value="master">Master's Degree</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="minAge">Minimum Age</Label>
                      <Input id="minAge" type="number" placeholder="18" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxAge">Maximum Age</Label>
                      <Input id="maxAge" type="number" placeholder="30" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender Requirement</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="both">Both Male & Female</SelectItem>
                        <SelectItem value="male">Male Only</SelectItem>
                        <SelectItem value="female">Female Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="province">Province / Domicile</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select province" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Pakistan</SelectItem>
                        <SelectItem value="punjab">Punjab</SelectItem>
                        <SelectItem value="sindh">Sindh</SelectItem>
                        <SelectItem value="kpk">Khyber Pakhtunkhwa</SelectItem>
                        <SelectItem value="balochistan">Balochistan</SelectItem>
                        <SelectItem value="islamabad">Islamabad</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastDate">Last Date to Apply</Label>
                    <Input id="lastDate" type="date" />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Fees */}
              <div className="space-y-4">
                <h3 className="font-medium text-foreground">
                  Fee Breakdown (in PKR)
                </h3>
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="challan">Bank Challan Fee</Label>
                    <Input
                      id="challan"
                      type="number"
                      placeholder="500"
                      value={fees.challan}
                      onChange={(e) =>
                        setFees({ ...fees, challan: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postOffice">Post Office Fee</Label>
                    <Input
                      id="postOffice"
                      type="number"
                      placeholder="300"
                      value={fees.postOffice}
                      onChange={(e) =>
                        setFees({ ...fees, postOffice: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="photocopy">Photocopy Charges</Label>
                    <Input
                      id="photocopy"
                      type="number"
                      placeholder="200"
                      value={fees.photocopy}
                      onChange={(e) =>
                        setFees({ ...fees, photocopy: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expertService">Expert Service Fee</Label>
                    <Input
                      id="expertService"
                      type="number"
                      placeholder="1500"
                      value={fees.expertService}
                      onChange={(e) =>
                        setFees({ ...fees, expertService: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 p-4 rounded-lg bg-primary/10">
                  <Calculator className="h-5 w-5 text-primary" />
                  <span className="font-medium text-foreground">
                    Total Calculated Cost:
                  </span>
                  <span className="text-xl font-bold text-primary">
                    Rs. {totalFees.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button type="submit">Add Job</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddJob(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="jobs" className="gap-2">
              <Briefcase className="h-4 w-4" />
              Jobs
            </TabsTrigger>
            <TabsTrigger value="applications" className="gap-2">
              <FileText className="h-4 w-4" />
              Applications
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
          </TabsList>

          {/* Jobs Tab */}
          <TabsContent value="jobs">
            <div className="card-elevated overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-medium text-foreground">
                      Job Title
                    </th>
                    <th className="text-left p-4 font-medium text-foreground">
                      Department
                    </th>
                    <th className="text-left p-4 font-medium text-foreground">
                      Seats
                    </th>
                    <th className="text-left p-4 font-medium text-foreground">
                      Last Date
                    </th>
                    <th className="text-left p-4 font-medium text-foreground">
                      Applications
                    </th>
                    <th className="text-left p-4 font-medium text-foreground">
                      Status
                    </th>
                    <th className="text-right p-4 font-medium text-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {mockJobs.map((job) => (
                    <tr key={job.id} className="border-t border-border">
                      <td className="p-4 font-medium text-foreground">
                        {job.title}
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {job.department}
                      </td>
                      <td className="p-4 text-muted-foreground">{job.seats}</td>
                      <td className="p-4 text-muted-foreground">
                        {new Date(job.lastDate).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {job.applications}
                      </td>
                      <td className="p-4">
                        <Badge className="bg-success">{job.status}</Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* Applications Tab */}
          <TabsContent value="applications">
            <div className="card-elevated p-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Application Management
              </h3>
              <p className="text-muted-foreground">
                View and manage all user applications here
              </p>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <div className="card-elevated p-8 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                User Management
              </h3>
              <p className="text-muted-foreground">
                View and manage registered users here
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
