import { Link } from "@tanstack/react-router";
import {
  LayoutDashboard,
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  PiggyBank,
  Wallet,
} from "lucide-react";
import type { ReactNode } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { brl, useFinance } from "@/lib/finance-store";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/entradas", label: "Entradas", icon: ArrowDownLeft },
  { to: "/saidas", label: "Saídas", icon: ArrowUpRight },
  { to: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { to: "/investimentos", label: "Investimentos", icon: PiggyBank },
] as const;

function EvolutionStrip() {
  const { totals, evolutionLive } = useFinance();
  const data = evolutionLive;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Evolução financeira
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">{brl(totals.netWorth)}</h2>
          <p className="text-sm text-muted-foreground">
            Patrimônio líquido e saldo mensal nos últimos 6 meses
          </p>
        </div>
        <div className="flex gap-5 text-sm">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary" /> Patrimônio
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-chart-2" /> Saldo do mês
          </span>
        </div>
      </div>

      <div className="mt-4 h-[180px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="netFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.22} />
                <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="4 4" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              fontSize={12}
              stroke="var(--color-muted-foreground)"
            />
            <YAxis
              yAxisId="left"
              tickLine={false}
              axisLine={false}
              fontSize={12}
              width={64}
              stroke="var(--color-muted-foreground)"
              tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
            />
            <YAxis yAxisId="right" orientation="right" hide />
            <Tooltip
              formatter={(v: number, name) => [brl(v), name === "netWorth" ? "Patrimônio" : "Saldo"]}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid var(--color-border)",
                boxShadow: "0 10px 30px -12px rgb(15 23 42 / 0.25)",
              }}
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="netWorth"
              stroke="transparent"
              fill="url(#netFill)"
              animationDuration={900}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="netWorth"
              stroke="var(--color-primary)"
              strokeWidth={2.5}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              animationDuration={900}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="balance"
              stroke="var(--color-chart-2)"
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={false}
              animationDuration={1100}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-[1400px] gap-6 px-4 py-6 lg:px-8">
        <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-60 shrink-0 flex-col rounded-2xl border border-border bg-card p-4 shadow-soft lg:flex">
          <div className="flex items-center gap-2 px-2 py-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Wallet className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold leading-tight">Finanças</p>
              <p className="text-xs text-muted-foreground">Controle pessoal</p>
            </div>
          </div>
          <nav className="mt-4 flex flex-col gap-1">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground data-[status=active]:bg-primary/10 data-[status=active]:text-primary"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col gap-6">
          <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-border bg-card p-2 shadow-soft lg:hidden">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                className="flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground data-[status=active]:bg-primary/10 data-[status=active]:text-primary"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          <EvolutionStrip />
          {children}
        </main>
      </div>
    </div>
  );
}
