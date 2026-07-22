# Pluto MCP

Install the Pluto plugin in Codex to discover candidates through TalentPluto's
read-only MCP server.

## Install and connect

The normal setup path is:

1. Add the TalentPluto marketplace.
2. Install Pluto.
3. Authenticate once.
4. Restart the desktop app or start a fresh task.
5. Confirm Pluto initialized and that its complete tool inventory is available.
6. Let Codex refresh the OAuth session with the saved refresh credential.

For the Codex CLI, run:

```bash
codex plugin marketplace add talentpluto/pluto-mcp
codex plugin add pluto@talentpluto
codex mcp login pluto
```

The desktop app should request authentication during installation because the
marketplace declares `authentication: ON_INSTALL`. The CLI install command
does not start that browser flow, so CLI users must run `codex mcp login pluto`
explicitly. Complete the TalentPluto OAuth flow with an account belonging to an
organization that has Candidate MCP access enabled.

Pluto requests `candidates:read` and `offline_access`. The latter lets Codex use
the saved refresh credential when an access token expires instead of requiring
a browser login for every session.

After installation, authentication, an upgrade, or a reconnect, restart Codex
or start a fresh task. If an existing task still lacks Pluto tools, fully quit
and reopen the ChatGPT/Codex desktop app and start a new task. A plugin appearing
in configuration does not prove that its MCP server initialized or that its
tools were mounted into an already-running task.

## Persist OAuth credentials

Codex supports an OS keyring for persistent MCP OAuth credentials. In managed
or local installations, set this in the user's Codex configuration:

```toml
# ~/.codex/config.toml
mcp_oauth_credentials_store = "keyring"
```

The plugin does not edit `~/.codex/config.toml` and never logs out Pluto during
installation or startup. Reauthenticate only when the saved refresh credential
is missing, expired, revoked, invalid, or no longer authorized.

## Verify the connection

First confirm the expected plugin version is installed and enabled:

```bash
codex plugin list
```

Then use a fresh task to confirm that the `pluto` MCP server reaches a ready
state and that Codex exposes the server's actual tool inventory. Do not use the
`Auth` column from `codex mcp list` as the sole health signal: it describes
configuration or stored authorization, not successful MCP initialization or
tool discovery.

Maintainers can run the source-to-host inventory comparison documented in
[Integration health check](docs/integration-health-check.md). It initializes
the remote server, follows every `tools/list` page, and compares that inventory
with Codex's stable host-status inventory after a fresh task initializes.

## Use

Mention Pluto in Codex and describe the candidates you want to find:

```text
@pluto Find account executives in New York with at least three years of experience.
```

Pluto exposes read-only candidate discovery. It does not expose contact
details, private recruiting notes, project pipelines, resumes, or transcripts.

The candidate-discovery skill checks that Pluto's MCP tool is present before it
attempts a search. If Pluto is unavailable, it reports that authentication is
required or initialization failed and does not silently use another candidate
source.

Pluto is deliberately not marked `required: true` in `.mcp.json`. Making the
server globally required would prevent every Codex task from starting or
resuming while Pluto is unavailable, including unrelated work and recovery
tasks. Candidate discovery instead fails closed at the skill boundary without
making the rest of Codex unusable.

## Recovery

If Pluto was just installed, upgraded, or reconnected, restart the desktop app
and start a fresh task before diagnosing the saved credentials.

If the plugin may be stale, inspect `codex plugin list` and compare its installed
version with the current marketplace version. Only when it is stale or damaged,
refresh the marketplace and reinstall the plugin:

```bash
codex plugin marketplace upgrade talentpluto
codex plugin add pluto@talentpluto
```

If Codex reports that authentication is missing or needs reconnection, begin
with a normal login without logging out first. This avoids deleting the saved
state before a replacement authorization succeeds:

```bash
codex mcp login pluto
```

Use a Pluto-only hard reset only when its saved credentials are genuinely
invalid, revoked, or no longer authorized and a normal login does not recover
them:

```bash
codex mcp logout pluto
codex mcp login pluto
```

After either reconnect path, fully quit and reopen the ChatGPT/Codex desktop
app and start a new task. Never automate the logout step as part of normal
installation, startup, or upgrade.

## Connection

The plugin connects to:

```text
https://app.talentpluto.com/api/mcp
```

Authentication uses OAuth. This repository contains no credentials or API
keys.
