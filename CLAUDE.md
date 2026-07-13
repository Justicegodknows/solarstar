# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Before implementing any code, read [solarstar-execution-plan.md](solarstar-execution-plan.md) and [progress.md](progress.md).**
> - [solarstar-execution-plan.md](solarstar-execution-plan.md) is the **single source of truth** for the program — problem, architecture, phased roadmap (Phase 0–4), acceptance criteria, definition of done, and risks. All work must trace to a phase there; if a change diverges, update the plan first.
> - [progress.md](progress.md) is the living execution status against the plan (current phase, done, open items, gotchas). Update it after any change that lands.

## What this repo is

This is an **n8n-as-code** workspace, not a conventional application. Its single deliverable is the n8n workflow **SolarStar Phase 1** ([workflows/solarflar/solarstar-phase1-reminder.workflow.ts](workflows/solarflar/solarstar-phase1-reminder.workflow.ts), workflow ID `TyzTNzhz9QuLKNiH`). The workflow reminds customers about annual (solar) maintenance: it pulls due customers from the **HERO Software** GraphQL API, drafts a German reminder email with a local **Ollama** LLM, validates the draft, routes it through a human-approval `wait` step, and sends it via **Microsoft Outlook** (Graph API).

The root `package.json` / `vitest.config.ts` are vestigial (only a placeholder `tests/hello.test.ts`). There is no application to `npm install`; the tooling is `npx --yes n8nac` plus Docker Compose for the runtime.

## Authoritative instructions — read these first

For any n8n workflow work, the detailed operating rules live in existing files. **Read them; do not re-derive their content here.**

- [AGENTS.md](AGENTS.md) — project overview, environment setup, and the project-specific gotchas (repeated in "Gotchas" below for convenience).
- [.agents/skills/n8n-architect/SKILL.md](.agents/skills/n8n-architect/SKILL.md) — the full n8nac command reference and authoring rules (sync discipline, schema-first research, AI sub-node wiring, testing, presentation). Also mirrored as a Copilot/VS Code agent at [.github/agents/n8n-architect.agent.md](.github/agents/n8n-architect.agent.md).
- [.agents/skills/n8n-raw-api-workaround/SKILL.md](.agents/skills/n8n-raw-api-workaround/SKILL.md) — fallback for pushing/patching workflows via the raw n8n REST API when the `n8nac` CLI is broken (npm 403 / EROFS cache errors).

## Commands

Run all `n8nac` commands from the context root (`/home/admin/solarstar`); never `cd` into package/source directories.

```bash
# Resolve effective workspace state — the source of truth for workflowsPath. Run before any workflow work.
npx --yes n8nac env status --json

# Core author→sync loop
npx --yes n8nac list                                              # inspect workflow IDs / paths / sync status
npx --yes n8nac pull TyzTNzhz9QuLKNiH                             # pull BEFORE editing an existing workflow
npx --yes n8nac push workflows/solarflar/solarstar-phase1-reminder.workflow.ts --verify   # push AFTER editing (full path, not a bare filename)
npx --yes n8nac verify TyzTNzhz9QuLKNiH
npx --yes n8nac workflow present TyzTNzhz9QuLKNiH --json          # the ONLY way to produce a user-facing workflow URL

# Schema-first research — never guess node params/types/versions
npx --yes n8nac skills node-info <nodeName>
npx --yes n8nac skills examples search "<pattern>"

# Runtime (n8n on :5678 + Postgres). Needs .env (gitignored): POSTGRES_PASSWORD, N8N_ENCRYPTION_KEY, plus CLIENT_SECRET_VALUE and HERO_API_KEY read manually for credentials.
docker compose up -d

# Placeholder test suite (not the workflow's real test path — use `n8nac test`/`test-plan` for that)
npm test                                                          # vitest
npx vitest run tests/hello.test.ts                                # single file
```

## Architecture

The workflow class in [solarstar-phase1-reminder.workflow.ts](workflows/solarflar/solarstar-phase1-reminder.workflow.ts) (19 nodes) uses TypeScript decorators from `@n8n-as-code/transformer`. Its `<workflow-map>` comment block at the top is the index — read it first, then jump to the node/routing section you need.

Four distinct trigger-rooted flows share the file:

1. **Main reminder flow** (`ScheduleTrigger` / `TestTrigger` → `CustomerData` → `MapHeroCustomers` → `GenerateEmail` → `AttachCustomerFields` → `Validate` → `HumanReview` (wait) → `SendGate` → `SendEmail`, with `InvalidForManualFollowUp` as the reject branch). This is the customer-drafting pipeline with LLM generation and human approval.
2. **Employee test flow** (`EmployeeTestTrigger` → `BuildEmployeeTestMessages` → `SendEmployeeTestEmail`) — manual test path.
3. **Employee reminder flow** (`EmployeeReminderSchedule` → `HeroCompanyPartners` → `PrepareSolarFlareReminders` / `ReportReminderCoverage` → `SendSolarFlareReminder`) — daily employee reminders with coverage reporting.

External dependencies wired via n8n credentials: HERO GraphQL (`httpHeaderAuth`, Bearer), Outlook (`microsoftOutlookOAuth2Api`), Ollama at `http://172.17.0.1:11434` (model `mistral`, called as a plain `httpRequest`, not an AI sub-node).

## Gotchas (project-specific)

- **`=` expression prefix**: an n8n string parameter (e.g. `jsonBody`) only evaluates `{{ }}` expressions when the value **starts with `=`**. Without it, the template is sent as literal text with **no error**. Verify via actual execution `runData`, not just a "success" status.
- **`wait` node + `resume: 'webhook'`** discards the original item's json on resume and replaces it with the incoming webhook payload. Re-attach any fields downstream nodes need (e.g. `is_valid`) after resume — nothing passes through automatically.
- **Raw workflow PUT** (bypassing `n8nac`): the `settings` object must contain only known keys (`executionOrder`); extras like `binaryMode` cause a `400`. See the raw-API skill.
- **n8n API key** for MCP/raw-API calls is in `.vscode/settings.json` → `n8nMcp.apiKey`, **not** in `.env`.
- **Outlook single-tenant Azure AD**: `microsoftOutlookOAuth2Api` has no tenant field — override `authUrl`/`accessTokenUrl` to the `.../<tenantId>/oauth2/v2.0/...` endpoints, and a human must still complete "Connect my account" in the n8n UI.
