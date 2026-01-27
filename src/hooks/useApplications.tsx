import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "./useAuth";

export interface Application {
  id: string;
  user_id: string;
  job_id: string;
  status: "pending" | "payment_received" | "expert_assigned" | "in_progress" | "applied" | "completed";
  expert_id: string | null;
  payment_amount: number | null;
  payment_date: string | null;
  receipt_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  job?: {
    id: string;
    title: string;
    department: string;
    total_fee: number;
    last_date: string;
  };
  profile?: {
    full_name: string;
  };
}

export const useMyApplications = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-applications", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("applications")
        .select(`
          *,
          job:jobs(id, title, department, total_fee, last_date)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Application[];
    },
    enabled: !!user,
  });
};

export const useAllApplications = () => {
  return useQuery({
    queryKey: ["all-applications"],
    queryFn: async () => {
      // Get applications with jobs
      const { data: applications, error } = await supabase
        .from("applications")
        .select(`
          *,
          job:jobs(id, title, department, total_fee, last_date)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Fetch profiles for user_ids
      const userIds = [...new Set(applications.map(app => app.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      return applications.map(app => ({
        ...app,
        profile: profileMap.get(app.user_id) || { full_name: "Unknown User" }
      })) as Application[];
    },
  });
};

export const useCreateApplication = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ job_id, payment_amount }: { job_id: string; payment_amount: number }) => {
      if (!user) throw new Error("You must be logged in to apply");

      // Check if already applied
      const { data: existing } = await supabase
        .from("applications")
        .select("id")
        .eq("user_id", user.id)
        .eq("job_id", job_id)
        .single();

      if (existing) {
        throw new Error("You have already applied for this job");
      }

      const { data, error } = await supabase
        .from("applications")
        .insert([{
          user_id: user.id,
          job_id,
          payment_amount,
          status: "pending",
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-applications"] });
      toast.success("Application submitted successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useUpdateApplicationStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      expert_id,
      receipt_url,
      notes 
    }: { 
      id: string; 
      status: Application["status"];
      expert_id?: string;
      receipt_url?: string;
      notes?: string;
    }) => {
      const updates: Partial<Application> = { status };
      if (expert_id) updates.expert_id = expert_id;
      if (receipt_url) updates.receipt_url = receipt_url;
      if (notes) updates.notes = notes;

      const { error } = await supabase
        .from("applications")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-applications"] });
      queryClient.invalidateQueries({ queryKey: ["all-applications"] });
      toast.success("Application updated successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useCheckIfApplied = (jobId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["application-check", jobId, user?.id],
    queryFn: async () => {
      if (!user || !jobId) return false;

      const { data } = await supabase
        .from("applications")
        .select("id")
        .eq("user_id", user.id)
        .eq("job_id", jobId)
        .single();

      return !!data;
    },
    enabled: !!user && !!jobId,
  });
};
