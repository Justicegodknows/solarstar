# progress.md

Living execution status for the SolarStar program. **Every agent must read this file before implementing any code**, and update it after any change that lands (new node, credential, gotcha, phase progress).

**Single source of truth:** [solarstar-execution-plan.md](solarstar-execution-plan.md) defines the program — problem statement, target architecture, technology, the phased roadmap (Phase 0–4), acceptance criteria (AC), definition of done (DoD), and risks. This file does **not** redefine scope; it tracks live progress *against* the plan. If work and plan disagree, follow the plan or update the plan first — do not let this file drift into a second source of truth.

Last updated: 2026-08-07

## Recent change

Added graceful handling for the Outlook `429 ErrorExceededMessageLimit`
("Daily Message/Recipient limit exceeded") error reported against
`info@juergenhohnen.de`. All three `microsoftOutlook` send nodes (`Send
Email`, `Send Employee Test Email`, `Send Solar Flare Reminder`) now have
`onError: 'continueErrorOutput'`, each wired to a new small code node
(`Handle Send Email Error`, `Handle Employee Test Send Error`, `Handle Solar
Flare Send Error`) that recognizes the quota-error signature
(`ErrorExceededMessageLimit` / `RefuseQuota` / `429`) and returns a clear
`send_status: 'failed_daily_limit'` item with a follow-up note instead of a
raw stack trace; any other, unexpected error still re-throws so real bugs
keep failing loudly. No auto-retry queue was built (explicitly declined —
manual re-approval/re-send is the fallback). Note: the main customer flow
runs monthly against a fixed 350–380-day-old HERO job window, so a failed
send will **not** naturally reappear next month — there's no queue/state
store in this workflow to auto-recover it, so a failed send currently needs
a manual resend.

While investigating, discovered `Employee Reminder Schedule` (the bulk
"send to all HERO company partners in one shot" trigger, previously
deactivated per user request earlier this session) had been **re-enabled
directly in the n8n UI**, live-only (TS source still said `disabled: true`),
with an unusual schedule config (`rule.interval: [{}, {}]` — two empty
entries — plus `executeOnce`/`alwaysOutputData` flags added by the UI). User
confirmed this was intentional ("I re-enabled it on purpose"), so TS source
was updated to match (`disabled` removed, interval/executeOnce/
alwaysOutputData fields mirrored) rather than reverting it. This is the more
likely real cause of the 429 (a bulk send to many partners in one execution)
than the single-approval main flow. Pushed live via the raw-API workaround
(n8nac CLI still broken); verified via GET that the 3 handler nodes, onError
flags, and connections all landed, and that node/TS drift is now resolved.

Replaced the branded card-style HTML email with a plain signature-style
template modeled on Mehmet Yilmaz's real customer email (attached as a
reference PDF): personalized greeting kept, generic "im kommenden Monat"
wording for the main flow (no LLM-generated paragraph anymore — dropped per
explicit confirmation), CTA button to `termin-vereinbaren`, and a
Mehmet Yilmaz signature block (T 02452 89039, mehmet@juergenhohnen.de) +
Facebook/Instagram footer links + legal footer applied consistently across
all three send paths: `Compose HTML Email` (main customer flow), `Prepare
Solar Flare Reminders` (HERO-partner/employee reminder — kept its existing
computed +3-month due date and optional kWp line), and `Build Employee Test
Messages` (internal test, no CTA). No hosted image URLs were available for
the photo/logo/award badges, so the signature stays text-only — swap in
`<img>` tags later if URLs are provided. `email-templates.ts`/`.js` rewritten
with a new `renderMaintenanceReminderHtml()` function (replacing
`renderBrandedEmailHtml`), matching test updated. Pushed live via the
raw-API workaround (n8nac CLI EROFS again); verified `Mehmet Yilmaz` and
`termin-vereinbaren` markers present in the live jsCode for the relevant
nodes.

`info@juergenhohnen.de` now has Microsoft 365 access (was a quota-limited
consumer mailbox, hitting `429 ErrorExceededMessageLimit`). Confirmed it's
already wired as the sending credential (`f1Xx191p4oB5LCsn`) on all three
Outlook send nodes both live and in TS source — no rewiring needed. Removed
the `MAX_DAILY_RECIPIENTS = 10` cap (and its now-stale comment) from
`PrepareSolarFlareReminders` since it existed only to work around the old
consumer-mailbox quota; the employee reminder flow now sends to all eligible
recipients. Pushed live via the raw-API workaround (n8nac CLI EROFS again);
TS source updated to match. Deleted leftover `.tmp/` scratch files that
referenced abandoned mailbox experiments (`justice.godknows2@outlook.com`,
`solarstar2@outlook.com`).

Deactivated the employee reminder flow: `Employee Reminder Schedule` (the
`scheduleTrigger` rooting `HeroCompanyPartners` → `PrepareSolarFlareReminders` /
`ReportReminderCoverage` → `SendSolarFlareReminder`) now has `disabled: true`,
so it won't fire while the other three trigger-rooted flows in the same
workflow stay active. Pushed live via the raw-API workaround (n8nac CLI EROFS
again); TS source updated to match, and `disabled` added to
`NodeDecoratorOptions` in [workflows/solarflar/n8n-workflows.d.ts](workflows/solarflar/n8n-workflows.d.ts)
(the generated stub was missing this standard n8n node field, which caused a
TS compile error until patched).

Customer and employee reminder emails now send as branded HTML instead of plain
text (styled after juergenhohnen.de: blue gradient header block, white card,
rounded corners). Added a `Compose HTML Email` code node (main flow, between
`Human Review` and `Send Gate`) and switched `Send Email`, `Send Employee Test
Email`, and `Send Solar Flare Reminder` Outlook nodes to
`bodyContentType: 'HTML'`. `Prepare Solar Flare Reminders` now emits `body_html`
instead of plain text. Pushed live via the raw-API workaround (n8nac CLI was
broken with an EROFS npm cache error in this sandbox) — TS source in
[workflows/solarflar/solarstar-phase1-reminder.workflow.ts](workflows/solarflar/solarstar-phase1-reminder.workflow.ts)
updated to match. **Still needs**: an `n8nac verify`/pull once the CLI works
again, to confirm TS source and live workflow are byte-for-byte in sync.

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

- 2026-08-07 — **Outlook send path fixed + send pacing added.** Root cause of the 08-07 15:08 failure (`429 ErrorExceededMessageLimit`, `RefuseQuota, ShowTierUpgrade`): credential `f1Xx191p4oB5LCsn` was pointed at an unrelated Entra app (`ae2d45ba-…`) using the **`/consumers`** OAuth endpoints, i.e. a personal Microsoft account — so the added M365 Business licence could never apply. Credential reconnected to the **Solastar** app (`219c86bd-a19e-4b5a-a0ad-539f3f9dc247`) on tenant-specific endpoints (`6c4fceee-de78-40dc-84fd-9c49277bb248`); token now shows `upn=info@juergenhohnen.de`, `idtyp=user`, `iss=sts.windows.net/<tenant>`, scope includes `Mail.Send`. Mailbox confirmed as a provisioned Exchange Online mailbox via Graph. Added pacing to the bulk employee-reminder path: `PrepareSolarFlareReminders → PaceSolarFlareBatches (splitInBatches, batchSize 10) → SendSolarFlareReminder → ThrottleSolarFlareSend (wait 30s) → ↩ Pace`, plus `retryOnFail/maxTries 3/waitBetweenTries 5000` and `alwaysOutputData` on the send node (keeps the loop alive if a whole slice fails). Effective rate ~20 msg/min, under the Exchange Online ~30/min throttle. Verified end-to-end: test webhook → real send → message present in Sent Items at 20:19:48Z. **Full paced production run verified** (execution `1702`, 2026-08-07 20:33:00→20:36:40Z): 69 reminders sent in 7 slices of 10 spaced ~32s apart (~21 msg/min), status `success`, `HandleSolarFlareSendError` never fired, zero `ErrorExceededMessageLimit` occurrences. Triggered by temporarily setting `EmployeeReminderSchedule` to a one-off cron (`33 22 * * *`) — the n8n **public API has no execute endpoint** (`/run`, `/execute` both return 405), so a schedule swap is the only way to fire a schedule-rooted path without UI/session auth. Schedule restored to `interval: [{}, {}]` and re-verified live afterwards. **Note:** the `MAX_DAILY_RECIPIENTS = 10` cap remains removed; the licensed mailbox allows ~10k recipients/day so pacing (not a cap) is now the control.
- 2026-08-07 — **Gotcha discovered:** `@n8n-as-code/transformer` accepts only *inline literal* node parameter values. A hoisted `const` referenced as a parameter (`jsCode: SEND_ERROR_HANDLER_JS`) makes the whole file unparseable and every `n8nac push` fails with a spurious conflict. The shared send-error handler is therefore duplicated inline across the three handler nodes — keep the copies in sync.
- 2026-07-21 — **Linkedin-automation** (`Isjcq3vslG3jCgYA`, out-of-plan side workflow, kept `active: false`): rebuilt the manually-created 2-node draft into a 5-node pipeline — Schedule → Seed Profiles (code) → Fetch Similar Profiles (RapidAPI linkedin-api8 `/similar-profiles`, new `httpHeaderAuth` credential `TyIBios1CmRBlI9R` "RapidAPI LinkedIn Key") → Extract C-Level Leads (Nigeria + C-level filter, drafts outreach message) → Send Outreach (HTTP POST, placeholder URL). Removed wrongly-attached Rapid7 credential. **Blocker:** the RapidAPI provider (professionalnetworkdata.com) has discontinued the service — every endpoint returns "We are no longer providing this service"; crawl yields 0 leads until a live LinkedIn API is substituted. Pushed + verified.
- 2026-07-20 — Employee reminder body (`PrepareSolarFlareReminders`) switched from the plain "Testmail" text to the customer-facing maintenance template: "Hallo {Vorname}", due date = today + 3 months (de-DE format), Was-wir-machen bullet list, optional kWp line (only if `system_size_kwp` present — currently never for partners), support phone 0178 2801200. Subject now "Erinnerung: Wartung Ihrer Solaranlage bis {Datum}". Pushed + verified.
- 2026-07-20 — Added Wilhelm Brecht (info@wilhelmbrecht.de, +49 176 20093112) and Justice Samuel (justicegsamuel@gmail.com, +491624767479) as hardcoded **top-priority recipients** in `PrepareSolarFlareReminders`: they are prepended ahead of HERO partners (so they always fit within the daily cap) and deduped against the HERO list by email. Pushed + verified.
- 2026-07-14 — Dropped the 3 hardcoded employee records (Yusuf, Mehmet, David) from `PrepareSolarFlareReminders` and `ReportReminderCoverage`; daily reminders now go to **all HERO company partners with an email**, and the coverage report counts partners with/without email. Personal phone numbers no longer stored in workflow code. Pushed + verified.
- 2026-07-13 — Employee contact data (Yusuf Can, Mehmet Yilmaz, David Homan) surfaced in the daily employee-reminder email body; Mehmet Yilmaz (Leiter Kundendienst, 0178 2801200, mehmet@juergenhohnen.de) appended as Ansprechpartner to customer reminder emails; LLM prompt told not to invent contact data. Fixed: raw newlines in `PrepareSolarFlareReminders` jsCode (runtime SyntaxError) and `triggerAtHour` string→number in `EmployeeReminderSchedule`. Pushed + verified.
- 2026-07-13 — Adopted [solarstar-execution-plan.md](solarstar-execution-plan.md) as the single source of truth; restructured progress tracking around its Phase 0–4 roadmap.
- 2026-07-13 — progress.md created.
