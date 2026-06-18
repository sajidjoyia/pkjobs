import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface NewsItem {
  id: string;
  title: string;
  url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export const useActiveNews = () =>
  useQuery({
    queryKey: ["news_items", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news_items")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as NewsItem[];
    },
    staleTime: 1000 * 60 * 2,
  });

export const useAllNews = () =>
  useQuery({
    queryKey: ["news_items", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news_items")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as NewsItem[];
    },
  });

export const useUpsertNews = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: Partial<NewsItem> & { title: string }) => {
      if (item.id) {
        const { error } = await supabase.from("news_items").update({
          title: item.title,
          url: item.url ?? null,
          is_active: item.is_active ?? true,
          sort_order: item.sort_order ?? 0,
        }).eq("id", item.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("news_items").insert({
          title: item.title,
          url: item.url ?? null,
          is_active: item.is_active ?? true,
          sort_order: item.sort_order ?? 0,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["news_items"] });
      toast.success("News saved");
    },
    onError: (e: any) => toast.error(e.message),
  });
};

export const useDeleteNews = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("news_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["news_items"] });
      toast.success("Deleted");
    },
  });
};
