---
name: solarstar-ops-recovery
description: "Runbook for SolarStar server/runtime recovery tasks. Use when: n8n login fails or password reset needed, n8n UI unreachable or connection refused, git push 403 / permission denied / wrong credential, Postgres access to the n8n database, checking container health, docker compose issues, port 5678 not reachable, SSH port forwarding to reach the editor."
---

# SolarStar Ops Recovery Runbook

Verified procedures for recurring operational issues on this headless server (`spark-6da7`). Check repo memory (`/memories/repo/solarstar-n8n.md`) for the latest incident notes before re-diagnosing.

## 1. Container health

```bash
cd /home/admin/solarstar
docker compose up -d                 # idempotent; starts n8n (:5678) + n8n_postgres
docker compose logs n8n --tail 30    # look for "Editor is now accessible via"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

Host container landscape (do not confuse):
- `n8n_postgres` is **not** published to the host. Host port **5432 belongs to rag_backend's Postgres**, not n8n.
- Other services on this box: qdrant (6333/6334), rag_backend-api (8000), chroma (8100), redis (6379), open-webui, cloudflared.

## 2. n8n database access

Always via the container, user/db are both `n8n` (never `postgres`):

```bash
docker exec n8n_postgres psql -U n8n -d n8n
```

Password = `POSTGRES_PASSWORD` in `.env` (gitignored).

## 3. n8n login recovery / password reset

There is a single owner account. Find it:

```bash
docker exec n8n_postgres psql -U n8n -d n8n -c 'SELECT id, email FROM "user";'
```

Reset the password (no restart needed, takes effect immediately):

```bash
# 1. Generate a bcrypt hash (cost 10)
python3 -c "import bcrypt; print(bcrypt.hashpw(b'<NEW_PASSWORD>', bcrypt.gensalt(10)).decode())"

# 2. Write it — escape every $ in the hash as \$ when inlining in a double-quoted shell string
docker exec n8n_postgres psql -U n8n -d n8n -c "UPDATE \"user\" SET password = '<ESCAPED_HASH>' WHERE email = '<EMAIL>';"
```

Tell the user the new password; never store it in a repo file.

## 4. Reaching the n8n editor (headless server)

The VS Code integrated browser and the user's local browser cannot reach `localhost:5678` directly — this is a remote machine.

Options, in order of preference:
1. **SSH forward** (run on the user's local machine): `ssh -L 5678:localhost:5678 admin@<server-ip>` then open `http://localhost:5678`.
2. **Public IP**: `curl -s ifconfig.me` for the current IP, then `http://<ip>:5678` — works only if the firewall allows 5678.

If the integrated browser shows `ERR_CONNECTION_REFUSED`, it means no forwarding is active — ask the user to set up option 1; do not restart containers to "fix" it.

## 5. Git push failures (403 / permission denied)

Expected setup: remote `https://github.com/Justicegodknows/solarstar.git`, global `credential.helper store`, token for **Justicegodknows** in `~/.git-credentials`.

If push returns 403 naming a different user (e.g. a stale credential):

```bash
git config --global credential.helper        # expect: store
grep -o 'https://[^:]*' ~/.git-credentials   # inspect stored identities (never print full tokens)
# Remove the offending line from ~/.git-credentials, then re-add:
echo "https://Justicegodknows:<TOKEN>@github.com" >> ~/.git-credentials
chmod 600 ~/.git-credentials
```

Keep the remote URL clean (no embedded token): `git remote set-url origin https://github.com/Justicegodknows/solarstar.git`.

## 6. After any recovery

Update `/memories/repo/solarstar-n8n.md` with anything newly learned, and note user-visible changes in [progress.md](../../../progress.md) if they affect Phase 0 items.
