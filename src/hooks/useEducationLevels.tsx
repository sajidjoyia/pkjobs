import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CustomEducationLevel {
  id: string;
  name: string;
  display_name: string;
  created_at: string;
}

// Default education levels
export const DEFAULT_EDUCATION_LEVELS = [
  { value: "matric", label: "Matric / SSC" },
  { value: "intermediate", label: "Intermediate / FA / FSc" },
  { value: "bachelor", label: "Bachelor's Degree" },
  { value: "master", label: "Master's Degree" },
  { value: "phd", label: "PhD / Doctorate" },
];

export const useCustomEducationLevels = () => {
  return useQuery({
    queryKey: ["custom-education-levels"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_education_levels")
        .select("*")
        .order("display_name", { ascending: true });

      if (error) throw error;
      return data as CustomEducationLevel[];
    },
  });
};

export const useAllEducationLevels = () => {
  const { data: customLevels = [], isLoading } = useCustomEducationLevels();

  const allLevels = [
    ...DEFAULT_EDUCATION_LEVELS,
    ...customLevels.map((level) => ({
      value: level.name,
      label: level.display_name,
    })),
  ];

  return { data: allLevels, isLoading };
};

export const useAddEducationLevel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, displayName }: { name: string; displayName: string }) => {
      const { data, error } = await supabase
        .from("custom_education_levels")
        .insert([{ name, display_name: displayName }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-education-levels"] });
      toast.success("Education level added successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useDeleteEducationLevel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("custom_education_levels")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-education-levels"] });
      toast.success("Education level deleted!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};