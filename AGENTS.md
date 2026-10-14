> ## ⛔ RETIRED — Recall is now the Go service [`HelloSandeep29/recall`](https://github.com/HelloSandeep29/recall)
>
> Since **2026-10-14** there is one Recall: **HelloSandeep29/recall** — Go + SQLite, the fleet's llm-gateway and
> speech-gateway. Code: `~/recall` on the Oracle coding box (`git clone git@github.com:HelloSandeep29/recall.git`).
> Production: container `recall` on node 163. Both installed apps ("Recall", "Recall Next") already run on it.
>
> - **Recall Gemini / Live line** (Recall-Tech-Department/recall-monorepo, sandeep2194/recall-live, node 134): retired.
> - **recall-next** (Python controller, HelloSandeep29/recall-next): retired, services paused. Only its `app/`
>   (the Expo app) is still built and changed.
> - **Older repos** (recall-app, recall-backend-services, recall-prototype, recall-mvp*, recall-health-companion*):
>   retired, reference only.
>
> **Agents: do not build, deploy, test or fix anything in this repo.** For any Recall work, `cd ~/recall` (clone it
> if missing) and read its README. App UI changes go to `recall-next/app`. Never deploy from here.

## ⚠️ Fleet infrastructure changed (2026-10-05) — update before running/deploying

This project predates the current self-hosted fleet layout. Its references to the fleet (hosts, deploy path, test runners, hosting services) are out of date and **must be updated across the whole code base before this project is revived, run or deployed**. Current facts:

- **134** = production (apps, shared databases, websites). **163** = ops: ci-webhook + git push mirrors (deploy = push to 163's mirror), backups to R2, tasks-broker, Revivo staging, Langfuse/GlitchTip. **101** = storage: node backups, lookup data, image builds — not a test runner, no CI, no ad-hoc services. **Oracle (fleet-ci)** = coding box. Source of truth: `~/selfhosted-infra-docs/CLAUDE.md` (HelloSandeep29/selfhosted-infra-docs).
- No Cloudflare Pages projects exist (all deleted 2026-10-02): websites are served by the `sites` nginx on 134 (ci-webhook `target: static`, a row in `apps/sites/sites.tsv`).

Stale references found on 2026-10-05 (3 lines in 1 files; file:line — what):

- `DEPLOY.md`:3, 6, 26 — Cloudflare Pages

---

