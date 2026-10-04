import { createFileRoute } from "@tanstack/react-router";
import { ArrowDownLeft, ArrowUpRight, Sparkles } from "lucide-react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { brl, useFinance, weeklyHistory, yearlyHistory } from "@/lib/finance-store";

export const Route = createFileRoute("/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatórios — Finanças Pessoais" },
      {
        name: "description",
        content: "Compare entradas e saídas por semana, mês ou ano e veja o rendimento do período.",
      },
      { property: "og:title", content: "Relatórios — Finanças Pessoais" },
      {
        property: "og:description",
        content: "Análise de entradas, saídas e rendimentos com filtros de período.",
      },
    ],
  }),
  component: Reports,
});

const datasets = {
  semana: weeklyHistory,
  mes: weeklyHistory,
  ano: yearlyHistory,
};

function Reports() {
  const [range, setRange] = useState<keyof typeof datasets>("mes");
  const { monthlyLive, totals } = useFinance();
  const spent = totals.cardBill + totals.debitTotal;
  const data =
    range === "mes"
      ? monthlyLive
      : range === "semana"
        ? weeklyHistory.map((w) => ({ ...w, income: totals.income / 4, expenses: spent / 4 }))
        : yearlyHistory.map((y, i, a) =>
            i === a.length - 1 ? { ...y, income: y.income - 12570 + totals.income, expenses: y.expenses - 8950 + spent } : y,
          );

  const income = data.reduce((s, d) => s + d.income, 0);
  const expenses = data.reduce((s, d) => s + d.expenses, 0);
  const yields = Math.round((income - expenses) * 0.11);

  const summary = [
    { label: "Total de entradas", value: brl(income), icon: ArrowDownLeft, tone: "text-emerald-600" },
    { label: "Total de saídas", value: brl(expenses), icon: ArrowUpRight, tone: "text-rose-500" },
    { label: "Rendimentos estimados", value: brl(yields), icon: Sparkles, tone: "text-primary" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Relatórios</h1>
          <p className="text-sm text-muted-foreground">Analise seu desempenho por período</p>
        </div>
        <Tabs value={range} onValueChange={(v) => setRange(v as keyof typeof datasets)}>
          <TabsList>
            <TabsTrigger value="semana">Semana</TabsTrigger>
            <TabsTrigger value="mes">Mês</TabsTrigger>
            <TabsTrigger value="ano">Ano</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {summary.map((s) => (
          <Card key={s.label} className="shadow-soft">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <s.icon className={`h-4 w-4 ${s.tone}`} />
              </div>
              <p className="mt-2 text-2xl font-semibold tracking-tight">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-base">Entradas x Saídas</CardTitle>
        </CardHeader>
        <CardContent className="h-[340px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barGap={8}>
              <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="4 4" />
              <XAxis dataKey="period" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis
                tickLine={false}
                axisLine={false}
                fontSize={12}
                width={60}
                tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
              />
              <Tooltip
                formatter={(v: number, n) => [brl(v), n === "income" ? "Entradas" : "Saídas"]}
                contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)" }}
              />
              <Legend
                formatter={(v) => (v === "income" ? "Entradas" : "Saídas")}
                iconType="circle"
              />
              <Bar
                dataKey="income"
                fill="var(--color-primary)"
                radius={[8, 8, 0, 0]}
                animationDuration={800}
              />
              <Bar
                dataKey="expenses"
                fill="var(--color-chart-4)"
                radius={[8, 8, 0, 0]}
                animationDuration={1000}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
