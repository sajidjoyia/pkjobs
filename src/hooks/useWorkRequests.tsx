import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "./useAuth";

export interface WorkRequest {
  id: string;
  user_id: string;
  category_id: string | null;
  custom_description: string;
  status: "pending" | "payment_received" | "expert_assigned" | "in_progress" | "applied" | "completed";
  expert_id: string | null;
  payment_amount: number | null;
  payment_date: string | null;
  receipt_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  category?: {
    id: string;
    display_name: string;
    default_fee: number;
  };
  profile?: {
    full_name: string;
  };
}

export const useMyWorkRequests = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-work-requests", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("work_requests")
        .select(`
          *,
          category:service_categories(id, display_name, default_fee)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as WorkRequest[];
    },
    enabled: !!user,
  });
};

export const useAllWorkRequests = () => {
  return useQuery({
    queryKey: ["all-work-requests"],
    queryFn: async () => {
      const { data: workRequests, error } = await supabase
        .from("work_requests")
        .select(`
          *,
          category:service_categories(id, display_name, default_fee)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles for user_ids
      const userIds = [...new Set(workRequests.map((wr) => wr.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

      return workRequests.map((wr) => ({
        ...wr,
        profile: profileMap.get(wr.user_id) || { full_name: "Unknown User" },
      })) as WorkRequest[];
    },
  });
};

export const useCreateWorkRequest = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      category_id,
      custom_description,
      payment_amount,
    }: {
      category_id?: string;
      custom_description: string;
      payment_amount?: number;
    }) => {
      if (!user) throw new Error("You must be logged in");

      const { data, error } = await supabase
        .from("work_requests")
        .insert({
          user_id: user.id,
          category_id: category_id || null,
          custom_description,
          payment_amount: payment_amount || null,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-work-requests"] });
      queryClient.invalidateQueries({ queryKey: ["all-work-requests"] });
      toast.success("Work request submitted successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useUpdateWorkRequestStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      expert_id,
      payment_amount,
      receipt_url,
      notes,
    }: {
      id: string;
      status: WorkRequest["status"];
      expert_id?: string;
      payment_amount?: number;
      receipt_url?: string;
      notes?: string;
    }) => {
      const updates: Partial<WorkRequest> = { status };
      if (expert_id) updates.expert_id = expert_id;
      if (payment_amount !== undefined) updates.payment_amount = payment_amount;
      if (receipt_url) updates.receipt_url = receipt_url;
      if (notes) updates.notes = notes;

      const { error } = await supabase
        .from("work_requests")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-work-requests"] });
      queryClient.invalidateQueries({ queryKey: ["all-work-requests"] });
      toast.success("Work request updated!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

// Get or create conversation for work request (similar to applications)
export const useGetOrCreateWorkRequestConversation = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      workRequestId,
      categoryName,
    }: {
      workRequestId: string;
      categoryName: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      // Check if conversation already exists
      const { data: existing } = await supabase
        .from("conversations")
        .select("*")
        .eq("work_request_id", workRequestId)
        .eq("user_id", user.id)
        .single();

      if (existing) return existing;

      // Create new conversation
      const { data, error } = await supabase
        .from("conversations")
        .insert({
          user_id: user.id,
          subject: `Work Request: ${categoryName}`,
          work_request_id: workRequestId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-conversations"] });
      queryClient.invalidateQueries({ queryKey: ["all-conversations"] });
    },
  });
};
