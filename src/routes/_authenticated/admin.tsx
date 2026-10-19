import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/finance-store";
import { useMyRole } from "@/lib/use-role";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Administração — Finanças Pessoais" },
      { name: "description", content: "Gerencie os usuários e administradores do app." },
      { property: "og:title", content: "Administração — Finanças Pessoais" },
      { property: "og:description", content: "Painel do administrador." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

const roleLabel: Record<string, string> = { owner: "Proprietário", admin: "Administrador", user: "Usuário" };

function AdminPage() {
  const { role, userId, loading } = useMyRole();
  const qc = useQueryClient();
  const isAdmin = role === "owner" || role === "admin";
  const users = useQuery({
    queryKey: ["admin-users"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_users");
      if (error) throw error;
      return data ?? [];
    },
  });

  if (loading) return null;
  if (!isAdmin)
    return (
      <Card><CardContent className="p-6 text-sm text-muted-foreground">Você não tem acesso a esta página.</CardContent></Card>
    );

  const toggle = async (id: string, make: boolean) => {
    const { error } = await supabase.rpc("owner_set_admin", { _target: id, _make_admin: make });
    if (error) {
      toast.error("Não foi possível alterar o acesso.");
      return;
    }
    toast.success(make ? "Agora é administrador" : "Acesso de administrador removido");
    qc.invalidateQueries({ queryKey: ["admin-users"] });
  };

  return (
    <Card className="shadow-soft">
      <CardHeader className="flex flex-row items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-primary" />
        <CardTitle>Usuários ({users.data?.length ?? 0})</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>E-mail</TableHead>
              <TableHead>Cadastro</TableHead>
              <TableHead>Último acesso</TableHead>
              <TableHead>Acesso</TableHead>
              {role === "owner" && <TableHead className="text-right">Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {(users.data ?? []).map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.email}</TableCell>
                <TableCell>{formatDate(u.created_at.slice(0, 10))}</TableCell>
                <TableCell>{u.last_sign_in_at ? formatDate(u.last_sign_in_at.slice(0, 10)) : "—"}</TableCell>
                <TableCell>
                  <Badge variant={u.role === "user" ? "secondary" : "default"}>{roleLabel[u.role] ?? u.role}</Badge>
                </TableCell>
                {role === "owner" && (
                  <TableCell className="text-right">
                    {u.id !== userId && u.role !== "owner" && (
                      <Button size="sm" variant="outline" onClick={() => toggle(u.id, u.role !== "admin")}>
                        {u.role === "admin" ? "Remover admin" : "Tornar admin"}
                      </Button>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
