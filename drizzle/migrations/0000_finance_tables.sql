CREATE TABLE public.incomes (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid(), name text NOT NULL, value numeric NOT NULL DEFAULT 0, date date NOT NULL DEFAULT current_date, recurring boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.credit_cards (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid(), name text NOT NULL, "limit" numeric NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.card_expenses (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid(), name text NOT NULL, value numeric NOT NULL DEFAULT 0, category text NOT NULL, date date NOT NULL DEFAULT current_date, installments int NOT NULL DEFAULT 1, card_id uuid, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.debit_expenses (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid(), name text NOT NULL, value numeric NOT NULL DEFAULT 0, category text NOT NULL, date date NOT NULL DEFAULT current_date, method text NOT NULL DEFAULT 'Pix', cdi_pct numeric, no_expense boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.goals (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid(), name text NOT NULL, target numeric NOT NULL DEFAULT 0, saved numeric NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.custom_categories (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid(), name text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE (user_id, name));
DO $$ DECLARE t text; BEGIN
FOREACH t IN ARRAY ARRAY['incomes','credit_cards','card_expenses','debit_expenses','goals','custom_categories'] LOOP
  EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
  EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  EXECUTE format('CREATE POLICY "own_select" ON public.%I FOR SELECT TO authenticated USING (auth.uid() = user_id)', t);
  EXECUTE format('CREATE POLICY "own_insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id)', t);
  EXECUTE format('CREATE POLICY "own_update" ON public.%I FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)', t);
  EXECUTE format('CREATE POLICY "own_delete" ON public.%I FOR DELETE TO authenticated USING (auth.uid() = user_id)', t);
  EXECUTE format('CREATE INDEX ON public.%I (user_id)', t);
END LOOP; END $$;