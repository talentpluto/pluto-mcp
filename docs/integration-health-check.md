# Pluto integration health check

The integration harness compares Codex's Pluto host-status inventory with the
complete tool inventory advertised by the live TalentPluto MCP server. It does
not store a canonical tool-name list in this repository, so a future server tool
is included automatically.

The harness requires Node.js and Codex CLI 0.145.0 or newer. Its expected host
normalizations are pinned to Codex 0.145 behavior. Newer versions may be used as
compatibility probes, but a strict failure can indicate Codex behavior drift
that needs review rather than a Pluto regression.

## Source of truth and host comparison

The live remote MCP registry is the source of truth. In `live` and `upgrade`
modes, the harness:

1. Sends `initialize` to `https://app.talentpluto.com/api/mcp` using MCP protocol
   version `2025-06-18` and the plugin's compatibility header.
2. Sends `notifications/initialized`.
3. Calls `tools/list`, follows every `nextCursor`, rejects repeated cursors or
   tool names, and collects all server-advertised tools.
4. Starts a fresh ephemeral Codex task and waits for Pluto's terminal
   `mcpServer/startupStatus/updated` notification.
5. Pages the stable app-server `mcpServerStatus/list` method with that task's
   `threadId` and `detail: "toolsAndAuthOnly"`.
6. Compares the remote and host tool-name sets without depending on ordering.
7. Compares tool metadata by raw name.
8. Best-effort terminates any remote MCP session issued during the check.

The comparator requires Codex to preserve `title`, `inputSchema`,
`outputSchema`, `annotations`, and `icons`. It requires the exact Codex 0.145
description transformation: trim the remote description, add terminal
punctuation when needed, and append `This tool is part of plugin \`Pluto\`.`.
It also ignores only the connector metadata keys Codex intentionally removes:

- `connector_id`
- `connector_name`
- `connector_display_name`
- `connector_description`
- `connectorDescription`

All other advertised `_meta` content must survive the integration layer.

Waiting for the terminal startup notification is important. It separately
proves that the fresh task's Pluto runtime finished startup before the harness
requests a host-status snapshot.

## Credential isolation

Never point the harness at a real Codex home. Every stateful mode requires an
absolute `--codex-home`, resolves symlinks, rejects the user's home,
`~/.codex`, the source repository, and an active custom `CODEX_HOME`, and does
not delete existing data. Invoke the harness with `CODEX_HOME` unset; it sets
that variable only for its child processes.

`clean-install` requires an empty directory, restricts it to the current user,
and writes a test-home marker plus this test-only setting:

```toml
mcp_oauth_credentials_store = "file"
```

The file store makes an isolated test home portable and observable across two
app-server process launches. It is not production guidance. Codex's default
`auto` mode already uses the OS keyring when available and otherwise falls back
to its persistent credential file. Environments that require keyring-only
storage can set:

```toml
mcp_oauth_credentials_store = "keyring"
```

OS keyring entries are not reliably isolated by `CODEX_HOME`, which is why the
harness deliberately uses the file store. Use dedicated test credentials, keep
the test home access-restricted, and remove it through the environment's normal
secret-cleanup process after testing.

The `live`, `upgrade`, and `reconnect` modes require the marker written by
`clean-install`. This prevents a typo, symlink, or custom home from modifying a
real installation. Prepare those lifecycle fixtures by starting with a
`clean-install` test home, then authenticate, install the intended older test
version, or revoke its dedicated test grant as the mode requires. Do not copy
the marker into an existing Codex home. Every later mode revalidates that the
fixture still has exactly one `file` credential-store setting and forces that
setting on every Codex child process, so managed configuration cannot redirect
the check to the OS keyring.

`PLUTO_MCP_ACCESS_TOKEN` authenticates the direct remote inventory request. The
harness removes it from every Codex child process, never prints it, and redacts
it from top-level errors. Supply it through a secret manager or ephemeral shell
environment; do not put it in the repository or command arguments.

The direct token and the OAuth identity saved in the isolated Codex home must
belong to the same dedicated test account, organization, and entitlement set.
The host API does not expose a stable non-secret principal identifier, so the
harness cannot prove that identity match. Different entitlements could produce
a legitimate inventory difference that looks like a host-loading failure.

## Commands and modes

### Source contract

```bash
node scripts/check-pluto-integration.mjs source
```

This credential-free check validates consistency among marketplace metadata,
plugin metadata, `.mcp.json`, both skill dependencies, and recovery
documentation. It also asserts that `.mcp.json` does not contain
`required: true`. This is deliberate: a globally required Pluto server would
block unrelated tasks and the tasks needed to recover from an outage. The
candidate-discovery and credit-balance skills fail closed when their Pluto tools
are missing instead.

### Clean installation and missing authentication

Use a new, empty absolute directory:

```bash
node scripts/check-pluto-integration.mjs clean-install \
  --codex-home /absolute/path/to/pluto-clean-home
```

By default, the command adds this repository as a local marketplace. Override
that input when validating another local or Git marketplace source:

```bash
node scripts/check-pluto-integration.mjs clean-install \
  --codex-home /absolute/path/to/pluto-clean-home \
  --marketplace-source talentpluto/pluto-mcp
```

The mode checks the installed version, `ON_INSTALL` policy, MCP URL and
compatibility header, both parsed skill dependencies, and fresh-task behavior
without credentials. The CLI reports the install-time authentication policy but
does not open the interactive OAuth flow itself. Authenticate the isolated
install separately:

```bash
CODEX_HOME=/absolute/path/to/pluto-clean-home \
codex -c 'mcp_oauth_credentials_store="file"' mcp login pluto
```

Do not extract a direct access token from Codex's stored credential file. Give
the following live mode its own isolated test token through
`PLUTO_MCP_ACCESS_TOKEN`.

### Live inventory and restart

```bash
PLUTO_MCP_ACCESS_TOKEN=... \
node scripts/check-pluto-integration.mjs live \
  --codex-home /absolute/path/to/authenticated-pluto-home
```

The isolated home must already contain an installed Pluto plugin and valid
saved OAuth credentials. The mode retrieves the complete remote inventory,
starts a fresh task, checks the host inventory and metadata, stops app-server,
then repeats with the same credential store. This covers fresh-task startup and
reuse of saved authorization across an app-server restart. It does not force an
access token to expire, so it does not by itself prove a refresh-token exchange.

### Marketplace and plugin upgrade

```bash
PLUTO_MCP_ACCESS_TOKEN=... \
node scripts/check-pluto-integration.mjs upgrade \
  --codex-home /absolute/path/to/older-pluto-home \
  --marketplace talentpluto \
  --expected-version 0.1.6
```

The isolated home must begin with an older installed Pluto version and valid
OAuth credentials. The mode upgrades the named marketplace, reinstalls Pluto,
confirms the expected plugin version, starts a fresh task, and reruns the live
inventory comparison. `--expected-version` defaults to the source manifest
version.

### Invalid credentials and reconnect state

```bash
node scripts/check-pluto-integration.mjs reconnect \
  --codex-home /absolute/path/to/invalid-pluto-home
```

Prepare the isolated home with an installed plugin and a genuinely expired,
revoked, or otherwise invalid saved refresh credential. The mode expects a
terminal `failed` startup state with
`failureReason: "reauthenticationRequired"` and verifies that Codex exposes no
stale Pluto tools. It does not create, corrupt, print, or log out credentials.

Additional options are available for every applicable mode:

```text
--codex-bin PATH
--codex-home PATH
--marketplace NAME
--marketplace-source SOURCE
--expected-version VERSION
```

The credential-free unit and source checks are the smallest local validation:

```bash
node --test test/pluto-integration.test.mjs
node scripts/check-pluto-integration.mjs source
```

## Lifecycle coverage and boundaries

The automated coverage includes:

- source metadata and version consistency;
- a clean plugin install into an isolated Codex home;
- the `ON_INSTALL` authentication policy and terminal missing-login state;
- parsing the candidate-discovery and credit-balance MCP dependencies;
- fresh-task Pluto startup and actual host tool enumeration;
- tool metadata preservation;
- app-server restart with the same isolated credential store;
- marketplace refresh plus plugin version upgrade; and
- invalid refresh credentials producing `reauthenticationRequired` instead of
  silently omitting a supposedly healthy tool set.

Interactive browser authentication is intentionally outside the automated
harness. The stable CLI install path does not launch OAuth, and app-server's
`plugin/install` lifecycle API is currently documented as under development.
The clean-install mode therefore asserts the policy and unauthenticated state;
a tester performs `codex mcp login pluto` explicitly before live checks.

The harness restarts `codex app-server`, starts a fresh task, and then requests
`mcpServerStatus/list` using that task's resolved configuration. In Codex
0.145.0, the status method creates a separate MCP connection manager; it does
not enumerate the exact tool objects already attached to that task's model
request. The startup notification plus the separate host-status inventory is
the strongest supported programmable boundary, but it is not proof of the
exact model-facing payload in that task. The harness also does not automate the
ChatGPT/Codex desktop UI. A full desktop-app restart and a new task therefore
remain the recovery path after a real install, upgrade, or reconnect.

## Codex 0.145.0 pagination limitation

Codex 0.145.0 currently makes one upstream `tools/list` request while mounting a
regular MCP server and does not follow the response's `nextCursor`. The direct
remote side of this harness does follow every page. If Pluto begins returning
multiple tool pages before Codex fixes that host limitation, the strict set
comparison will fail and identify every host-missing tool.

Do not weaken the assertion or replace it with a hardcoded tool list. A failure
caused by a later remote page is an actionable Codex host limitation, not a
server-registry or test failure.

## TalentPluto server dependencies

This integration depends on the TalentPluto server continuing to:

- serve streamable HTTP MCP at the stable
  `https://app.talentpluto.com/api/mcp` resource URL;
- support OAuth for `candidates:read` and `offline_access`, including refresh
  credentials and actionable 401/403 responses for invalid access tokens;
- accept the plugin's
  `x-talentpluto-codex-oauth-compatibility: missing-callback-issuer-v1` header;
- complete MCP `initialize` and accept `notifications/initialized` using the
  negotiated protocol;
- return every tool through a terminating, cursor-paginated `tools/list`
  sequence with unique non-empty names and an `inputSchema` for each tool; and
- advertise stable MCP metadata that Codex can preserve through its host layer.

TalentPluto owns the canonical registry, OAuth behavior, and server-level tests.
This repository verifies only the plugin metadata and the strongest stable
Codex host-status boundary available for that live registry.

## Protocol references

- [Codex skill metadata and tool dependencies](https://developers.openai.com/codex/skills)
- [Codex app-server API](https://developers.openai.com/codex/app-server)
- [Codex configuration reference](https://developers.openai.com/codex/config-reference)
- [MCP 2025-06-18 tools and pagination](https://modelcontextprotocol.io/specification/2025-06-18/server/tools)
- [Codex 0.145 plugin provenance transformation](https://github.com/openai/codex/blob/25af12f7e61572b0bc18ddb1008be543b91519b0/codex-rs/codex-mcp/src/rmcp_client.rs#L686-L718)
