import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ServiceCategory {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  default_fee: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
}

export const useServiceCategories = () => {
  return useQuery({
    queryKey: ["service-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_categories")
        .select("*")
        .eq("is_active", true)
        .order("display_name");

      if (error) throw error;
      return data as ServiceCategory[];
    },
  });
};

export const useAllServiceCategories = () => {
  return useQuery({
    queryKey: ["all-service-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_categories")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ServiceCategory[];
    },
  });
};

export const useCreateServiceCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      display_name,
      description,
      default_fee,
    }: {
      name: string;
      display_name: string;
      description?: string;
      default_fee?: number;
    }) => {
      const { data, error } = await supabase
        .from("service_categories")
        .insert({
          name: name.toLowerCase().replace(/\s+/g, "_"),
          display_name,
          description: description || null,
          default_fee: default_fee || 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-categories"] });
      queryClient.invalidateQueries({ queryKey: ["all-service-categories"] });
      toast.success("Service category created!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useDeleteServiceCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("service_categories")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-categories"] });
      queryClient.invalidateQueries({ queryKey: ["all-service-categories"] });
      toast.success("Service category deleted!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useToggleServiceCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("service_categories")
        .update({ is_active })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-categories"] });
      queryClient.invalidateQueries({ queryKey: ["all-service-categories"] });
      toast.success("Category updated!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};
