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

# AGENTS.md

- Project spec for QuestMaster lives in `docs/` (README, BUILD_PLAN, API_SPEC, DEMO_SCENARIOS); read it before building features. Why: it is the source of truth for the product.
- This project is frontend only; the backend is built elsewhere per `docs/QuestMaster_API_SPEC.md`. Why: team split — do not add Lovable Cloud or server logic here.
