---
name: n8n-raw-api-workaround
description: "Push or patch n8n workflows and credentials directly via the n8n REST API when the `npx --yes n8nac` CLI is unavailable (npm registry 403, EROFS/read-only cache errors, or other npx failures). Use when: n8nac push fails, n8nac CLI broken, npm 403 Forbidden registry error, EROFS read-only file system npm cache, need to patch a workflow node or credential without the CLI, raw PUT to /api/v1/workflows, direct n8n API call."
---

# n8n Raw API Workaround

## When to Use

`npx --yes n8nac` (or `@n8n-as-code/n8n-manager`) fails to run in the terminal — typically:

- `npm error code E403` — `403 Forbidden - GET https://registry.npmjs.org/...`
- `npm error code EROFS` — `read-only file system` on `~/.npm/_cacache/tmp/*`
- Any other npx/npm resolution failure that blocks `n8nac push`/`pull`/`resolve`

This is an environment/sandbox issue, not a workflow logic problem. Rather than debugging the npm cache indefinitely, fall back to calling the n8n REST API directly with `curl`, matching what `n8nac push` would have done.

Always retry a plain `npx --yes n8nac env status --json` first (in a fresh terminal if possible) — only use this workaround if the CLI is confirmed broken.

## Prerequisites

- n8n API key: `.vscode/settings.json` → `n8nMcp.apiKey` (this is the working key, not anything in `.env`).
- Base URL: `http://127.0.0.1:5678` (see [docker-compose.yml](../../../docker-compose.yml)).
- Workflow ID: `TyzTNzhz9QuLKNiH` (SolarStar Phase 1 — see [AGENTS.md](../../../AGENTS.md)).

## Procedure

1. **Fetch the live workflow JSON:**

   ```bash
   N8N_KEY=$(python3 -c "import json;print(json.load(open('.vscode/settings.json'))['n8nMcp.apiKey'])")
   curl -s -H "X-N8N-API-KEY: $N8N_KEY" \
     http://127.0.0.1:5678/api/v1/workflows/TyzTNzhz9QuLKNiH -o /tmp/wf.json
   ```

2. **Patch the JSON** with a small Python script (edit node `parameters`, `credentials`, or `connections` in-place). Write the result to a separate file (e.g. `/tmp/wf_patch.json`) rather than overwriting the fetched copy, so you can diff/retry.

3. **CRITICAL: trim `settings` before PUTting back.** The live workflow's `settings` object may contain extra keys (e.g. `binaryMode`) that the PUT endpoint rejects:

   ```
   400 {"message":"request/body/settings must NOT have additional properties"}
   ```

   Before sending, replace `settings` with only the known-safe key(s):

   ```python
   payload['settings'] = {'executionOrder': 'v1'}
   ```

4. **PUT the patched workflow back:**

   ```bash
   curl -s -X PUT -H "X-N8N-API-KEY: $N8N_KEY" -H "Content-Type: application/json" \
     -d @/tmp/wf_patch.json \
     -w "\nHTTP:%{http_code}\n" \
     http://127.0.0.1:5678/api/v1/workflows/TyzTNzhz9QuLKNiH -o /tmp/wf_result.json
   ```

   Confirm `HTTP:200`. On `400`, read `/tmp/wf_result.json` for the exact validation message (usually a `settings` or schema mismatch).

5. **Credentials** (e.g. `microsoftOutlookOAuth2Api`, `httpHeaderAuth`) are separate REST resources — `POST /api/v1/credentials` to create, and note there is no general PATCH; recreate or use the credential's `id` when wiring a node's `credentials` field in the workflow JSON.

6. **Update the TS source file too** (`workflows/solarflar/*.workflow.ts`) so the n8n-as-code source of truth doesn't drift from the live instance — do this even though the CLI push didn't run, so a future `n8nac push` doesn't clobber this change.

7. **Clean up** temp files (`/tmp/wf*.json`, any scratch `.py` scripts) once verified.

## After the CLI Is Fixed

Once `npx --yes n8nac env status --json` works again, prefer it over this workaround. Consider running `npx --yes n8nac resolve --mode keep-current` (or a diff/pull) to reconcile any drift between the TS source and what was patched live via the API.

## Related

- [n8n-architect skill](../n8n-architect/SKILL.md) — normal n8nac-based workflow authoring/sync.
- Full incident history and credential IDs: repo memory `/memories/repo/solarstar-n8n.md`.
