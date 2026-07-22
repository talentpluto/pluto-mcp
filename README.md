# Pluto MCP

Pluto adds candidate discovery and monthly credit-balance lookup to Codex
through TalentPluto.

## Install

### Codex desktop

Add the `talentpluto/pluto-mcp` marketplace, install **Pluto**, and complete the
TalentPluto sign-in when prompted. Then fully quit and reopen Codex and start a
new task.

### Codex CLI

Run these commands once:

```bash
codex plugin marketplace add talentpluto/pluto-mcp
codex plugin add pluto@talentpluto
codex mcp login pluto
```

Then start a new Codex session. The TalentPluto account used to sign in must
belong to an organization with Candidate MCP access enabled.

That is the complete normal setup. Pluto requests `candidates:read` and
`offline_access`, so Codex can refresh expired access tokens without asking you
to sign in again. Codex's default `auto` credential store uses the OS keyring
when available and otherwise falls back to its persistent credential file; no
credential-store setting is normally needed.

## Use

### Discover candidates

```text
@pluto Find account executives in New York with at least three years of experience.
```

### Check credits

```text
@pluto How many credits do I have left, and when do they reset?
```

Candidate discovery consumes monthly credits. Credit-balance lookup calls
`get_credit_balance` without a user or organization ID and reports the exact
`monthlyCredits`, `remainingCredits`, and `resetsAt` values returned by Pluto.

Pluto does not modify candidate data or expose contact details, private notes,
resumes, transcripts, account identifiers, or authentication metadata. Its
skills fail closed when their tools are unavailable and do not block unrelated
Codex tasks.

## If Pluto is unavailable

Use the first step that matches what Codex reports:

1. **Pluto was just installed, upgraded, or reconnected:** fully quit and
   reopen Codex, then start a new task.
2. **Codex asks you to sign in or reconnect:** run `codex mcp login pluto`, then
   restart Codex and start a new task. Do not log out first.
3. **Codex says a Pluto tool is unavailable in the current version:** run the
   commands below, then restart Codex and start a new task.

   ```bash
   codex plugin marketplace upgrade talentpluto
   codex plugin add pluto@talentpluto
   ```

4. **A normal login still fails because the saved grant is invalid or revoked:**
   reset only Pluto's saved authorization, then restart Codex and start a new
   task.

   ```bash
   codex mcp logout pluto
   codex mcp login pluto
   ```

Never automate logout during installation, startup, or upgrade. Most connection
problems do not require deleting the saved authorization.

## Maintainers

The [integration health check](docs/integration-health-check.md) covers clean
installation, tool discovery, app-server restart, plugin upgrade, and invalid
credential behavior against an isolated Codex home.

Pluto connects to `https://app.talentpluto.com/api/mcp` with OAuth. This
repository contains no credentials or API keys.
