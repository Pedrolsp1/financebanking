import { createFileRoute } from "@tanstack/react-router";
import { Plus, Target, TrendingUp } from "lucide-react";
import { useState } from "react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RowActions } from "@/components/RowActions";
import { toast } from "sonner";
import { brl, brlExact, CDI_ANNUAL, estimateYield, formatDate, useFinance } from "@/lib/finance-store";

export const Route = createFileRoute("/investimentos")({
  head: () => ({
    meta: [
      { title: "Investimentos — Finanças Pessoais" },
      {
        name: "description",
        content:
          "Carteira sincronizada com os aportes da categoria Investimento, alocação por ativo e metas financeiras.",
      },
      { property: "og:title", content: "Investimentos — Finanças Pessoais" },
      {
        property: "og:description",
        content: "Veja a divisão da sua carteira e o progresso das suas metas.",
      },
    ],
  }),
  component: Investments,
});

const COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

function Investments() {
  const {
    debitExpenses,
    cardExpenses,
    goals,
    addGoal,
    addDebitExpense,
    updateGoal,
    deleteGoal,
    updateDebitExpense,
    deleteDebitExpense,
    updateCardExpense,
    deleteCardExpense,
    totals,
  } = useFinance();
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [saved, setSaved] = useState("");
  const [invName, setInvName] = useState("");
  const [invValue, setInvValue] = useState("");
  const [invPct, setInvPct] = useState("100");
  const [invDate, setInvDate] = useState(new Date().toISOString().slice(0, 10));

  const assets = [...debitExpenses, ...cardExpenses].filter((e) => e.category === "Investimento");
  const pctOf = (a: (typeof assets)[number]) => ("cdiPct" in a ? a.cdiPct : undefined);
  const totalEarned = assets.reduce((s, a) => {
    const p = pctOf(a);
    return p ? s + estimateYield(a.value, p, a.date).earned : s;
  }, 0);
  const totalYearly = assets.reduce((s, a) => {
    const p = pctOf(a);
    return p ? s + estimateYield(a.value, p, a.date).yearly : s;
  }, 0);

  const submitInvestment = (e: React.FormEvent) => {
    e.preventDefault();
    const v = Number(invValue);
    if (!invName.trim() || !v) return;
    addDebitExpense({
      name: invName.trim(),
      value: v,
      category: "Investimento",
      date: invDate,
      method: "Pix",
      cdiPct: Number(invPct) || 0,
    });
    setInvName("");
    setInvValue("");
    toast.success("Aporte adicionado");
  };

  const byAsset = Object.values(
    assets.reduce<Record<string, { name: string; value: number }>>((acc, a) => {
      const entry = acc[a.name] ?? { name: a.name, value: 0 };
      entry.value += a.value;
      acc[a.name] = entry;
      return acc;
    }, {}),
  );

  const total = byAsset.reduce((s, a) => s + a.value, 0) || 1;

  const submitGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const t = Number(target);
    if (!name.trim() || !t) return;
    addGoal({ name: name.trim(), target: t, saved: Number(saved) || 0 });
    setName("");
    setTarget("");
    setSaved("");
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-soft">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total aportado</p>
            <p className="mt-2 text-2xl font-semibold">{brl(totals.invested)}</p>
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Ativos na carteira</p>
            <p className="mt-2 text-2xl font-semibold">{byAsset.length}</p>
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Rendimento acumulado</p>
            <p className="mt-2 text-2xl font-semibold text-primary">{brlExact(totalEarned)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Estimado {brl(totalYearly)}/ano · CDI {(CDI_ANNUAL * 100).toFixed(2)}% a.a.
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Patrimônio líquido</p>
            <p className="mt-2 text-2xl font-semibold">{brl(totals.netWorth)}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-base">Novo aporte</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto] lg:items-end"
            onSubmit={submitInvestment}
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="inv-name">Ativo</Label>
              <Input id="inv-name" placeholder="Ex.: CDB Banco X" value={invName} onChange={(e) => setInvName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="inv-value">Valor (R$)</Label>
              <Input id="inv-value" type="number" value={invValue} onChange={(e) => setInvValue(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="inv-pct">% do CDI</Label>
              <Input id="inv-pct" type="number" value={invPct} onChange={(e) => setInvPct(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="inv-date">Data</Label>
              <Input id="inv-date" type="date" value={invDate} onChange={(e) => setInvDate(e.target.value)} />
            </div>
            <Button type="submit">
              <Plus className="h-4 w-4" /> Adicionar
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-primary" /> Alocação da carteira
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={byAsset}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={105}
                  paddingAngle={3}
                  animationDuration={900}
                  label={({ value }) => `${(((value as number) / total) * 100).toFixed(1)}%`}
                >
                  {byAsset.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number, n) => [
                    `${brl(v)} (${((v / total) * 100).toFixed(1)}%)`,
                    n as string,
                  ]}
                  contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)" }}
                />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-base">Aportes sincronizados</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ativo</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">% CDI</TableHead>
                  <TableHead className="text-right">Rendimento</TableHead>
                  <TableHead className="text-right">%</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {assets.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.name}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(a.date)}</TableCell>
                    <TableCell className="text-right font-semibold">{brl(a.value)}</TableCell>
                    <TableCell className="text-right">{pctOf(a) ? `${pctOf(a)}%` : "—"}</TableCell>
                    <TableCell className="text-right text-primary">
                      {pctOf(a) ? brlExact(estimateYield(a.value, pctOf(a)!, a.date).earned) : "—"}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {((a.value / total) * 100).toFixed(1)}%
                    </TableCell>
                    <TableCell>
                      <RowActions
                        title="Editar aporte"
                        record={a}
                        fields={[
                          { key: "name", label: "Ativo", type: "text" },
                          { key: "value", label: "Valor (R$)", type: "number" },
                          { key: "date", label: "Data", type: "date" },
                          ...("method" in a ? [{ key: "cdiPct", label: "% do CDI", type: "number" as const }] : []),
                        ]}
                        onSave={(v) =>
                          "method" in a ? updateDebitExpense(a.id, v) : updateCardExpense(a.id, v)
                        }
                        onDelete={() =>
                          "method" in a ? deleteDebitExpense(a.id) : deleteCardExpense(a.id)
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {assets.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                      Nenhum aporte ainda. Adicione o primeiro acima.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4 text-primary" /> Metas financeiras
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {goals.map((g) => {
              const pct = Math.min(100, (g.saved / g.target) * 100);
              return (
                <div key={g.id}>
                  <div className="mb-2 flex flex-wrap justify-between gap-2 text-sm">
                    <span className="font-medium">{g.name}</span>
                    <span className="flex items-center gap-2 text-muted-foreground">
                      {brl(g.saved)} de {brl(g.target)} · {pct.toFixed(0)}%
                      <RowActions
                        title="Editar meta"
                        record={g}
                        fields={[
                          { key: "name", label: "Nome da meta", type: "text" },
                          { key: "target", label: "Valor alvo (R$)", type: "number" },
                          { key: "saved", label: "Já guardado (R$)", type: "number" },
                        ]}
                        onSave={(v) => updateGoal(g.id, v)}
                        onDelete={() => deleteGoal(g.id)}
                      />
                    </span>
                  </div>
                  <Progress value={pct} className="h-3" />
                </div>
                );
              })}
              {goals.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Nenhuma meta ainda. Crie a primeira ao lado.
                </p>
              )}
            </CardContent>
        </Card>

        <Card className="h-fit shadow-soft">
          <CardHeader>
            <CardTitle className="text-base">Nova meta</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-4" onSubmit={submitGoal}>
              <div className="flex flex-col gap-2">
                <Label htmlFor="goal-name">Nome da meta</Label>
                <Input id="goal-name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="goal-target">Valor alvo (R$)</Label>
                <Input
                  id="goal-target"
                  type="number"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="goal-saved">Já guardado (R$)</Label>
                <Input
                  id="goal-saved"
                  type="number"
                  value={saved}
                  onChange={(e) => setSaved(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full">
                <Plus className="h-4 w-4" /> Criar meta
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
