import { createFileRoute } from "@tanstack/react-router";
import {
  CalendarClock,
  CreditCard,
  PiggyBank,
  Target,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  MONTHLY_BUDGET,
  brl,
  formatDate,
  upcomingBills,
  useFinance,
} from "@/lib/finance-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Finanças Pessoais" },
      {
        name: "description",
        content:
          "Visão geral do seu dinheiro: saldo atual, fatura do cartão, total investido e próximos vencimentos.",
      },
      { property: "og:title", content: "Dashboard — Finanças Pessoais" },
      {
        property: "og:description",
        content: "Acompanhe saldo, fatura, investimentos e orçamento mensal em um só lugar.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { totals, goals } = useFinance();
  const budgetPct = Math.min(100, (totals.budgetUsed / MONTHLY_BUDGET) * 100);
  const cardPct = Math.min(100, (totals.cardBill / (totals.creditLimit || 1)) * 100);

  const cards = [
    {
      label: "Saldo atual",
      value: brl(totals.balance),
      hint: "Contas + carteira",
      icon: Wallet,
    },
    {
      label: "Fatura do mês",
      value: brl(totals.cardBill),
      hint: `${cardPct.toFixed(0)}% do limite de ${brl(totals.creditLimit)}`,
      icon: CreditCard,
    },
    {
      label: "Total investido",
      value: brl(totals.invested),
      hint: "Aportes deste mês",
      icon: PiggyBank,
    },
    {
      label: "Orçamento mensal",
      value: `${budgetPct.toFixed(0)}%`,
      hint: `${brl(totals.budgetUsed)} de ${brl(MONTHLY_BUDGET)}`,
      icon: Target,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} className="shadow-soft">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <p className="text-sm text-muted-foreground">{c.label}</p>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <c.icon className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-3 text-2xl font-semibold tracking-tight">{c.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{c.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="shadow-soft lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClock className="h-4 w-4 text-primary" /> Próximos vencimentos
            </CardTitle>
            <Badge variant="secondary">{upcomingBills.length} contas</Badge>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {upcomingBills.map((bill) => (
              <div
                key={bill.id}
                className="flex items-center justify-between rounded-xl border border-border px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium">{bill.name}</p>
                  <p className="text-xs text-muted-foreground">Vence em {formatDate(bill.due)}</p>
                </div>
                <p className="text-sm font-semibold">{brl(bill.value)}</p>
              </div>
            ))}
            {upcomingBills.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nenhuma conta a vencer. Cadastre suas contas fixas para acompanhá-las aqui.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-base">Uso do orçamento</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-muted-foreground">Gastos do mês</span>
                  <span className="font-medium">{brl(totals.budgetUsed)}</span>
                </div>
                <Progress value={budgetPct} />
              </div>
              <div>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-muted-foreground">Limite do cartão</span>
                  <span className="font-medium">{brl(totals.cardBill)}</span>
                </div>
                <Progress value={cardPct} />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4 text-primary" /> Metas em andamento
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {goals.slice(0, 3).map((g) => (
                <div key={g.id}>
                  <div className="mb-2 flex justify-between text-sm">
                    <span>{g.name}</span>
                    <span className="text-muted-foreground">
                      {((g.saved / g.target) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={(g.saved / g.target) * 100} />
                </div>
              ))}
              {goals.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Nenhuma meta criada ainda. Crie a primeira na página de Investimentos.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
