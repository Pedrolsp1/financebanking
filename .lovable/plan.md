# Usuários e dados na nuvem

## O que muda para você
- Nova tela **Entrar / Criar conta** com e-mail e senha, e botão **Entrar com Google**.
- Link "Esqueci minha senha" e página para definir nova senha.
- Todas as páginas do app (Dashboard, Entradas, Saídas, Relatórios, Investimentos) só abrem com login.
- Cada pessoa vê apenas os próprios lançamentos, cartões, categorias, aportes e metas — em qualquer aparelho.
- Menu lateral mostra o e-mail de quem está logado e um botão **Sair**.
- Os dados de teste salvos hoje no navegador são descartados; cada conta começa do zero.

## Etapas
1. Ativar o Lovable Cloud (banco de dados + login).
2. Ligar login por e-mail/senha e Google.
3. Criar tabelas por usuário: entradas, saídas no cartão, saídas débito/Pix/investimento, cartões, categorias personalizadas, metas.
4. Trocar o armazenamento do navegador pelo banco: o app carrega os dados da conta ao entrar e salva cada criar/editar/excluir na hora.
5. Telas de entrar, cadastro, recuperar senha; proteger as páginas; botão Sair.
6. Testar: criar conta, lançar uma saída, recarregar e confirmar que continua lá.

## Detalhes técnicos
- Tabelas: `incomes`, `card_expenses`, `debit_expenses` (method, cdi_pct, no_expense), `credit_cards`, `custom_categories`, `goals`; todas com `user_id uuid references auth.users on delete cascade`, GRANTs para authenticated/service_role, RLS `auth.uid() = user_id` para select/insert/update/delete. Sem tabela de perfis.
- Rotas do app movidas para `src/routes/_authenticated/` (layout gerenciado, ssr:false); `/auth` e `/reset-password` públicas; dashboard passa a `/dashboard` e `/` vira entrada que redireciona.
- `FinanceProvider` mantém a mesma API (`useFinance`), mas lê/escreve via cliente do banco com atualizações otimistas; remove localStorage.
- Cartão padrão "Cartão 1" criado no primeiro acesso se a conta não tiver cartões.
- Google via `lovable.auth.signInWithOAuth`; `onAuthStateChange` único no root.
