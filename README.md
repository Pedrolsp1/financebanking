# Finance Compass

Role: Act as an expert frontend developer, UI/UX designer, and financial systems architect. Build a comprehensive, interactive Personal Finance Management Web Application.

Design System & UI: Create a clean, modern, white-based layout with a minimalist aesthetic. Avoid heavy grayscale or dark industrial looks; use plenty of whitespace, clear typography, and subtle shadows. Use shadcn/ui components (cards, tables, badges, tabs, progress bars) and lucide-react for icons. Use recharts for all charts.

Global Persistent Element:

Financial Evolution Line Chart: Implement a global Line Chart (using Recharts) showing Net Worth and Monthly Balance progression over the months. This chart MUST be consistently visible across ALL tabs. Place it in a persistent layout wrapper (e.g., a top dashboard header strip or a persistent side panel) so the user can always track their macro financial behavior regardless of the current page.

Core Architecture & Navigation: Implement a modern sidebar or top navigation to switch between the 5 main sections:

1. Dashboard (Geral):

Display top summary cards: Current Balance, Current Month Credit Card Bill, Total Invested, and Monthly Budget Status.

A "Upcoming Bills" (Próximos Vencimentos) quick list.

2. Incomes (Entradas):

A table to log money received (Name, Value, Date). Include an option to mark an income as "Recurring".

3. Expenses (Saídas - Divided into 2 Tabs):

Tab A: Credit Card: Inputs for Purchases (Name, Value, Category, Date, and "Installments"). Visually simulate spreading installment costs across future months. Include a Gauge or Progress Bar showing "Credit Limit Used vs. Total Limit".

Tab B: Debit/Pix: Table for everyday non-credit expenses. Include a Progress Bar showing "Monthly Budget Used vs. Target Budget".

Categories: Casa, Lazer, Compras, Transporte, Educação, Delivery, Outros, Investimento.

4. Reports (Relatórios):

Analytics page with date filters (Week, Month, Year).

Bar Chart: Income vs. Expenses over the selected period.

Summaries for Total Income, Total Expenses, and Yields.

5. Investments (Investimentos):

Automatically sync any expense logged with the "Investimento" category into this section.

Asset Allocation Pie Chart: A specific Pie Chart calculating and displaying the exact percentage of the portfolio invested in each individual asset or category, showing exactly how the total net worth is divided.

Goals: A section to set financial goals with a Progress Bar showing completion percentage.

Technical constraints: Provide a fully working prototype using mock data for the charts and tables to demonstrate interactions, tab switching, and chart animations immediately.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://financebanking.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/fe55ff5e-0554-4fba-a813-0b27c5d52528).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
