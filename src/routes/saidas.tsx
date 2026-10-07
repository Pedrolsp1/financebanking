import { createFileRoute } from "@tanstack/react-router";
import { CreditCard, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RowActions } from "@/components/RowActions";
import { MONTHLY_BUDGET, brl, formatDate, useFinance, type CreditCardAccount } from "@/lib/finance-store";

export const Route = createFileRoute("/saidas")({
  head: () => ({
    meta: [
      { title: "Saídas — Finanças Pessoais" },
      { name: "description", content: "Lance saídas no Pix, débito, cartões de crédito ou investimentos e veja tudo por mês." },
      { property: "og:title", content: "Saídas — Finanças Pessoais" },
      { property: "og:description", content: "Todas as suas saídas, cartões e limites em uma só tela, mês a mês." },
    ],
  }),
  component: Expenses,
});

const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const thisMonth = () => new Date().toISOString().slice(0, 7);
const monthIndex = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return (y ?? 0) * 12 + ((m ?? 1) - 1);
};
const monthLabel = (idx: number) => `${MONTH_LABELS[idx % 12]}/${String(Math.floor(idx / 12)).slice(2)}`;
const NEW_CAT = "__new__";

type Row = {
  id: string;
  kind: "card" | "debit";
  name: string;
  category: string;
  date: string;
  forma: string;
  installments: number;
  total: number;
  inPeriod: number;
};

function Expenses() {
  const f = useFinance();
  const { cards, categories, cardExpenses, debitExpenses } = f;

  const [from, setFrom] = useState(thisMonth);
  const [to, setTo] = useState(thisMonth);
  const a = Math.min(monthIndex(from), monthIndex(to));
  const b = Math.max(monthIndex(from), monthIndex(to));

  const investAssets = useMemo(
    () => [...new Set([...debitExpenses, ...cardExpenses].filter((e) => e.category === "Investimento").map((e) => e.name))],
    [debitExpenses, cardExpenses],
  );

  // Valor de uma compra no cartão que cai em cada mês (parcelas)
  const cardInRange = (e: (typeof cardExpenses)[number], lo: number, hi: number) => {
    const start = monthIndex(e.date.slice(0, 7));
    let s = 0;
    for (let i = 0; i < e.installments; i++) if (start + i >= lo && start + i <= hi) s += e.value / e.installments;
    return s;
  };

  const cardName = (id?: string) => cards.find((c) => c.id === id)?.name ?? cards[0]?.name ?? "Cartão";

  const rows: Row[] = [
    ...cardExpenses.map((e) => ({
      id: e.id, kind: "card" as const, name: e.name, category: e.category, date: e.date,
      forma: cardName(e.cardId), installments: e.installments, total: e.value, inPeriod: cardInRange(e, a, b),
    })),
    ...debitExpenses
      .filter((e) => !e.noExpense)
      .map((e) => {
        const m = monthIndex(e.date.slice(0, 7));
        return {
          id: e.id, kind: "debit" as const, name: e.name, category: e.category, date: e.date,
          forma: e.method, installments: 1, total: e.value, inPeriod: m >= a && m <= b ? e.value : 0,
        };
      }),
  ]
    .filter((r) => r.inPeriod > 0)
    .sort((x, y) => y.date.localeCompare(x.date));

  const periodTotal = rows.reduce((s, r) => s + r.inPeriod, 0);
  const months = b - a + 1;
  const budget = MONTHLY_BUDGET * months;
  const consumption = rows.filter((r) => r.category !== "Investimento").reduce((s, r) => s + r.inPeriod, 0);
  const budgetPct = Math.min(100, (consumption / budget) * 100);

  const byCategory = Object.entries(
    rows.reduce<Record<string, number>>((acc, r) => ((acc[r.category] = (acc[r.category] ?? 0) + r.inPeriod), acc), {}),
  ).sort((x, y) => y[1] - x[1]);

  const now = monthIndex(thisMonth());
  const projection = Array.from({ length: 6 }, (_, i) => ({
    month: monthLabel(now + i),
    total: cardExpenses.reduce((s, e) => s + cardInRange(e, now + i, now + i), 0),
  }));

  return (
    <div className="flex flex-col gap-6">
      <Card className="shadow-soft">
        <CardContent className="flex flex-wrap items-end gap-4 pt-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="from">De</Label>
            <Input id="from" type="month" value={from} onChange={(e) => e.target.value && setFrom(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="to">Até</Label>
            <Input id="to" type="month" value={to} onChange={(e) => e.target.value && setTo(e.target.value)} />
          </div>
          <Button variant="outline" onClick={() => { setFrom(thisMonth()); setTo(thisMonth()); }}>Mês atual</Button>
          <div className="ml-auto text-right">
            <p className="text-sm text-muted-foreground">Total de saídas no período</p>
            <p className="text-2xl font-semibold">{brl(periodTotal)}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <NewExpenseForm investAssets={investAssets} />

        <div className="flex flex-col gap-6">
          <CardsPanel cardInRange={cardInRange} lo={a} hi={b} />

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-soft">
              <CardHeader><CardTitle className="text-base">Orçamento ({months} {months > 1 ? "meses" : "mês"})</CardTitle></CardHeader>
              <CardContent>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-muted-foreground">{brl(consumption)} de {brl(budget)}</span>
                  <span className="font-semibold">{budgetPct.toFixed(0)}%</span>
                </div>
                <Progress value={budgetPct} className="h-3" />
                <div className="mt-4 flex flex-col gap-1.5 text-sm">
                  {byCategory.map(([c, v]) => (
                    <div key={c} className="flex justify-between"><span className="text-muted-foreground">{c}</span><span>{brl(v)}</span></div>
                  ))}
                  {byCategory.length === 0 && <p className="text-muted-foreground">Sem saídas no período.</p>}
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-soft">
              <CardHeader><CardTitle className="text-base">Parcelas nos próximos meses</CardTitle></CardHeader>
              <CardContent className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={projection}>
                    <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="4 4" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                    <YAxis tickLine={false} axisLine={false} fontSize={12} width={56} tickFormatter={(v: number) => brl(v)} />
                    <Tooltip formatter={(v: number) => [brl(v), "Parcelas"]} contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)" }} />
                    <Bar dataKey="total" fill="var(--color-primary)" radius={[8, 8, 0, 0]} animationDuration={800} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-soft">
            <CardHeader><CardTitle className="text-base">Saídas do período</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Forma</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Parcelas</TableHead>
                    <TableHead className="text-right">No período</TableHead>
                    <TableHead className="w-24" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell><Badge variant="secondary">{r.category}</Badge></TableCell>
                      <TableCell className="text-muted-foreground">{r.forma}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(r.date)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {r.kind === "card" ? `${r.installments}x ${brl(r.total / r.installments)}` : "—"}
                      </TableCell>
                      <TableCell className="text-right font-semibold">−{brl(r.inPeriod)}</TableCell>
                      <TableCell>
                        {r.kind === "card" ? (
                          <RowActions
                            title="Editar saída"
                            record={cardExpenses.find((e) => e.id === r.id)!}
                            fields={[
                              { key: "name", label: "Nome", type: "text" },
                              { key: "value", label: "Valor total (R$)", type: "number" },
                              { key: "category", label: "Categoria", type: "select", options: categories },
                              { key: "date", label: "Data", type: "date" },
                              { key: "installments", label: "Parcelas", type: "number" },
                            ]}
                            onSave={(v) => f.updateCardExpense(r.id, { ...v, installments: Math.max(1, Number(v["installments"])) })}
                            onDelete={() => f.deleteCardExpense(r.id)}
                          />
                        ) : (
                          <RowActions
                            title="Editar saída"
                            record={debitExpenses.find((e) => e.id === r.id)!}
                            fields={[
                              { key: "name", label: "Nome", type: "text" },
                              { key: "value", label: "Valor (R$)", type: "number" },
                              { key: "category", label: "Categoria", type: "select", options: categories },
                              { key: "method", label: "Forma", type: "select", options: ["Pix", "Débito", ...investAssets.map((n) => `Investimento: ${n}`)] },
                              { key: "date", label: "Data", type: "date" },
                            ]}
                            onSave={(v) => f.updateDebitExpense(r.id, v)}
                            onDelete={() => f.deleteDebitExpense(r.id)}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">Nenhuma saída neste período.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function NewExpenseForm({ investAssets }: { investAssets: string[] }) {
  const { cards, categories, addCategory, addCardExpense, addDebitExpense } = useFinance();
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [category, setCategory] = useState("Casa");
  const [newCat, setNewCat] = useState("");
  const [creatingCat, setCreatingCat] = useState(false);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [forma, setForma] = useState("Pix");
  const [installments, setInstallments] = useState("1");
  const isCard = forma.startsWith("card:");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = Number(value);
    let cat = category;
    if (creatingCat) {
      cat = newCat.trim();
      if (!cat) return toast.error("Digite o nome da nova categoria");
      addCategory(cat);
      setCategory(cat);
      setCreatingCat(false);
      setNewCat("");
    }
    if (!name.trim() || !v) return toast.error("Preencha nome e valor");
    if (isCard) {
      addCardExpense({ name: name.trim(), value: v, category: cat, date, installments: Math.max(1, Number(installments) || 1), cardId: forma.slice(5) });
    } else {
      addDebitExpense({ name: name.trim(), value: v, category: cat, date, method: forma });
    }
    setName("");
    setValue("");
    setInstallments("1");
    toast.success("Saída adicionada");
  };

  return (
    <Card className="h-fit shadow-soft">
      <CardHeader><CardTitle className="text-base">Nova Saída</CardTitle></CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4" onSubmit={submit}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ex-name">Nome</Label>
            <Input id="ex-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ex-value">Valor (R$)</Label>
            <Input id="ex-value" type="number" step="0.01" value={value} onChange={(e) => setValue(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Categoria</Label>
            <Select
              value={creatingCat ? NEW_CAT : category}
              onValueChange={(v) => (v === NEW_CAT ? setCreatingCat(true) : (setCreatingCat(false), setCategory(v)))}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                <SelectItem value={NEW_CAT}>+ Criar categoria…</SelectItem>
              </SelectContent>
            </Select>
            {creatingCat && (
              <Input autoFocus placeholder="Nome da nova categoria" value={newCat} onChange={(e) => setNewCat(e.target.value)} />
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ex-date">Data</Label>
            <Input id="ex-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Forma</Label>
            <Select value={forma} onValueChange={setForma}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Pix">Pix</SelectItem>
                <SelectItem value="Débito">Débito</SelectItem>
                {cards.map((c) => <SelectItem key={c.id} value={`card:${c.id}`}>{c.name} (crédito)</SelectItem>)}
                {investAssets.map((n) => <SelectItem key={n} value={`Investimento: ${n}`}>Investimento: {n}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {isCard && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="ex-inst">Parcelas</Label>
              <Input id="ex-inst" type="number" min={1} max={48} value={installments} onChange={(e) => setInstallments(e.target.value)} />
            </div>
          )}
          <Button type="submit" className="w-full"><Plus className="h-4 w-4" /> Adicionar saída</Button>
        </form>
      </CardContent>
    </Card>
  );
}

function CardsPanel({
  cardInRange, lo, hi,
}: {
  cardInRange: (e: ReturnType<typeof useFinance>["cardExpenses"][number], lo: number, hi: number) => number;
  lo: number;
  hi: number;
}) {
  const { cards, cardExpenses, addCard, updateCard, deleteCard } = useFinance();
  const [editing, setEditing] = useState<CreditCardAccount | null>(null);
  const [cName, setCName] = useState("");
  const [cLimit, setCLimit] = useState("");

  const open = (c: CreditCardAccount | null) => {
    setEditing(c ?? { id: "", name: `Cartão ${cards.length + 1}`, limit: 5000 });
    setCName(c?.name ?? `Cartão ${cards.length + 1}`);
    setCLimit(String(c?.limit ?? 5000));
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !cName.trim()) return;
    const d = { name: cName.trim(), limit: Math.max(0, Number(cLimit) || 0) };
    if (editing.id) updateCard(editing.id, d);
    else addCard(d);
    setEditing(null);
    toast.success("Cartão salvo");
  };

  return (
    <Card className="shadow-soft">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base"><CreditCard className="h-4 w-4 text-primary" /> Cartões de crédito</CardTitle>
        <Button size="sm" variant="outline" onClick={() => open(null)}><Plus className="h-4 w-4" /> Novo cartão</Button>
      </CardHeader>
      <CardContent className="grid gap-5 md:grid-cols-2">
        {cards.map((c, i) => {
          const mine = cardExpenses.filter((e) => (e.cardId ?? cards[0]?.id) === c.id || (!cards.some((x) => x.id === e.cardId) && i === 0));
          const bill = mine.reduce((s, e) => s + cardInRange(e, lo, hi), 0);
          // Limite comprometido = parcelas ainda não pagas a partir do mês atual
          const nowIdx = (() => { const d = new Date(); return d.getFullYear() * 12 + d.getMonth(); })();
          const used = mine.reduce((s, e) => s + cardInRange(e, nowIdx, nowIdx + 600), 0);
          const pct = c.limit ? Math.min(100, (used / c.limit) * 100) : 0;
          return (
            <div key={c.id} className="rounded-xl border p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium">{c.name}</span>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Editar cartão" onClick={() => open(c)}><Pencil className="h-4 w-4" /></Button>
                  {cards.length > 1 && (
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" aria-label="Excluir cartão"
                      onClick={() => { deleteCard(c.id); toast("Cartão excluído"); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-muted-foreground">{brl(used)} de {brl(c.limit)}</span>
                <span className="font-semibold">{pct.toFixed(0)}%</span>
              </div>
              <Progress value={pct} className="h-2.5" />
              <p className="mt-2 text-xs text-muted-foreground">
                Disponível: {brl(Math.max(0, c.limit - used))} · Fatura no período: {brl(bill)}
              </p>
            </div>
          );
        })}
      </CardContent>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing?.id ? "Editar cartão" : "Novo cartão"}</DialogTitle></DialogHeader>
          <form className="flex flex-col gap-4" onSubmit={save}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="card-name">Nome</Label>
              <Input id="card-name" value={cName} onChange={(e) => setCName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="card-limit">Limite (R$)</Label>
              <Input id="card-limit" type="number" value={cLimit} onChange={(e) => setCLimit(e.target.value)} />
            </div>
            <DialogFooter><Button type="submit">Salvar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
