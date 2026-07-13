---
description: "Walk the SolarStar Phase 0 acceptance criteria: verify workflow sync, credentials, Outlook connection, and the human-approval path with real runData; then update progress.md"
name: "phase0-checklist"
agent: "agent"
---
Work through the Phase 0 ("Stabilise the foundation") acceptance criteria from [solarstar-execution-plan.md](../../solarstar-execution-plan.md) §5, tracked in [progress.md](../../progress.md). Execute each check, do not just describe it.

For each item, report ✅/❌ with evidence, and fix what is fixable:

1. **Source sync** — `git status` is clean and `npx --yes n8nac verify TyzTNzhz9QuLKNiH` passes (pull/push to reconcile if needed; never force-resolve conflicts without asking).
2. **Credentials present** — `npx --yes n8nac workflow credential-required TyzTNzhz9QuLKNiH --json` reports none missing. HERO Bearer credential works end-to-end (a real HERO GraphQL call returns data, checked via execution `runData`, not HTTP 200 alone).
3. **Outlook connected** — the `microsoftOutlookOAuth2Api` credential has a working token. If not, remind the user that "Connect my account" must be completed by a human in the n8n UI (see AGENTS.md — single-tenant Azure AD gotcha) and stop this item.
4. **Human-approval path proven** — run the test-trigger path with a test payload (`npx --yes n8nac test-plan TyzTNzhz9QuLKNiH --json`, then `test`), approve via the wait-node webhook, and confirm the send/reject branch via `npx --yes n8nac execution get <id> --include-data --json`. Remember: the wait node replaces item json on resume — verify `is_valid` re-attachment in the actual runData.
5. **Rollback note** — confirm a rollback note exists (how to set `active: false`); add one to progress.md if missing.
6. **Safety** — workflow stays `active: false` until every item above passes.

Finish by updating the Phase 0 checklist and changelog in [progress.md](../../progress.md) to reflect the verified state, and present the workflow with `npx --yes n8nac workflow present TyzTNzhz9QuLKNiH --json`.
