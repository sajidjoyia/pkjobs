import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Job {
  id: string;
  title: string;
  department: string;
  description: string | null;
  required_education: "matric" | "intermediate" | "bachelor" | "master" | "phd";
  min_age: number;
  max_age: number;
  gender_requirement: "male" | "female" | "other" | null;
  province: string | null;
  domicile: string | null;
  total_seats: number;
  last_date: string;
  bank_challan_fee: number;
  post_office_fee: number;
  photocopy_fee: number;
  expert_fee: number;
  total_fee: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateJobInput {
  title: string;
  department: string;
  description?: string;
  required_education: "matric" | "intermediate" | "bachelor" | "master" | "phd";
  min_age: number;
  max_age: number;
  gender_requirement?: "male" | "female" | "other" | null;
  province?: string;
  domicile?: string;
  total_seats: number;
  last_date: string;
  bank_challan_fee: number;
  post_office_fee: number;
  photocopy_fee: number;
  expert_fee: number;
}

export const useJobs = (filters?: {
  search?: string;
  province?: string;
  education?: string;
}) => {
  return useQuery({
    queryKey: ["jobs", filters],
    queryFn: async () => {
      let query = supabase
        .from("jobs")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (filters?.search) {
        query = query.or(
          `title.ilike.%${filters.search}%,department.ilike.%${filters.search}%`
        );
      }

      if (filters?.province && filters.province !== "all") {
        query = query.ilike("province", `%${filters.province}%`);
      }

      if (filters?.education && filters.education !== "all") {
        query = query.eq("required_education", filters.education as "matric" | "intermediate" | "bachelor" | "master" | "phd");
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Job[];
    },
  });
};

export const useJob = (id: string | undefined) => {
  return useQuery({
    queryKey: ["job", id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Job;
    },
    enabled: !!id,
  });
};

export const useAllJobs = () => {
  return useQuery({
    queryKey: ["all-jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Job[];
    },
  });
};

export const useCreateJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateJobInput) => {
      const { data, error } = await supabase
        .from("jobs")
        .insert([input])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["all-jobs"] });
      toast.success("Job created successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useDeleteJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("jobs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["all-jobs"] });
      toast.success("Job deleted successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useToggleJobStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("jobs")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["all-jobs"] });
      toast.success("Job status updated!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};
