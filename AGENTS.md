## ⚠️ Fleet infrastructure changed (2026-10-05) — update before running/deploying

This project predates the current self-hosted fleet layout. Its references to the fleet (hosts, deploy path, test runners, hosting services) are out of date and **must be updated across the whole code base before this project is revived, run or deployed**. Current facts:

- **134** = production (apps, shared databases, websites). **163** = ops: ci-webhook + git push mirrors (deploy = push to 163's mirror), backups to R2, tasks-broker, Revivo staging, Langfuse/GlitchTip. **101** = storage: node backups, lookup data, image builds — not a test runner, no CI, no ad-hoc services. **Oracle (fleet-ci)** = coding box. Source of truth: `~/selfhosted-infra-docs/CLAUDE.md` (HelloSandeep29/selfhosted-infra-docs).
- No Cloudflare Pages projects exist (all deleted 2026-10-02): websites are served by the `sites` nginx on 134 (ci-webhook `target: static`, a row in `apps/sites/sites.tsv`).

Stale references found on 2026-10-05 (3 lines in 1 files; file:line — what):

- `DEPLOY.md`:3, 6, 26 — Cloudflare Pages

---

