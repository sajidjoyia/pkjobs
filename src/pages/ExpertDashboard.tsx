import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Briefcase,
  User,
  MessageSquare,
  Loader2,
  FileText,
  Clock,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useExpertAssignments, ExpertAssignment } from "@/hooks/useExpertAssignments";
import { openApplicationChat } from "@/components/chat/ChatWidget";

const statusLabels: Record<string, string> = {
  pending: "Pending",
  payment_received: "Payment Received",
  expert_assigned: "Expert Assigned",
  in_progress: "In Progress",
  applied: "Applied",
  completed: "Completed",
};

const statusProgress: Record<string, number> = {
  pending: 10,
  payment_received: 25,
  expert_assigned: 40,
  in_progress: 60,
  applied: 90,
  completed: 100,
};

const ExpertDashboard = () => {
  const { user, profile } = useAuth();
  const { data: assignments = [], isLoading } = useExpertAssignments();
  const [activeTab, setActiveTab] = useState("assigned");

  const activeAssignments = assignments.filter(
    (a) => !["completed", "applied"].includes(a.status)
  );
  const completedAssignments = assignments.filter(
    (a) => ["completed", "applied"].includes(a.status)
  );

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-warning",
      payment_received: "bg-info",
      expert_assigned: "bg-info",
      in_progress: "bg-primary",
      applied: "bg-success",
      completed: "bg-success",
    };
    return <Badge className={colors[status] || "bg-muted"}>{statusLabels[status] || status}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="py-4 sm:py-8">
      <div className="container px-4 sm:px-6">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">
            Expert Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Welcome, {profile?.full_name || "Expert"}. Manage your assigned applications.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Briefcase className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{assignments.length}</p>
                <p className="text-xs text-muted-foreground">Total Assigned</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-info/10 flex items-center justify-center">
                <Clock className="h-4 w-4 text-info" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{activeAssignments.length}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-success/10 flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-success" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{completedAssignments.length}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="assigned" className="gap-1.5">
              <Briefcase className="h-4 w-4" /> Active ({activeAssignments.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-1.5">
              <CheckCircle className="h-4 w-4" /> Completed ({completedAssignments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assigned">
            {activeAssignments.length === 0 ? (
              <div className="card-elevated p-8 text-center">
                <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No Active Assignments</h3>
                <p className="text-muted-foreground">You'll see assigned applications here once admin assigns them to you.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeAssignments.map((assignment) => (
                  <AssignmentCard key={assignment.id} assignment={assignment} getStatusBadge={getStatusBadge} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed">
            {completedAssignments.length === 0 ? (
              <div className="card-elevated p-8 text-center">
                <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No completed assignments yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {completedAssignments.map((assignment) => (
                  <AssignmentCard key={assignment.id} assignment={assignment} getStatusBadge={getStatusBadge} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const AssignmentCard = ({
  assignment,
  getStatusBadge,
}: {
  assignment: ExpertAssignment;
  getStatusBadge: (status: string) => React.ReactNode;
}) => {
  return (
    <div className="card-elevated p-4 sm:p-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-start gap-3 mb-3">
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {assignment.type === "application"
                  ? assignment.job?.title || "Job Application"
                  : assignment.category?.display_name || "Work Request"}
              </h3>
              <p className="text-muted-foreground text-sm">
                {assignment.type === "application"
                  ? assignment.job?.department
                  : assignment.custom_description}
              </p>
            </div>
            {getStatusBadge(assignment.status)}
          </div>

          {/* User Info (admin-controlled visibility) */}
          {assignment.profile && (
            <div className="bg-muted/50 rounded-lg p-3 mb-3">
              <p className="text-sm font-medium text-foreground flex items-center gap-2">
                <User className="h-4 w-4" />
                Applicant: {assignment.profile.full_name}
              </p>
              {assignment.profile.phone && (
                <p className="text-sm text-muted-foreground ml-6">Phone: {assignment.profile.phone}</p>
              )}
              {assignment.profile.province && (
                <p className="text-sm text-muted-foreground ml-6">Province: {assignment.profile.province}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{statusProgress[assignment.status] || 0}%</span>
            </div>
            <Progress value={statusProgress[assignment.status] || 0} className="h-2" />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {assignment.payment_amount && (
            <div className="text-sm text-muted-foreground">
              Fee: <span className="font-medium text-foreground">Rs. {Number(assignment.payment_amount).toLocaleString()}</span>
            </div>
          )}
          <div className="flex gap-2">
            {assignment.type === "application" && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => openApplicationChat(assignment.id, assignment.job?.title || "Application")}
              >
                <MessageSquare className="h-4 w-4" />
                Chat
              </Button>
            )}
            {assignment.notes && (
              <Button variant="ghost" size="sm" title={assignment.notes}>
                <FileText className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpertDashboard;
