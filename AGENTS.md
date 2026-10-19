<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Finance data lives in Lovable Cloud tables (one row per user, RLS by user_id); `FinanceProvider` loads on session and writes optimistically. Why: per-user data across devices.
- App pages live under `src/routes/_authenticated/` (client-only gate, AppShell in its layout); `/auth` and `/reset-password` are public. Why: every page needs a signed-in user.
