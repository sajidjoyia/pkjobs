import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Loader2,
  Save,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMyApplications, Application } from "@/hooks/useApplications";
import { useUpdateProfile, calculateAge } from "@/hooks/useProfile";
import { openApplicationChat } from "@/components/chat/ChatWidget";
import { toast } from "sonner";

const statusLabels: Record<Application["status"], string> = {
  pending: "Pending",
  payment_received: "Payment Received",
  expert_assigned: "Expert Assigned",
  in_progress: "In Progress",
  applied: "Applied",
  completed: "Completed",
};

const statusProgress: Record<Application["status"], number> = {
  pending: 10,
  payment_received: 25,
  expert_assigned: 40,
  in_progress: 60,
  applied: 90,
  completed: 100,
};

const educationLabels: Record<string, string> = {
  matric: "Matric / SSC",
  intermediate: "Intermediate",
  bachelor: "Bachelor's Degree",
  master: "Master's Degree",
  phd: "PhD / Doctorate",
};

const Dashboard = () => {
  const { profile, user, loading: authLoading } = useAuth();
  const { data: applications, isLoading: appsLoading } = useMyApplications();
  const updateProfile = useUpdateProfile();
  
  const [activeTab, setActiveTab] = useState("applications");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: profile?.full_name || "",
    date_of_birth: profile?.date_of_birth || "",
    gender: profile?.gender || "",
    education: profile?.education || "",
    province: profile?.province || "",
    domicile: profile?.domicile || "",
    phone: profile?.phone || "",
  });

  // Update form when profile loads
  useState(() => {
    if (profile) {
      setEditForm({
        full_name: profile.full_name || "",
        date_of_birth: profile.date_of_birth || "",
        gender: profile.gender || "",
        education: profile.education || "",
        province: profile.province || "",
        domicile: profile.domicile || "",
        phone: profile.phone || "",
      });
    }
  });

  const getStatusBadge = (status: Application["status"]) => {
    const colors: Record<Application["status"], string> = {
      pending: "bg-warning",
      payment_received: "bg-info",
      expert_assigned: "bg-info",
      in_progress: "bg-info",
      applied: "bg-success",
      completed: "bg-success",
    };
    return <Badge className={colors[status]}>{statusLabels[status]}</Badge>;
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile.mutateAsync({
        full_name: editForm.full_name,
        date_of_birth: editForm.date_of_birth || undefined,
        gender: editForm.gender as any || undefined,
        education: editForm.education as any || undefined,
        province: editForm.province || undefined,
        domicile: editForm.domicile || undefined,
        phone: editForm.phone || undefined,
      });
      setIsEditing(false);
    } catch (error) {
      // Error handled in mutation
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const applicationStats = {
    total: applications?.length || 0,
    inProgress: applications?.filter((a) => ["pending", "payment_received", "expert_assigned", "in_progress"].includes(a.status)).length || 0,
    completed: applications?.filter((a) => ["applied", "completed"].includes(a.status)).length || 0,
  };

  return (
    <div className="py-8">
      <div className="container">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {profile?.full_name?.split(" ")[0] || user?.email?.split("@")[0]}!
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
                <p className="text-2xl font-bold text-foreground">{applicationStats.total}</p>
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
                <p className="text-2xl font-bold text-foreground">{applicationStats.inProgress}</p>
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
                <p className="text-2xl font-bold text-foreground">{applicationStats.completed}</p>
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
                <p className="text-2xl font-bold text-foreground">
                  {profile?.education ? "✓" : "—"}
                </p>
                <p className="text-sm text-muted-foreground">Profile Complete</p>
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
            {appsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : applications?.length === 0 ? (
              <div className="card-elevated p-8 text-center">
                <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No Applications Yet
                </h3>
                <p className="text-muted-foreground mb-4">
                  Start by browsing available jobs and applying to those you're eligible for.
                </p>
                <Button asChild>
                  <a href="/jobs">Browse Jobs</a>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {applications?.map((app) => (
                  <div key={app.id} className="card-elevated p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-3">
                          <div>
                            <h3 className="text-lg font-semibold text-foreground">
                              {app.job?.title || "Job"}
                            </h3>
                            <p className="text-muted-foreground">{app.job?.department}</p>
                          </div>
                          {getStatusBadge(app.status)}
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium">{statusProgress[app.status]}%</span>
                          </div>
                          <Progress value={statusProgress[app.status]} className="h-2" />
                          <p className="text-sm text-muted-foreground">
                            Applied on {new Date(app.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <div className="text-sm text-muted-foreground">
                          Amount: <span className="font-medium text-foreground">Rs. {Number(app.payment_amount).toLocaleString()}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="gap-2"
                            onClick={() => openApplicationChat(app.id, app.job?.title || 'Job Application')}
                          >
                            <MessageSquare className="h-4 w-4" />
                            Chat
                          </Button>
                          {app.receipt_url && (
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
            )}
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <div className="card-elevated p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-foreground">
                  Personal Information
                </h2>
                {isEditing ? (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      size="sm" 
                      className="gap-2"
                      onClick={handleSaveProfile}
                      disabled={updateProfile.isPending}
                    >
                      {updateProfile.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      Save
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2"
                    onClick={() => {
                      setEditForm({
                        full_name: profile?.full_name || "",
                        date_of_birth: profile?.date_of_birth || "",
                        gender: profile?.gender || "",
                        education: profile?.education || "",
                        province: profile?.province || "",
                        domicile: profile?.domicile || "",
                        phone: profile?.phone || "",
                      });
                      setIsEditing(true);
                    }}
                  >
                    <Settings className="h-4 w-4" />
                    Edit
                  </Button>
                )}
              </div>

              {isEditing ? (
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Full Name</Label>
                      <Input
                        value={editForm.full_name}
                        onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Date of Birth</Label>
                      <Input
                        type="date"
                        value={editForm.date_of_birth}
                        onChange={(e) => setEditForm({ ...editForm, date_of_birth: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Gender</Label>
                      <Select 
                        value={editForm.gender} 
                        onValueChange={(v) => setEditForm({ ...editForm, gender: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        placeholder="+92 300 1234567"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Education</Label>
                      <Select 
                        value={editForm.education} 
                        onValueChange={(v) => setEditForm({ ...editForm, education: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select education" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="matric">Matric / SSC</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="bachelor">Bachelor's Degree</SelectItem>
                          <SelectItem value="master">Master's Degree</SelectItem>
                          <SelectItem value="phd">PhD / Doctorate</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Province</Label>
                      <Select 
                        value={editForm.province} 
                        onValueChange={(v) => setEditForm({ ...editForm, province: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select province" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Punjab">Punjab</SelectItem>
                          <SelectItem value="Sindh">Sindh</SelectItem>
                          <SelectItem value="Khyber Pakhtunkhwa">Khyber Pakhtunkhwa</SelectItem>
                          <SelectItem value="Balochistan">Balochistan</SelectItem>
                          <SelectItem value="Islamabad">Islamabad</SelectItem>
                          <SelectItem value="AJK">AJK</SelectItem>
                          <SelectItem value="Gilgit-Baltistan">Gilgit-Baltistan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Domicile</Label>
                      <Input
                        value={editForm.domicile}
                        onChange={(e) => setEditForm({ ...editForm, domicile: e.target.value })}
                        placeholder="e.g., Lahore"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <User className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Full Name</p>
                        <p className="font-medium text-foreground">
                          {profile?.full_name || "Not set"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Calendar className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Date of Birth / Age</p>
                        <p className="font-medium text-foreground">
                          {profile?.date_of_birth 
                            ? `${profile.date_of_birth} (${calculateAge(profile.date_of_birth)} years)` 
                            : "Not set"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <User className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Gender</p>
                        <p className="font-medium text-foreground">
                          {profile?.gender 
                            ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1) 
                            : "Not set"}
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
                          {profile?.education 
                            ? educationLabels[profile.education] || profile.education 
                            : "Not set"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <MapPin className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Province</p>
                        <p className="font-medium text-foreground">
                          {profile?.province || "Not set"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <MapPin className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Domicile</p>
                        <p className="font-medium text-foreground">
                          {profile?.domicile || "Not set"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
