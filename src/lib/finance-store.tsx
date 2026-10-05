import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export const CATEGORIES = [
  "Casa",
  "Lazer",
  "Compras",
  "Transporte",
  "Educação",
  "Delivery",
  "Outros",
  "Investimento",
] as const;

export type Category = (typeof CATEGORIES)[number];

export type Income = {
  id: string;
  name: string;
  value: number;
  date: string;
  recurring: boolean;
};

export type CardExpense = {
  id: string;
  name: string;
  value: number;
  category: Category;
  date: string;
  installments: number;
};

export type DebitExpense = {
  id: string;
  name: string;
  value: number;
  category: Category;
  date: string;
  method: "Débito" | "Pix";
  cdiPct?: number;
};

/** Taxa CDI anual de referência (editável no futuro) */
export const CDI_ANNUAL = 0.1415;

/** Rendimento estimado de um aporte: juros compostos diários desde a data até hoje */
export const estimateYield = (value: number, cdiPct: number, date: string) => {
  const annual = CDI_ANNUAL * (cdiPct / 100);
  const days = Math.max(0, (Date.now() - new Date(date).getTime()) / 86400000);
  const current = value * Math.pow(1 + annual, days / 365);
  return { annual, yearly: value * annual, earned: current - value, current };
};

export type Goal = {
  id: string;
  name: string;
  target: number;
  saved: number;
};

export type EvolutionPoint = {
  month: string;
  netWorth: number;
  balance: number;
};

const uid = () => Math.random().toString(36).slice(2, 10);

const initialIncomes: Income[] = [];

const initialCard: CardExpense[] = [];

const initialDebit: DebitExpense[] = [];

const initialGoals: Goal[] = [];

const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const lastMonthLabels = (n: number) =>
  Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - (n - 1 - i));
    return MONTH_LABELS[d.getMonth()];
  });

/** Históricos começam zerados — tudo passa a vir dos lançamentos reais do usuário */
export const evolution: EvolutionPoint[] = lastMonthLabels(6).map((month) => ({
  month,
  netWorth: 0,
  balance: 0,
}));

export const monthlyHistory = lastMonthLabels(6).map((period) => ({
  period,
  income: 0,
  expenses: 0,
}));

export const weeklyHistory = ["Sem 1", "Sem 2", "Sem 3", "Sem 4"].map((period) => ({
  period,
  income: 0,
  expenses: 0,
}));

export const yearlyHistory = ["2023", "2024", "2025", "2026"].map((period) => ({
  period,
  income: 0,
  expenses: 0,
}));

export const upcomingBills: { id: string; name: string; value: number; due: string }[] = [];

export const CREDIT_LIMIT = 12000;
export const MONTHLY_BUDGET = 5000;
export const STARTING_BALANCE = 0;


type Store = {
  incomes: Income[];
  cardExpenses: CardExpense[];
  debitExpenses: DebitExpense[];
  goals: Goal[];
  addIncome: (i: Omit<Income, "id">) => void;
  addCardExpense: (e: Omit<CardExpense, "id">) => void;
  addDebitExpense: (e: Omit<DebitExpense, "id">) => void;
  addGoal: (g: Omit<Goal, "id">) => void;
  updateIncome: (id: string, d: Partial<Income>) => void;
  deleteIncome: (id: string) => void;
  updateCardExpense: (id: string, d: Partial<CardExpense>) => void;
  deleteCardExpense: (id: string) => void;
  updateDebitExpense: (id: string, d: Partial<DebitExpense>) => void;
  deleteDebitExpense: (id: string) => void;
  updateGoal: (id: string, d: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  evolutionLive: EvolutionPoint[];
  monthlyLive: typeof monthlyHistory;
  totals: {
    income: number;
    cardBill: number;
    cardTotal: number;
    debitTotal: number;
    budgetUsed: number;
    invested: number;
    balance: number;
    netWorth: number;
  };
};

// Keep a single context instance across hot reloads so provider and consumers always match
const g = globalThis as unknown as { __financeCtx?: React.Context<Store | null> };
const FinanceContext = g.__financeCtx ?? (g.__financeCtx = createContext<Store | null>(null));

const STORAGE_KEY = "financas-pessoais-v1";

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [incomes, setIncomes] = useState<Income[]>(initialIncomes);
  const [cardExpenses, setCardExpenses] = useState<CardExpense[]>(initialCard);
  const [debitExpenses, setDebitExpenses] = useState<DebitExpense[]>(initialDebit);
  const [goals, setGoals] = useState<Goal[]>(initialGoals);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (Array.isArray(d.incomes)) setIncomes(d.incomes);
        if (Array.isArray(d.cardExpenses)) setCardExpenses(d.cardExpenses);
        if (Array.isArray(d.debitExpenses)) setDebitExpenses(d.debitExpenses);
        if (Array.isArray(d.goals)) setGoals(d.goals);
      }
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ incomes, cardExpenses, debitExpenses, goals }),
    );
  }, [loaded, incomes, cardExpenses, debitExpenses, goals]);

  const value = useMemo<Store>(() => {
    const upd = <T extends { id: string }>(set: React.Dispatch<React.SetStateAction<T[]>>) =>
      (id: string, d: Partial<T>) => set((p) => p.map((x) => (x.id === id ? { ...x, ...d } : x)));
    const del = <T extends { id: string }>(set: React.Dispatch<React.SetStateAction<T[]>>) =>
      (id: string) => set((p) => p.filter((x) => x.id !== id));
    const income = incomes.reduce((s, i) => s + i.value, 0);
    const cardBill = cardExpenses.reduce((s, e) => s + e.value / e.installments, 0);
    const cardTotal = cardExpenses.reduce((s, e) => s + e.value, 0);
    const debitTotal = debitExpenses.reduce((s, e) => s + e.value, 0);
    const invested = [...debitExpenses, ...cardExpenses]
      .filter((e) => e.category === "Investimento")
      .reduce((s, e) => s + e.value, 0);
    const debitInvested = debitExpenses
      .filter((e) => e.category === "Investimento")
      .reduce((s, e) => s + e.value, 0);
    const budgetUsed = debitTotal - debitInvested + cardBill;
    const balance = STARTING_BALANCE + income - cardBill - debitTotal;
    // Patrimônio líquido = soma de todos os aportes / ativos na carteira
    const netWorth = invested;

    return {
      incomes,
      cardExpenses,
      debitExpenses,
      goals,
      addIncome: (i) => setIncomes((p) => [{ ...i, id: uid() }, ...p]),
      addCardExpense: (e) => setCardExpenses((p) => [{ ...e, id: uid() }, ...p]),
      addDebitExpense: (e) => setDebitExpenses((p) => [{ ...e, id: uid() }, ...p]),
      addGoal: (g) => setGoals((p) => [...p, { ...g, id: uid() }]),
      updateIncome: upd(setIncomes),
      deleteIncome: del(setIncomes),
      updateCardExpense: upd(setCardExpenses),
      deleteCardExpense: del(setCardExpenses),
      updateDebitExpense: upd(setDebitExpenses),
      deleteDebitExpense: del(setDebitExpenses),
      updateGoal: upd(setGoals),
      deleteGoal: del(setGoals),
      evolutionLive: evolution.map((p, i, a) =>
        i === a.length - 1 ? { ...p, netWorth: (a[i - 1]?.netWorth ?? 0) + invested + Math.max(0, income - cardBill - debitTotal), balance: income - cardBill - debitTotal } : p,
      ),
      monthlyLive: monthlyHistory.map((p, i, a) =>
        i === a.length - 1 ? { ...p, income, expenses: cardBill + debitTotal } : p,
      ),
      totals: { income, cardBill, cardTotal, debitTotal, budgetUsed, invested, balance, netWorth },
    };
  }, [incomes, cardExpenses, debitExpenses, goals]);

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance must be used inside FinanceProvider");
  return ctx;
}

export const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export const brlExact = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });

export const formatDate = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};
