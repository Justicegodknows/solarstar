# progress.md

Living log of the SolarStar workflow project. **Every agent must read this file before implementing any code**, and update it after any change that lands (new node, credential, gotcha discovered, flow added). Keep it current — it is the shared memory across sessions.

Last updated: 2026-07-13

## Current status

Phase 1 workflow (`TyzTNzhz9QuLKNiH`, [workflows/solarflar/solarstar-phase1-reminder.workflow.ts](workflows/solarflar/solarstar-phase1-reminder.workflow.ts)) is built out to 19 nodes across four trigger-rooted flows. `active: false` — not yet running on schedule. There are uncommitted edits in the working tree to the workflow file.

## Completed

- Docker Compose runtime: n8n (`:5678`) + Postgres, wired to `.env` secrets.
- n8n-as-code workspace configured (`solarflar` environment, `workflowsPath: workflows/solarflar`).
- Main reminder flow: HERO customer fetch → `MapHeroCustomers` → Ollama email generation (`GenerateEmail`) → `AttachCustomerFields` → `Validate` → `HumanReview` (wait) → `SendGate` → Outlook `SendEmail`, with `InvalidForManualFollowUp` reject branch.
- Employee test flow: `EmployeeTestTrigger` → `BuildEmployeeTestMessages` → `SendEmployeeTestEmail`.
- Daily employee reminder flow with coverage reporting: `EmployeeReminderSchedule` → `HeroCompanyPartners` → `PrepareSolarFlareReminders` / `ReportReminderCoverage` → `SendSolarFlareReminder` (latest commit `0a2a239`).
- Credentials wired: HERO GraphQL (`httpHeaderAuth`), Outlook (`microsoftOutlookOAuth2Api`).

## In progress / pending

- Commit the uncommitted workflow edits and reconcile TS source with the live instance.
- Activate the schedule (`active: true`) once the human-approval path and Outlook token are confirmed working end-to-end.
- Verify the Outlook credential's "Connect my account" step is completed (config alone does not establish a token).

## Known gotchas

See the "Gotchas" section of [CLAUDE.md](CLAUDE.md) and [AGENTS.md](AGENTS.md) — `=` expression prefix, `wait`-node payload replacement on resume, raw-PUT `settings` trap, API key location, single-tenant Outlook OAuth. Add any newly-discovered gotcha there and note it here.

## Changelog

- 2026-07-13 — progress.md created.
