import { createFileRoute } from "@tanstack/react-router";
import { CreditCard, Plus, Wallet } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { RowActions } from "@/components/RowActions";
import {
  CATEGORIES,
  CREDIT_LIMIT,
  MONTHLY_BUDGET,
  brl,
  formatDate,
  useFinance,
  type Category,
} from "@/lib/finance-store";

export const Route = createFileRoute("/saidas")({
  head: () => ({
    meta: [
      { title: "Saídas — Finanças Pessoais" },
      {
        name: "description",
        content:
          "Lance compras no cartão com parcelamento e gastos no débito ou Pix, com limite e orçamento acompanhados.",
      },
      { property: "og:title", content: "Saídas — Finanças Pessoais" },
      {
        property: "og:description",
        content: "Cartão de crédito parcelado e gastos do dia a dia em uma só tela.",
      },
    ],
  }),
  component: Expenses,
});

const MONTHS = ["Set", "Out", "Nov", "Dez", "Jan", "Fev"];

function Expenses() {
  return (
    <Tabs defaultValue="credito" className="flex flex-col gap-6">
      <TabsList className="w-fit">
        <TabsTrigger value="credito" className="gap-2">
          <CreditCard className="h-4 w-4" /> Cartão de crédito
        </TabsTrigger>
        <TabsTrigger value="debito" className="gap-2">
          <Wallet className="h-4 w-4" /> Débito / Pix
        </TabsTrigger>
      </TabsList>

      <TabsContent value="credito" className="m-0">
        <CreditTab />
      </TabsContent>
      <TabsContent value="debito" className="m-0">
        <DebitTab />
      </TabsContent>
    </Tabs>
  );
}

function CreditTab() {
  const { cardExpenses, addCardExpense, updateCardExpense, deleteCardExpense, totals } = useFinance();
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [category, setCategory] = useState<Category>("Compras");
  const [date, setDate] = useState("2026-09-20");
  const [installments, setInstallments] = useState("1");

  const usedPct = Math.min(100, (totals.cardBill / CREDIT_LIMIT) * 100);

  const projection = MONTHS.map((month, idx) => {
    const total = cardExpenses.reduce(
      (sum, e) => (idx < e.installments ? sum + e.value / e.installments : sum),
      0,
    );
    return { month, total };
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = Number(value);
    const n = Number(installments) || 1;
    if (!name.trim() || !v) return;
    addCardExpense({ name: name.trim(), value: v, category, date, installments: n });
    setName("");
    setValue("");
    setInstallments("1");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <Card className="h-fit shadow-soft">
        <CardHeader>
          <CardTitle className="text-base">Nova compra no cartão</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={submit}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="cc-name">Nome</Label>
              <Input id="cc-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="cc-value">Valor total (R$)</Label>
              <Input
                id="cc-value"
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Categoria</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="cc-date">Data</Label>
                <Input
                  id="cc-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="cc-inst">Parcelas</Label>
                <Input
                  id="cc-inst"
                  type="number"
                  min={1}
                  max={24}
                  value={installments}
                  onChange={(e) => setInstallments(e.target.value)}
                />
              </div>
            </div>
            <Button type="submit" className="w-full">
              <Plus className="h-4 w-4" /> Adicionar compra
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-6">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-base">Limite do cartão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-muted-foreground">
                {brl(totals.cardBill)} usados de {brl(CREDIT_LIMIT)}
              </span>
              <span className="font-semibold">{usedPct.toFixed(0)}%</span>
            </div>
            <Progress value={usedPct} className="h-3" />
            <p className="mt-2 text-xs text-muted-foreground">
              Disponível: {brl(Math.max(0, CREDIT_LIMIT - totals.cardBill))}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-base">Parcelas nos próximos meses</CardTitle>
          </CardHeader>
          <CardContent className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projection}>
                <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="4 4" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  width={56}
                  tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                />
                <Tooltip
                  formatter={(v: number) => [brl(v), "Parcelas"]}
                  contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)" }}
                />
                <Bar
                  dataKey="total"
                  fill="var(--color-primary)"
                  radius={[8, 8, 0, 0]}
                  animationDuration={800}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-base">Compras lançadas</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Parcelas</TableHead>
                  <TableHead className="text-right">Valor total</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {cardExpenses.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{e.category}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(e.date)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {e.installments}x {brl(e.value / e.installments)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">{brl(e.value)}</TableCell>
                    <TableCell>
                      <RowActions
                        title="Editar compra"
                        record={e}
                        fields={[
                          { key: "name", label: "Nome", type: "text" },
                          { key: "value", label: "Valor total (R$)", type: "number" },
                          { key: "category", label: "Categoria", type: "select", options: CATEGORIES },
                          { key: "date", label: "Data", type: "date" },
                          { key: "installments", label: "Parcelas", type: "number" },
                        ]}
                        onSave={(v) =>
                          updateCardExpense(e.id, { ...v, installments: Math.max(1, Number(v.installments)) })
                        }
                        onDelete={() => deleteCardExpense(e.id)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DebitTab() {
  const { debitExpenses, addDebitExpense, updateDebitExpense, deleteDebitExpense, totals } = useFinance();
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [category, setCategory] = useState<Category>("Casa");
  const [date, setDate] = useState("2026-09-20");
  const [method, setMethod] = useState<"Débito" | "Pix">("Pix");

  const budgetPct = Math.min(100, (totals.budgetUsed / MONTHLY_BUDGET) * 100);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = Number(value);
    if (!name.trim() || !v) return;
    addDebitExpense({ name: name.trim(), value: v, category, date, method });
    setName("");
    setValue("");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <Card className="h-fit shadow-soft">
        <CardHeader>
          <CardTitle className="text-base">Novo gasto (débito / Pix)</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={submit}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="db-name">Nome</Label>
              <Input id="db-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="db-value">Valor (R$)</Label>
              <Input
                id="db-value"
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Categoria</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="db-date">Data</Label>
                <Input
                  id="db-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Forma</Label>
                <Select value={method} onValueChange={(v) => setMethod(v as "Débito" | "Pix")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pix">Pix</SelectItem>
                    <SelectItem value="Débito">Débito</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" className="w-full">
              <Plus className="h-4 w-4" /> Adicionar gasto
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-6">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-base">Orçamento mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-muted-foreground">
                {brl(totals.budgetUsed)} de {brl(MONTHLY_BUDGET)}
              </span>
              <span className="font-semibold">{budgetPct.toFixed(0)}%</span>
            </div>
            <Progress value={budgetPct} className="h-3" />
            <p className="mt-2 text-xs text-muted-foreground">
              Aportes em investimentos não entram no orçamento de consumo.
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-base">Gastos do dia a dia</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Forma</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {debitExpenses.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{e.category}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{e.method}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(e.date)}</TableCell>
                    <TableCell className="text-right font-semibold">−{brl(e.value)}</TableCell>
                    <TableCell>
                      <RowActions
                        title="Editar gasto"
                        record={e}
                        fields={[
                          { key: "name", label: "Nome", type: "text" },
                          { key: "value", label: "Valor (R$)", type: "number" },
                          { key: "category", label: "Categoria", type: "select", options: CATEGORIES },
                          { key: "method", label: "Forma", type: "select", options: ["Débito", "Pix"] },
                          { key: "date", label: "Data", type: "date" },
                        ]}
                        onSave={(v) => updateDebitExpense(e.id, v)}
                        onDelete={() => deleteDebitExpense(e.id)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
