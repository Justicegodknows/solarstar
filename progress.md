# progress.md

Living execution status for the SolarStar program. **Every agent must read this file before implementing any code**, and update it after any change that lands (new node, credential, gotcha, phase progress).

**Single source of truth:** [solarstar-execution-plan.md](solarstar-execution-plan.md) defines the program — problem statement, target architecture, technology, the phased roadmap (Phase 0–4), acceptance criteria (AC), definition of done (DoD), and risks. This file does **not** redefine scope; it tracks live progress *against* the plan. If work and plan disagree, follow the plan or update the plan first — do not let this file drift into a second source of truth.

Last updated: 2026-07-13

## Current position

**Phase 0 — Stabilise the foundation** (see plan §5). The Phase 1 workflow (`TyzTNzhz9QuLKNiH`, [workflows/solarflar/solarstar-phase1-reminder.workflow.ts](workflows/solarflar/solarstar-phase1-reminder.workflow.ts)) is built out to 19 nodes across four trigger-rooted flows but is `active: false` and not yet proven end-to-end. Uncommitted edits remain in the working tree.

## Phase tracker

| Phase | Scope (see plan §5) | Status |
|---|---|---|
| **0 — Stabilise foundation** | Commit edits, confirm Outlook token, prove Phase 1 path with real `runData` | 🔵 In progress |
| **1 — Maintenance reminders in production** | Live replacement for Mehmet's ~100/mo BCC process; schedule, safety note, chase list | ⚪ Not started |
| **2 — Pellet campaigns & voucher reminders** | Personalised campaigns >500 recipients, voucher flags, batch approval | ⚪ Not started |
| **3 — Payroll, bonus & vacation** | HERO hours → bonus rules → itemised payslips + accountant hand-off | ⚪ Not started |
| **4 — Self-service & extra channels** | Self-booking, WhatsApp, missed-call assistant (optional / to confirm) | ⚪ Not started |

## Completed (baseline — plan §2)

- Docker Compose runtime: n8n (`:5678`) + Postgres 15, wired to `.env` secrets; timezone `Europe/Berlin`.
- n8n-as-code workspace configured (`solarflar` environment, `workflowsPath: workflows/solarflar`).
- Main reminder flow: HERO customer fetch → `MapHeroCustomers` → Ollama (`mistral`) draft via `httpRequest` → `AttachCustomerFields` → `Validate` → `HumanReview` (wait) → `SendGate` → Outlook `SendEmail`; `InvalidForManualFollowUp` reject branch.
- Employee test flow: `EmployeeTestTrigger` → `BuildEmployeeTestMessages` → `SendEmployeeTestEmail`.
- Daily employee-reminder flow with coverage reporting: `EmployeeReminderSchedule` → `HeroCompanyPartners` → `PrepareSolarFlareReminders` / `ReportReminderCoverage` → `SendSolarFlareReminder` (commit `0a2a239`).
- Credentials wired: HERO GraphQL (`httpHeaderAuth`), Outlook (`microsoftOutlookOAuth2Api`).

## Phase 0 open items (plan §5, AC/DoD)

- [ ] Commit uncommitted workflow edits; reconcile TS source with the live instance (`n8nac verify` passes).
- [ ] Confirm `.env` and complete Outlook "Connect my account" — deliver a real test mail.
- [ ] Validate HERO Bearer credential end-to-end.
- [ ] Run the human-approval path with a test payload and confirm via real `runData` (not just a "success" flag).
- [ ] Document a rollback note (how to set `active: false`).
- [ ] Keep `active: false` until the path is proven.

## Open scope questions (plan §9)

- WhatsApp as a second reminder channel? (Phase 4 — to confirm with client.)
- Route-optimisation depth: simple regional grouping vs. a routing API? (Phase 4.)
- Verify the HERO GraphQL schema exposes the fields each phase needs *before* building — never guess a type/version.

## Known gotchas

See plan §8 and the "Gotchas" section of [CLAUDE.md](CLAUDE.md) / [AGENTS.md](AGENTS.md): `=` expression prefix silent failure, `wait`-node payload replacement on resume, raw-PUT `settings` trap, API-key location, single-tenant Outlook OAuth. Add any newly-discovered gotcha there and note it here.

## Changelog

- 2026-07-20 — Employee reminder body (`PrepareSolarFlareReminders`) switched from the plain "Testmail" text to the customer-facing maintenance template: "Hallo {Vorname}", due date = today + 3 months (de-DE format), Was-wir-machen bullet list, optional kWp line (only if `system_size_kwp` present — currently never for partners), support phone 0178 2801200. Subject now "Erinnerung: Wartung Ihrer Solaranlage bis {Datum}". Pushed + verified.
- 2026-07-20 — Added Wilhelm Brecht (info@wilhelmbrecht.de, +49 176 20093112) and Justice Samuel (justicegsamuel@gmail.com, +491624767479) as hardcoded **top-priority recipients** in `PrepareSolarFlareReminders`: they are prepended ahead of HERO partners (so they always fit within the daily cap) and deduped against the HERO list by email. Pushed + verified.
- 2026-07-14 — Dropped the 3 hardcoded employee records (Yusuf, Mehmet, David) from `PrepareSolarFlareReminders` and `ReportReminderCoverage`; daily reminders now go to **all HERO company partners with an email**, and the coverage report counts partners with/without email. Personal phone numbers no longer stored in workflow code. Pushed + verified.
- 2026-07-13 — Employee contact data (Yusuf Can, Mehmet Yilmaz, David Homan) surfaced in the daily employee-reminder email body; Mehmet Yilmaz (Leiter Kundendienst, 0178 2801200, mehmet@juergenhohnen.de) appended as Ansprechpartner to customer reminder emails; LLM prompt told not to invent contact data. Fixed: raw newlines in `PrepareSolarFlareReminders` jsCode (runtime SyntaxError) and `triggerAtHour` string→number in `EmployeeReminderSchedule`. Pushed + verified.
- 2026-07-13 — Adopted [solarstar-execution-plan.md](solarstar-execution-plan.md) as the single source of truth; restructured progress tracking around its Phase 0–4 roadmap.
- 2026-07-13 — progress.md created.
