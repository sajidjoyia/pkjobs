import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface NotificationPreferences {
  id: string;
  user_id: string;
  email_enabled: boolean;
  push_enabled: boolean;
  whatsapp_enabled: boolean;
  whatsapp_number: string | null;
  frequency: "instant" | "daily";
  paused: boolean;
}

export const DEFAULT_PREFERENCES = {
  email_enabled: false,
  push_enabled: false,
  whatsapp_enabled: false,
  whatsapp_number: null,
  frequency: "instant" as const,
  paused: false,
};

export const useNotificationPreferences = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["notification-preferences", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return (data as NotificationPreferences | null);
    },
    enabled: !!user,
  });
};

export const useUpdateNotificationPreferences = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates: Partial<Omit<NotificationPreferences, "id" | "user_id">>) => {
      if (!user) throw new Error("Not signed in");
      const { data, error } = await supabase
        .from("notification_preferences")
        .upsert(
          { user_id: user.id, ...DEFAULT_PREFERENCES, ...updates },
          { onConflict: "user_id" }
        )
        .select("*")
        .single();
      if (error) throw error;
      return data as NotificationPreferences;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["notification-preferences", user?.id], data);
    },
  });
};
