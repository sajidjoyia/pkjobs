import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "./useAuth";

interface UpdateProfileInput {
  full_name?: string;
  date_of_birth?: string;
  gender?: "male" | "female" | "other";
  province?: string;
  domicile?: string;
  phone?: string;
}

export const useUpdateProfile = () => {
  const { user, refreshProfile } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateProfileInput) => {
      if (!user) throw new Error("You must be logged in");

      const { error } = await supabase
        .from("profiles")
        .update(input)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: async () => {
      await refreshProfile();
      toast.success("Profile updated successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const calculateAge = (dateOfBirth: string): number => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

export const getEducationLevel = (education: string): number => {
  const levels: Record<string, number> = {
    matric: 1,
    intermediate: 2,
    bachelor: 3,
    master: 4,
    phd: 5,
  };
  return levels[education] || 0;
};

export const isEligibleForJob = (
  profile: { 
    date_of_birth: string | null; 
    gender: string | null; 
    education: string | null;
    province: string | null;
    domicile: string | null;
  },
  job: {
    min_age: number;
    max_age: number;
    gender_requirement: string | null;
    required_education_levels: string[];
    provinces: string[];
    domicile: string | null;
  }
): { eligible: boolean; reasons: string[] } => {
  const reasons: string[] = [];

  // Check age
  if (profile.date_of_birth) {
    const age = calculateAge(profile.date_of_birth);
    if (age < job.min_age || age > job.max_age) {
      reasons.push(`Age requirement: ${job.min_age}-${job.max_age} years (your age: ${age})`);
    }
  }

  // Check gender
  if (job.gender_requirement && profile.gender && job.gender_requirement !== profile.gender) {
    reasons.push(`Gender requirement: ${job.gender_requirement} only`);
  }

  // Check education - user needs to have at least one of the required education levels or higher
  if (profile.education && job.required_education_levels.length > 0) {
    const userEducationLevel = getEducationLevel(profile.education);
    const minRequiredLevel = Math.min(...job.required_education_levels.map(getEducationLevel));
    if (userEducationLevel < minRequiredLevel) {
      reasons.push(`Education requirement: ${job.required_education_levels.join(", ")} or higher`);
    }
  }

  // Check province/domicile - if job has province restrictions
  if (job.provinces.length > 0 && profile.province) {
    const userProvince = profile.province.toLowerCase();
    const jobProvinces = job.provinces.map(p => p.toLowerCase());
    if (!jobProvinces.some(p => p.includes("all") || p.includes(userProvince) || userProvince.includes(p))) {
      reasons.push(`Province requirement: ${job.provinces.join(", ")}`);
    }
  }

  return {
    eligible: reasons.length === 0,
    reasons,
  };
};