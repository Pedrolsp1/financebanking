import { createFileRoute } from "@tanstack/react-router";
import { Plus, Repeat } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RowActions } from "@/components/RowActions";
import { brl, formatDate, useFinance } from "@/lib/finance-store";

export const Route = createFileRoute("/entradas")({
  head: () => ({
    meta: [
      { title: "Entradas — Finanças Pessoais" },
      {
        name: "description",
        content: "Registre salários, freelas e rendas recorrentes recebidas todo mês.",
      },
      { property: "og:title", content: "Entradas — Finanças Pessoais" },
      {
        property: "og:description",
        content: "Controle de todo o dinheiro que entra, com marcação de recorrência.",
      },
    ],
  }),
  component: Incomes,
});

function Incomes() {
  const { incomes, addIncome, updateIncome, deleteIncome, totals } = useFinance();
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [recurring, setRecurring] = useState(false);

  const recurringTotal = incomes.filter((i) => i.recurring).reduce((s, i) => s + i.value, 0);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = Number(value);
    if (!name.trim() || !v) return;
    addIncome({ name: name.trim(), value: v, date, recurring });
    setName("");
    setValue("");
    setRecurring(false);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <Card className="h-fit shadow-soft">
        <CardHeader>
          <CardTitle className="text-base">Nova entrada</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={submit}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="in-name">Nome</Label>
              <Input
                id="in-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Salário, freela..."
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="in-value">Valor (R$)</Label>
              <Input
                id="in-value"
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="0,00"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="in-date">Data</Label>
              <Input
                id="in-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
              <span className="flex items-center gap-2 text-sm">
                <Repeat className="h-4 w-4 text-primary" /> Recorrente
              </span>
              <Switch checked={recurring} onCheckedChange={setRecurring} />
            </div>
            <Button type="submit" className="w-full">
              <Plus className="h-4 w-4" /> Adicionar entrada
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="shadow-soft">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total recebido no mês</p>
              <p className="mt-2 text-2xl font-semibold">{brl(totals.income)}</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Renda recorrente</p>
              <p className="mt-2 text-2xl font-semibold">{brl(recurringTotal)}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-base">Histórico de entradas</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {incomes.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell className="font-medium">{i.name}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(i.date)}</TableCell>
                    <TableCell>
                      <Badge variant={i.recurring ? "default" : "secondary"}>
                        {i.recurring ? "Recorrente" : "Única"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-emerald-600">
                      +{brl(i.value)}
                    </TableCell>
                    <TableCell>
                      <RowActions
                        title="Editar entrada"
                        record={i}
                        fields={[
                          { key: "name", label: "Nome", type: "text" },
                          { key: "value", label: "Valor (R$)", type: "number" },
                          { key: "date", label: "Data", type: "date" },
                          { key: "recurring", label: "Recorrente", type: "switch" },
                        ]}
                        onSave={(v) => updateIncome(i.id, v)}
                        onDelete={() => deleteIncome(i.id)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {incomes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      Nenhuma entrada lançada ainda. Adicione a primeira ao lado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
