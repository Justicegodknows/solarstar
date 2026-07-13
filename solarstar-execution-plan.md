# SolarStar — Execution & Implementation Plan

**Client:** Jürgen Hohnen GmbH (heating / solar / pellet service company)
**Program owner:** Wilhelm Gisbrecht (Code Berlin) — build partner
**Prepared for:** Justice
**Date:** 2026-07-13
**Basis:** the three requirement interviews (Mehmet Yilmaz — maintenance; David Homan — pellets; Yusuf Can — payroll) and the current `solarstar` repository (n8n Phase 1 workflow, ID `TyzTNzhz9QuLKNiH`).

> This plan uses only what the interviews and the repository state. Where a step is a direct, obvious consequence of those facts, it is marked as an assumption to confirm. It does not invent numbers, dates, or requirements.

---

## 1. Problem statement (from the documents)

Jürgen Hohnen GmbH runs three heavy manual processes. Each one costs staff time that the business would rather spend on revenue.

**Maintenance reminders (Mehmet).** Roughly 100 customers per month are reminded of their annual service by hand, using the old *Label* software and BCC round-mails. That is about one hour of work per week. Only about 50% of customers reply to the email; the other 50% have to be chased by phone, which is slow because people are hard to reach or cancel at short notice. Writing and checking invoices for the 300–400 reports the five technicians produce each month takes three to five working days per week. The company is migrating from *Label* to the cloud software *HERO* (new orders from 1 July, sales from 1 June), moving to *Microsoft 365* on 1 July, and already uses *Pipedrive* for sales leads. The long-term wish is a customer self-booking system that also groups jobs by region for efficient routes. Pellet boilers must be switched off 4–8 hours before service, so any reminder must carry that safety note.

**Pellet communication (David).** Customer contact for pellets is run through manual Excel filtering plus Outlook serial mails, sometimes with ChatGPT help. Serial mails are capped at 500 recipients and, when sent by BCC, cannot be personalised. One campaign takes about an hour. After an order, David books a delivery slot into the truck driver's calendar by phone; there is no digital delivery tracking. Invoicing runs today on *Lexware Office*, with a move to *HERO* planned. David wants automated follow-up emails but insists on a manual check before anything is sent. He also checks maintenance vouchers by hand in the *Label* program (they are not visible in Lexware) and wants future email campaigns to remind customers of those vouchers. Prices are updated monthly against the DEPI (Deutsches Pelletinstitut) values shown on *Heizpellets 24*.

**Payroll and bonuses (Yusuf).** Hours and bonuses are collected by hand and sent as Excel lists to an external payroll accountant by email. Bonus rules differ by group: service technicians get €1,000 at €18,000 monthly revenue (else nothing); project technicians get €8 / €5 / €3 / €0 per system depending on a quality inspection; apprentices get €2 per productive hour if they hold a driving licence. Technicians often forget to book their hours in *Label*, which creates correction work and conflict, and there have been manipulated entries caught by vehicle tracking. With *HERO* live on 1 July, Yusuf wants hours to flow automatically into payroll, bonuses to be calculated automatically, vacation accounts to be managed, payslips to be emailed automatically, and payslips to be itemised by customer and period. Sensitive HR data sits with the hosting provider *NSB Königs* and in a restricted management folder (*G-Ordner*). The team named *Make*, *Zapier*, and *n8n* as candidate automation tools but has no experience with them yet.

**Common thread.** All three areas share the same shape: data lives in one or more systems (Label, HERO, Lexware, Outlook/Excel), a person copies and reformats it by hand, and a message or document goes out. Every interview asks for automation with a human still in control of the final send. That is exactly what an n8n workflow with a human-approval step delivers, and it is what you have already started building.

---

## 2. What is already built (repository baseline)

You are not starting from zero. The `solarstar` repo is an **n8n-as-code** workspace whose single current deliverable is the workflow **SolarStar Phase 1 — Wartungs-Erinnerungen** (`TyzTNzhz9QuLKNiH`, 19 nodes).

- **Runtime:** Docker Compose runs self-hosted **n8n** on port 5678 plus **PostgreSQL 15**, wired to `.env` secrets (`POSTGRES_PASSWORD`, `N8N_ENCRYPTION_KEY`). Timezone `Europe/Berlin`.
- **Main reminder flow:** pulls due customers from the **HERO GraphQL API** (`v7`, `httpHeaderAuth` Bearer) → maps them → drafts a German reminder with a **local Ollama LLM (`mistral`)** via a plain `httpRequest` to `http://172.17.0.1:11434/api/generate` (temperature 0.3, 90–160 words, no prices/vouchers, clear call to action) → validates → **human-approval `wait` step** → sends via **Microsoft Outlook (Graph API, OAuth2)**. A reject branch (`InvalidForManualFollowUp`) handles drafts that fail validation.
- **Two more flows:** an employee test flow and a daily employee-reminder flow with coverage reporting.
- **Tooling:** `npx --yes n8nac` (n8n-as-code CLI) for author→sync→push, plus schema-first node research; workflows authored in **TypeScript** with `@n8n-as-code/transformer` decorators.
- **Status:** `active: false` — not yet running on a schedule. Uncommitted edits are in the working tree. Outlook "Connect my account" and end-to-end human-approval still need confirming.

The current gotchas are documented (`=` expression prefix, `wait`-node payload replacement on resume, raw-PUT `settings` trap, API-key location, single-tenant Outlook OAuth). Treat `progress.md` as the living source of truth and update it after every change that lands.

---

## 3. Target architecture

The program keeps one consistent pattern across all three domains, so you build skills once and reuse them.

**Pattern: Source → Transform → Draft (open-source LLM) → Validate → Human approval → Send → Log.**

```
 Trigger (schedule / webhook)
        │
        ▼
 Fetch from system of record ──► HERO GraphQL (customers, jobs, hours)
        │                        Lexware / Label (transitional)
        ▼
 Normalise (Code node)
        │
        ▼
 Draft content ──► Ollama (open-source model, local) for German text
        │
        ▼
 Validate (Code node: rules, length, forbidden content)
        │
        ├─ valid ──► Human review (wait) ──► Send (Outlook / WhatsApp) ──► Log
        └─ invalid ──► Manual follow-up queue
```

- **Orchestration:** self-hosted **n8n** (Docker), authored as code via **n8n-as-code**.
- **System of record:** **HERO Software** (GraphQL) becomes the primary source after the 1 July migration. **Label** and **Lexware** are read-only/transitional sources until HERO covers their data.
- **AI drafting:** **open-source models via Ollama**, running locally so customer and HR data never leave the company's environment (important given data sits with NSB Königs and the restricted G-Ordner). `mistral` is in use today; German-tuned or larger models can be swapped in without changing the workflow.
- **Delivery:** **Microsoft Outlook / Graph** (after MS365 go-live). Optional second channel: **WhatsApp** (the n8nac environment description already mentions "email delivery system and WhatsApp messages"; both David and Mehmet raised WhatsApp as an idea to confirm).
- **Human control:** every customer-facing or pay-relevant message passes an approval `wait` step. This is a hard requirement from all three interviews.
- **State / audit:** Postgres (n8n's own DB) plus a lightweight run log so you can prove what was sent, to whom, and when.

---

## 4. Technology, tools & packages

The table lists everything needed to run the full program. Items marked *(in repo)* are already wired.

| Layer | Tool / package | Purpose | Status |
|---|---|---|---|
| Orchestration | **n8n** (`n8nio/n8n:latest`, self-hosted) | Runs all workflows | *(in repo)* |
| Workflow-as-code | **n8n-as-code** CLI (`npx --yes n8nac`), `@n8n-as-code/transformer`, `@n8n-as-code/n8n-manager` | Author, sync, push, verify workflows in TypeScript | *(in repo)* |
| Database | **PostgreSQL 15** | n8n execution store + run/audit log | *(in repo)* |
| Containerisation | **Docker + Docker Compose** | Runtime for n8n + Postgres (+ optional Ollama) | *(in repo)* |
| Open-source LLM | **Ollama** + `mistral` (swap-in: `llama3.1`, `qwen2.5`, or a German-tuned model) | Local German drafting, no data egress | *(in repo)* |
| System of record | **HERO Software** GraphQL API v7 (`httpHeaderAuth` Bearer) | Customers, maintenance due dates, jobs, hours | *(in repo)* |
| Email delivery | **Microsoft Outlook / Graph API** (`microsoftOutlookOAuth2Api`, single-tenant Azure AD) | Sending approved messages | *(in repo)* |
| Identity / cloud | **Microsoft 365** (live 1 July) | Mailboxes, calendars, auth | Company rollout |
| Transitional data | **Label** (CSV-based), **Lexware Office** | Legacy customer, invoice, voucher, hours data during migration | Read-only |
| Sales | **Pipedrive** | Lead management (later cross-sell hooks) | Existing |
| Second channel (optional) | **WhatsApp Business API / n8n WhatsApp node** | Higher-response reminder channel | To confirm |
| Dev tooling | **TypeScript**, **Vitest**, VS Code (+ n8n MCP), Git/GitHub | Authoring, tests, version control | *(in repo)* |
| Secrets | `.env` (gitignored): `POSTGRES_PASSWORD`, `N8N_ENCRYPTION_KEY`, `CLIENT_SECRET_VALUE`, `HERO_API_KEY`; n8n API key in `.vscode/settings.json` | Credentials | *(in repo)* |
| Scheduling / route logic | n8n Schedule Trigger; region grouping in Code nodes (optional maps/geocoding API) | Timed runs + route bundling | Partly built |

**New packages/services to add for the full program:** a WhatsApp channel (if confirmed), an optional booking front-end (n8n webhook + a small hosted page, or a HERO/Calendly-style calendar integration), and — only if route optimisation goes beyond simple regional grouping — a geocoding/routing API. Nothing else in the stack needs replacing.

---

## 5. Phased roadmap

The order follows the business's own priorities: Mehmet ranks invoicing and maintenance scheduling as "A" tasks, HERO and MS365 both go live on 1 July, and the pellet season drives David's timeline. Payroll depends most on clean HERO time data, so it comes after HERO is stable.

### Phase 0 — Stabilise the foundation (Week 1)

Get the platform and the existing Phase 1 workflow to a trustworthy, running state before adding scope.

**Work:** commit the uncommitted workflow edits and reconcile the TS source with the live instance; confirm `.env` and the Outlook "Connect my account" token; validate the HERO Bearer credential end-to-end; run the human-approval path with a test payload; keep `active: false` until the path is proven.

**AC:**
- `npx --yes n8nac env status --json` resolves the `solarflar` environment and `workflowsPath` cleanly.
- A test trigger produces a HERO fetch → Ollama draft → validation → approval → Outlook send with real `runData` (not just a "success" flag).
- Outlook token is live (a real test mail is delivered).
- No uncommitted edits remain; TS source matches the live workflow (`n8nac verify` passes).

**DoD:** Phase 1 runs on demand end-to-end with a human approving each send; `progress.md` updated; gotchas re-checked; a rollback note (how to disable/`active:false`) documented.

### Phase 1 — Maintenance reminders in production (Weeks 2–4)

Turn the built workflow into the live replacement for Mehmet's manual BCC process for ~100 customers/month.

**Work:** wire the schedule to run one month before each service is due (per the interview); ensure the pellet-boiler "switch off 4–8h before service" safety note is included where applicable; add the reject/manual-follow-up queue for the ~50% who don't reply (a chase list, not auto-nagging); log every send. Activate the schedule (`active: true`) only after a supervised dry run.

**AC:**
- Due customers are selected correctly from HERO for the coming month (spot-checked against a known list).
- Every generated email: correct salutation + first name, 90–160 words, no price promises, no invented details, no voucher mention, clear booking call-to-action, and the safety note for pellet systems.
- Each email waits for human approval before sending; rejected drafts land in the manual-follow-up list.
- Non-responders after a defined window appear on a phone-chase list.

**DoD:** one full monthly cycle sent through the workflow with human approval; measured admin time for the reminder step at or below the previous ~1h/week; audit log shows recipients, timestamps, approve/reject; `progress.md` and gotchas updated.

### Phase 2 — Pellet season campaigns & voucher reminders (Weeks 4–7)

Replace David's manual Excel+Outlook serial mails and remove the 500-recipient / no-personalisation limits, with a mandatory manual check before send.

**Work:** build a personalised campaign flow (per-recipient drafting via Ollama, so BCC personalisation limits no longer apply); pull recipients from HERO (Lexware/Label as transitional source); add voucher-eligibility reminders (David checks these by hand in Label today) as a data lookup that flags eligible customers; keep a single human approval gate over the batch; optionally add a delivery-slot booking step. Do **not** auto-send — David requires review.

**AC:**
- A campaign of more than 500 recipients sends without the serial-mail cap, each email individually addressed.
- Voucher-eligible customers are flagged from the source data and reminded only when eligible.
- No email sends until David approves the batch.
- Prices/claims are never invented; pricing content, if any, comes from a supplied source (DEPI/Heizpellets 24 values), not the model.

**DoD:** one seasonal campaign delivered through the workflow with manual approval; per-campaign effort at or below the previous ~1h; voucher reminders verified against Label data for a sample; log retained; `progress.md` updated.

### Phase 3 — Payroll, bonus & vacation automation (Weeks 7–11)

Automate Yusuf's hand-built Excel-to-accountant process once HERO time data is reliable.

**Work:** pull technician hours from HERO; compute bonuses by the exact interview rules — service techs €1,000 at €18,000 monthly revenue else €0; project techs €8/€5/€3/€0 per system by quality inspection; apprentices €2/productive hour if licensed; build vacation-account tracking (annual planning + day-accurate deduction on approval); generate itemised payslips (by customer and period) and email them automatically after approval; produce the Excel/list hand-off to the external payroll accountant. Respect data restrictions (NSB Königs hosting, G-Ordner access) — keep drafting local via Ollama and limit who can approve.

**AC:**
- Hours import from HERO matches source for a sample of technicians; missing bookings are flagged (no pay for un-booked hours, per policy) rather than guessed.
- Each bonus type computes to the exact interview figures on worked examples.
- Payslips are itemised by customer/period and only sent after approval.
- Vacation balances update correctly on approval; the accountant hand-off file matches the computed values.

**DoD:** one full payroll cycle produced through the workflow, reconciled against a manual calculation with zero discrepancy; access limited to authorised approvers; sensitive data never leaves the local environment; `progress.md` updated.

### Phase 4 — Self-service & extra channels (Weeks 11+, optional / to confirm)

Address the longer-term wishes only after the core three are stable.

**Work (each to confirm):** customer self-booking with regional route bundling (Mehmet's vision); WhatsApp as a second reminder channel for higher response (David & Mehmet); a missed-call digital assistant (David); app-triggered invoicing after delivery (David). Older customers prefer phone contact, so self-service is additive, not a replacement.

**AC / DoD:** defined per feature when scoped; each must keep a human in the loop where money or customer commitments are involved, and must not degrade the phone option older customers rely on.

---

## 6. Program-wide Acceptance Criteria

These apply to every phase.

- **Grounded content only.** Generated text uses only supplied data; it never invents prices, dates, vouchers, or customer details. (Enforced in the prompt and the `Validate` node.)
- **Human in the loop.** No customer-facing email, no payslip, and no pay figure is sent without an explicit human approval step.
- **Data stays local.** All AI drafting runs on the local open-source model (Ollama); customer and HR data is not sent to external LLM services.
- **Verify by execution.** "Success" status is not proof — every acceptance check reads real `runData`, because n8n silently sends literal text when the `=` expression prefix is missing.
- **Auditable.** Every send is logged with recipient, timestamp, content reference, and approver.
- **Reversible.** Each workflow can be set `active: false` and rolled back; `progress.md` records the change.

## 7. Program-wide Definition of Done

The program is done when:

- All three manual processes (maintenance reminders, pellet campaigns, payroll/bonus) run through n8n with human approval, replacing the manual Excel/Outlook/Label steps described in the interviews.
- HERO is the system of record for each flow, with Label/Lexware retired from the automated path.
- Measured admin time for each automated step is at or below the interview baselines (reminders ~1h/week; pellet campaign ~1h; payroll no longer a manual Excel build).
- Each workflow is versioned as code, verified (`n8nac verify`), documented in `progress.md`, and has a named owner and rollback path.
- Sensitive HR/customer data never leaves the local environment during drafting.

---

## 8. Risks & dependencies (from the documents)

- **HERO migration timing.** New orders move to HERO on 1 July with **no legacy data migration** (Label is CSV-based, not SQL). Automated flows must read from HERO for new data and treat Label/Lexware as transitional. Confirm which fields the HERO GraphQL schema exposes before building each flow (use `n8nac skills node-info` / schema-first research — never guess).
- **MS365 / Outlook token.** Single-tenant Azure AD needs the `authUrl`/`accessTokenUrl` override, and a human must complete "Connect my account". Config alone does not create a working token.
- **Time-tracking discipline.** Payroll automation is only as good as the hours booked in HERO. The interview's own rule — no booking, no payment — should be encoded, not worked around.
- **Data protection.** HR data (NSB Königs hosting, restricted G-Ordner). Keep drafting local and restrict approver access.
- **Adoption.** Older customers prefer phone contact; self-service and extra channels must stay additive.
- **Silent-failure gotchas.** The `=` prefix and `wait`-node payload replacement have already bitten this project — keep them in the review checklist for every new node.

## 9. Immediate next steps

1. Finish **Phase 0**: commit working-tree edits, confirm Outlook token, prove the Phase 1 path with real `runData`.
2. Confirm two open scope questions with the client: **WhatsApp as a second channel?** and **which route-optimisation depth** (simple regional grouping vs. a routing API).
3. Verify the **HERO GraphQL schema** for the fields each phase needs before building, so no node guesses a type or version.
4. Keep `progress.md` as the single living record and update it after every landed change.
