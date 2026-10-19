import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";

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

export type Category = string;

export type CreditCardAccount = { id: string; name: string; limit: number };

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
  cardId?: string;
};

export type DebitExpense = {
  id: string;
  name: string;
  value: number;
  category: Category;
  date: string;
  /** "Pix", "Débito" ou "Investimento: <ativo>" */
  method: string;
  cdiPct?: number;
  /** Quando true, não conta como gasto (ex.: aporte com dinheiro já guardado) */
  noExpense?: boolean;
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

const uid = () => crypto.randomUUID();

const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const lastMonthLabels = (n: number) =>
  Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - (n - 1 - i));
    return MONTH_LABELS[d.getMonth()] ?? "";
  });

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
  loading: boolean;
  incomes: Income[];
  cardExpenses: CardExpense[];
  debitExpenses: DebitExpense[];
  goals: Goal[];
  cards: CreditCardAccount[];
  categories: string[];
  addCard: (c: Omit<CreditCardAccount, "id">) => void;
  updateCard: (id: string, d: Partial<CreditCardAccount>) => void;
  deleteCard: (id: string) => void;
  addCategory: (c: string) => void;
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
    creditLimit: number;
  };
};

const g = globalThis as unknown as { __financeCtx?: React.Context<Store | null> };
const FinanceContext = g.__financeCtx ?? (g.__financeCtx = createContext<Store | null>(null));

/* ---------- mapeamento app <-> banco ---------- */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;
const num = (v: unknown) => Number(v ?? 0);

const toIncome = (r: Row): Income => ({
  id: r.id as string, name: r.name as string, value: num(r.value), date: r.date as string, recurring: !!r.recurring,
});
const fromIncome = (d: Partial<Income>): Row => {
  const o: Row = {};
  if (d.name !== undefined) o.name = d.name;
  if (d.value !== undefined) o.value = d.value;
  if (d.date !== undefined) o.date = d.date;
  if (d.recurring !== undefined) o.recurring = d.recurring;
  return o;
};
const toCard = (r: Row): CardExpense => ({
  id: r.id as string, name: r.name as string, value: num(r.value), category: r.category as string,
  date: r.date as string, installments: num(r.installments) || 1, cardId: (r.card_id as string) ?? undefined,
});
const fromCard = (d: Partial<CardExpense>): Row => {
  const o: Row = {};
  if (d.name !== undefined) o.name = d.name;
  if (d.value !== undefined) o.value = d.value;
  if (d.category !== undefined) o.category = d.category;
  if (d.date !== undefined) o.date = d.date;
  if (d.installments !== undefined) o.installments = d.installments;
  if ("cardId" in d) o.card_id = d.cardId ?? null;
  return o;
};
const toDebit = (r: Row): DebitExpense => ({
  id: r.id as string, name: r.name as string, value: num(r.value), category: r.category as string,
  date: r.date as string, method: r.method as string,
  cdiPct: r.cdi_pct == null ? undefined : num(r.cdi_pct), noExpense: !!r.no_expense,
});
const fromDebit = (d: Partial<DebitExpense>): Row => {
  const o: Row = {};
  if (d.name !== undefined) o.name = d.name;
  if (d.value !== undefined) o.value = d.value;
  if (d.category !== undefined) o.category = d.category;
  if (d.date !== undefined) o.date = d.date;
  if (d.method !== undefined) o.method = d.method;
  if ("cdiPct" in d) o.cdi_pct = d.cdiPct ?? null;
  if (d.noExpense !== undefined) o.no_expense = d.noExpense;
  return o;
};
const toGoal = (r: Row): Goal => ({ id: r.id as string, name: r.name as string, target: num(r.target), saved: num(r.saved) });
const fromGoal = (d: Partial<Goal>): Row => {
  const o: Row = {};
  if (d.name !== undefined) o.name = d.name;
  if (d.target !== undefined) o.target = d.target;
  if (d.saved !== undefined) o.saved = d.saved;
  return o;
};
const toCC = (r: Row): CreditCardAccount => ({ id: r.id as string, name: r.name as string, limit: num(r.limit) });
const fromCC = (d: Partial<CreditCardAccount>): Row => {
  const o: Row = {};
  if (d.name !== undefined) o.name = d.name;
  if (d.limit !== undefined) o.limit = d.limit;
  return o;
};

type Table = "incomes" | "card_expenses" | "debit_expenses" | "goals" | "credit_cards" | "custom_categories";

const report = (error: { message: string } | null) => {
  if (error) toast.error("Não foi possível salvar: " + error.message);
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = (t: Table) => supabase.from(t as any) as any;
const dbInsert = (t: Table, row: Row) => db(t).insert(row).then(({ error }: { error: { message: string } | null }) => report(error));
const dbUpdate = (t: Table, id: string, row: Row) => {
  if (!Object.keys(row).length) return;
  db(t).update(row).eq("id", id).then(({ error }: { error: { message: string } | null }) => report(error));
};
const dbDelete = (t: Table, id: string) =>
  db(t).delete().eq("id", id).then(({ error }: { error: { message: string } | null }) => report(error));

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [cardExpenses, setCardExpenses] = useState<CardExpense[]>([]);
  const [debitExpenses, setDebitExpenses] = useState<DebitExpense[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [cards, setCards] = useState<CreditCardAccount[]>([]);
  const [customCats, setCustomCats] = useState<string[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user.id ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) {
      setIncomes([]); setCardExpenses([]); setDebitExpenses([]); setGoals([]); setCards([]); setCustomCats([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const [i, c, d, gl, cc, cat] = await Promise.all([
        db("incomes").select("*").order("date", { ascending: false }),
        db("card_expenses").select("*").order("date", { ascending: false }),
        db("debit_expenses").select("*").order("date", { ascending: false }),
        db("goals").select("*").order("created_at"),
        db("credit_cards").select("*").order("created_at"),
        db("custom_categories").select("*").order("created_at"),
      ]);
      if (cancelled) return;
      setIncomes((i.data ?? []).map(toIncome));
      setCardExpenses((c.data ?? []).map(toCard));
      setDebitExpenses((d.data ?? []).map(toDebit));
      setGoals((gl.data ?? []).map(toGoal));
      let cardList = (cc.data ?? []).map(toCC);
      if (!cc.error && cardList.length === 0) {
        const first = { id: uid(), name: "Cartão 1", limit: CREDIT_LIMIT };
        cardList = [first];
        dbInsert("credit_cards", { id: first.id, name: first.name, limit: first.limit });
      }
      setCards(cardList);
      setCustomCats((cat.data ?? []).map((r: Row) => r.name as string));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [userId]);

  const value = useMemo<Store>(() => {
    const upd = <T extends { id: string }>(
      set: React.Dispatch<React.SetStateAction<T[]>>, table: Table, map: (d: Partial<T>) => Row,
    ) => (id: string, d: Partial<T>) => {
      set((p) => p.map((x) => (x.id === id ? { ...x, ...d } : x)));
      dbUpdate(table, id, map(d));
    };
    const del = <T extends { id: string }>(set: React.Dispatch<React.SetStateAction<T[]>>, table: Table) =>
      (id: string) => {
        set((p) => p.filter((x) => x.id !== id));
        dbDelete(table, id);
      };

    const income = incomes.reduce((s, i) => s + i.value, 0);
    const cardBill = cardExpenses.reduce((s, e) => s + e.value / e.installments, 0);
    const cardTotal = cardExpenses.reduce((s, e) => s + e.value, 0);
    const debitTotal = debitExpenses.filter((e) => !e.noExpense).reduce((s, e) => s + e.value, 0);
    const invested = [...debitExpenses, ...cardExpenses]
      .filter((e) => e.category === "Investimento")
      .reduce((s, e) => s + e.value, 0);
    const debitInvested = debitExpenses
      .filter((e) => e.category === "Investimento" && !e.noExpense)
      .reduce((s, e) => s + e.value, 0);
    const budgetUsed = debitTotal - debitInvested + cardBill;
    const balance = STARTING_BALANCE + income - cardBill - debitTotal;
    const netWorth = invested;

    return {
      loading,
      incomes,
      cardExpenses,
      debitExpenses,
      goals,
      cards,
      categories: [...CATEGORIES, ...customCats.filter((c) => !(CATEGORIES as readonly string[]).includes(c))],
      addCard: (c) => {
        const id = uid();
        setCards((p) => [...p, { ...c, id }]);
        dbInsert("credit_cards", { id, ...fromCC(c) });
      },
      updateCard: upd(setCards, "credit_cards", fromCC),
      deleteCard: del(setCards, "credit_cards"),
      addCategory: (c) => {
        if (customCats.includes(c)) return;
        setCustomCats((p) => [...p, c]);
        dbInsert("custom_categories", { name: c });
      },
      addIncome: (i) => {
        const id = uid();
        setIncomes((p) => [{ ...i, id }, ...p]);
        dbInsert("incomes", { id, ...fromIncome(i) });
      },
      addCardExpense: (e) => {
        const id = uid();
        setCardExpenses((p) => [{ ...e, id }, ...p]);
        dbInsert("card_expenses", { id, ...fromCard(e) });
      },
      addDebitExpense: (e) => {
        const id = uid();
        setDebitExpenses((p) => [{ ...e, id }, ...p]);
        dbInsert("debit_expenses", { id, ...fromDebit(e) });
      },
      addGoal: (gl) => {
        const id = uid();
        setGoals((p) => [...p, { ...gl, id }]);
        dbInsert("goals", { id, ...fromGoal(gl) });
      },
      updateIncome: upd(setIncomes, "incomes", fromIncome),
      deleteIncome: del(setIncomes, "incomes"),
      updateCardExpense: upd(setCardExpenses, "card_expenses", fromCard),
      deleteCardExpense: del(setCardExpenses, "card_expenses"),
      updateDebitExpense: upd(setDebitExpenses, "debit_expenses", fromDebit),
      deleteDebitExpense: del(setDebitExpenses, "debit_expenses"),
      updateGoal: upd(setGoals, "goals", fromGoal),
      deleteGoal: del(setGoals, "goals"),
      evolutionLive: evolution.map((p, i, a) =>
        i === a.length - 1 ? { ...p, netWorth, balance: income - cardBill - debitTotal } : p,
      ),
      monthlyLive: monthlyHistory.map((p, i, a) =>
        i === a.length - 1 ? { ...p, income, expenses: cardBill + debitTotal } : p,
      ),
      totals: { income, cardBill, cardTotal, debitTotal, budgetUsed, invested, balance, netWorth, creditLimit: cards.reduce((s, c) => s + c.limit, 0) },
    };
  }, [loading, incomes, cardExpenses, debitExpenses, goals, cards, customCats]);

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
