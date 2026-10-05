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

const initialIncomes: Income[] = [
  { id: uid(), name: "Salário", value: 8400, date: "2026-09-05", recurring: true },
  { id: uid(), name: "Freelance — landing page", value: 2200, date: "2026-09-12", recurring: false },
  { id: uid(), name: "Aluguel recebido", value: 1650, date: "2026-09-10", recurring: true },
  { id: uid(), name: "Dividendos", value: 320, date: "2026-09-15", recurring: true },
  { id: uid(), name: "Venda de equipamento", value: 780, date: "2026-08-22", recurring: false },
];

const initialCard: CardExpense[] = [
  { id: uid(), name: "Notebook novo", value: 6600, category: "Compras", date: "2026-09-02", installments: 12 },
  { id: uid(), name: "Mercado do mês", value: 940, category: "Casa", date: "2026-09-06", installments: 1 },
  { id: uid(), name: "Passagem aérea", value: 1800, category: "Lazer", date: "2026-09-08", installments: 6 },
  { id: uid(), name: "Curso de inglês", value: 1200, category: "Educação", date: "2026-09-09", installments: 4 },
  { id: uid(), name: "Jantar delivery", value: 168, category: "Delivery", date: "2026-09-14", installments: 1 },
  { id: uid(), name: "Combustível", value: 430, category: "Transporte", date: "2026-09-16", installments: 1 },
];

const initialDebit: DebitExpense[] = [
  { id: uid(), name: "Feira da semana", value: 210, category: "Casa", date: "2026-09-03", method: "Pix" },
  { id: uid(), name: "Uber", value: 86, category: "Transporte", date: "2026-09-04", method: "Débito" },
  { id: uid(), name: "Cinema", value: 74, category: "Lazer", date: "2026-09-07", method: "Pix" },
  { id: uid(), name: "Aporte Tesouro Selic", value: 1500, category: "Investimento", date: "2026-09-08", method: "Pix" },
  { id: uid(), name: "Aporte ETF IVVB11", value: 900, category: "Investimento", date: "2026-09-11", method: "Pix" },
  { id: uid(), name: "Aporte Fundo Imobiliário", value: 600, category: "Investimento", date: "2026-09-13", method: "Pix" },
  { id: uid(), name: "Farmácia", value: 132, category: "Outros", date: "2026-09-15", method: "Débito" },
  { id: uid(), name: "Delivery sushi", value: 119, category: "Delivery", date: "2026-09-17", method: "Pix" },
];

const initialGoals: Goal[] = [
  { id: uid(), name: "Reserva de emergência", target: 30000, saved: 21400 },
  { id: uid(), name: "Viagem Europa 2027", target: 18000, saved: 6200 },
  { id: uid(), name: "Entrada do apartamento", target: 90000, saved: 24800 },
];

export const evolution: EvolutionPoint[] = [
  { month: "Abr", netWorth: 82400, balance: 1850 },
  { month: "Mai", netWorth: 86100, balance: 2340 },
  { month: "Jun", netWorth: 89950, balance: 1120 },
  { month: "Jul", netWorth: 94300, balance: 3010 },
  { month: "Ago", netWorth: 99180, balance: 2480 },
  { month: "Set", netWorth: 104720, balance: 3620 },
];

export const monthlyHistory = [
  { period: "Abr", income: 10200, expenses: 8350 },
  { period: "Mai", income: 11150, expenses: 8810 },
  { period: "Jun", income: 10400, expenses: 9280 },
  { period: "Jul", income: 12300, expenses: 9290 },
  { period: "Ago", income: 11480, expenses: 9000 },
  { period: "Set", income: 12570, expenses: 8950 },
];

export const weeklyHistory = [
  { period: "Sem 1", income: 4100, expenses: 2380 },
  { period: "Sem 2", income: 3850, expenses: 2110 },
  { period: "Sem 3", income: 2620, expenses: 2540 },
  { period: "Sem 4", income: 2000, expenses: 1920 },
];

export const yearlyHistory = [
  { period: "2023", income: 98400, expenses: 84200 },
  { period: "2024", income: 118600, expenses: 96100 },
  { period: "2025", income: 132400, expenses: 104800 },
  { period: "2026", income: 108900, expenses: 82300 },
];

export const upcomingBills = [
  { id: uid(), name: "Fatura do cartão", value: 3460, due: "2026-09-25" },
  { id: uid(), name: "Aluguel", value: 2200, due: "2026-09-28" },
  { id: uid(), name: "Internet fibra", value: 129, due: "2026-09-30" },
  { id: uid(), name: "Academia", value: 149, due: "2026-10-02" },
  { id: uid(), name: "Plano de saúde", value: 612, due: "2026-10-05" },
];

export const CREDIT_LIMIT = 12000;
export const MONTHLY_BUDGET = 5000;
export const STARTING_BALANCE = 9800;

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

const FinanceContext = createContext<Store | null>(null);

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
