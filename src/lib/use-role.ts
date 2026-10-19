import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type MyRole = "owner" | "admin" | "user";

export function useMyRole() {
  const q = useQuery({
    queryKey: ["my-role"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return { userId: null, role: "user" as MyRole };
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id);
      const roles = (data ?? []).map((r) => r.role);
      const role: MyRole = roles.includes("owner") ? "owner" : roles.includes("admin") ? "admin" : "user";
      return { userId: u.user.id, role };
    },
  });
  return { loading: q.isLoading, role: q.data?.role ?? "user", userId: q.data?.userId ?? null };
}
