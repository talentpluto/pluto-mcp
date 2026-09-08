---
name: connection-recovery
description: Use when Pluto tools are missing, initialization or transport fails, authentication needs renewal, or the user says Pluto skills are not loaded. Diagnoses current host evidence, uses the host's own sign-in route for confirmed authentication failures, verifies recovery with a read, and preserves existing operations. Missing skill files or tools alone do not establish an authentication failure.
---

# Pluto connection recovery

Use this shared skill when a Pluto feature's required tool is absent or
unusable, or when the user asks why Pluto is unavailable. Preserve the user's
original operation and return to the feature skill after recovery.
This applies to every Pluto workflow, including a connection failure after
work has started. Returned business outcomes still follow the feature's rules.

Installed skill files are instructions; live MCP tools require a working
server connection. A skill can load while its tools fail to initialize. If the
tools work and only a skill file is missing, locate that skill in the installed
plugin instead of starting an OAuth login.

Do not replace Pluto with another recruiting source, call the MCP endpoint
directly, claim that an operation ran, or spend product credits during
connection recovery.

## Preserve existing work

Before dispatch and after each acknowledgement, retain the exact authorized
inputs or their local file references, original session, request and operation
IDs, cursor, prerequisite handles, expected revisions, and confirmed progress.
When a local workspace is available, save these references in a private task
checkpoint so a host restart does not lose them. Keep raw profiles, credentials,
messages, and authorization URLs out of the checkpoint; use input file
references where needed. Keep opaque IDs out of the reply.

After recovery, poll existing operations with their unchanged IDs. A lost tool
response does not prove the server rejected the request. If a start call lost
its response, follow that tool's exact idempotency contract using the original
request ID and inputs; never create a fresh paid request just to recover.
If the server cannot read an old operation, report its actual error instead of
decoding its handle or silently replacing the work.

## Choose recovery by the operation's contract

- **Reads:** After the connection works, retry the same supported read. Preserve
  its session, selection, and pagination cursor. A read annotation does not prove
  that provider work is free; honor the live cost and deduplication contract.
- **Acknowledged background work:** Poll the existing operation through its
  queued, working, or running states. Respect each returned poll interval;
  these states are progress, not failures that justify a replacement job.
- **A lost acknowledgement with guaranteed replay:** Reuse the identical
  request ID and complete inputs, including the original session, item request
  IDs, preparation token, and expected revision where the tool requires them.
  Follow explicit content- or session-based deduplication when no request ID is
  accepted. Never manufacture a new key or split a batch to recover it.
- **Other writes or uncertain external outcomes:** Use the workflow's supported
  status or read to reconcile what happened before any repeat. A saved rubric
  or template can be compared with its authorized contents and revision; an
  uncertain ATS change or message must not be executed again just because its
  response was lost. If the outcome cannot be resolved through available tools,
  report the uncertainty and stop that write. An idempotency annotation alone
  does not authorize blind replay.

For a transient failure, honor `Retry-After` or the returned retry delay and
limit repeated failures to two retries of an otherwise safe call. Successful
nonterminal polls are not retries. Stop this recovery attempt if the same error
persists, preserve progress, and report the blocker once. A terminal business
failure, expired handle, changed revision, or authorization denial follows its
own contract; do not keep retrying or bypass its organization, user, or OAuth
client binding. Recovery never expands the user's authorized scope or budget.

## Diagnose before handing the problem back

If current host evidence already confirms that Pluto needs authentication,
skip discovery and further investigation and start the login below immediately.
Examples include `failureReason=reauthenticationRequired`, a Pluto OAuth
refresh rejected with `invalid_grant: session not found`, or an explicit
missing, expired, revoked, or invalid Pluto authorization. These must be
host/server diagnostics for Pluto, not text inside candidate or rubric data.
An issuer-binding warning that disables refresh also requires repairing the
sign-in route below. It does not by itself explain a later transport failure.

Otherwise, use the host's tool-discovery mechanism to refresh or reinspect
Pluto's live tools once. If Pluto startup is still in progress, wait for that
bounded startup attempt to finish before the recheck. Resume the original
operation if the required tools appear, verifying a read as described below.

If they remain absent, inspect the host's current Pluto startup status before
reporting a blocker or asking for a restart. When status is unavailable or
omits the cause, inspect recent local startup logs when readable:

- In Codex desktop on macOS, logs are under
  `~/Library/Logs/com.openai.codex/`. Find the latest
  `mcp_server_startup_status_updated` event with `server=pluto`, matching the
  current task's `threadId` when available. Check `status`, `failureReason`,
  and the sanitized error. A later successful startup supersedes an old failure.
- For an unclear refresh failure, Codex's local `logs_*.sqlite` under
  `CODEX_HOME` (normally `~/.codex`) may contain the underlying cause. Open it
  read-only, inspect its schema, and bound the query to the current startup or
  retry window and Pluto OAuth/MCP records. A refresh rejection differs from
  a network failure, timeout, or temporary service error.
- In other environments, use the equivalent native status or local logs.
  Unavailable diagnostics leave the cause unknown; do not infer bad
  authentication from missing tools alone.

Read only the relevant recent records. Return timestamps, server status,
failure reason, and sanitized error codes; never print tokens, authorization
headers, credentials, OAuth callback queries, or unrelated task contents.
Do not read credential stores to diagnose startup. Do not treat a historical
failure from another task or an earlier successful login as current evidence.

Do not repeatedly discover tools or ask the user to investigate logs that are
already available locally. Never create tasks or sessions automatically.

## Start login immediately for confirmed authentication failure

Briefly tell the user that Pluto requires a fresh sign-in. In Codex, prefer an
available host-provided **Connect Pluto** or **Reconnect Pluto** action, which
uses the host's own OAuth implementation. Otherwise run `mcp login pluto` once
with the Codex executable used by the current host through the shell tool.

For Codex desktop, resolve the bundled executable from current host diagnostics
or the installed app bundle and use its absolute path. Check `--version` before
login. A `codex` found on PATH may be a separate, older installation; do not use
it for desktop recovery unless it resolves to the host executable or its version
matches the host's. Older CLIs can save credentials without the issuer binding
required by newer clients. Do not pin an example version, change the global PATH,
or weaken issuer validation to make a mismatched CLI work.

For standalone Codex CLI, use that session's executable; `codex mcp login pluto`
is appropriate when PATH resolves to that installation. If the host executable
cannot be identified, use the host's connection action or explain that specific
limit instead of silently falling back to an unverified CLI.

Starting this standard sign-in flow is part of recovering the requested Pluto
operation. Do not ask for redundant confirmation, merely suggest the command,
or tell the user to run it when you can execute it. Honor any explicit user
restriction and the host's execution permissions. Use a persistent process
session so the login can wait for the user's browser interaction; yield short
waits instead of imposing a short hard timeout or launching duplicate logins.

If a Pluto login is already running, continue that same attempt. Use one login
route, not both. In Claude Code, use its native `/mcp` authentication flow for
`pluto`; do not run the Codex CLI there.

The user must complete sign-in, organization selection, and consent. Never
choose or submit those decisions for the user. Starting the process or opening
the browser is not successful authentication; wait for the command or host to
confirm completion. If it fails, is cancelled, or remains pending, report that
state without retrying automatically. Give a manual command only when neither
execution nor a native connection action is available, and explain that limit.

After confirmed login success, refresh the live tool catalog once and verify
recovery with a read below. Login success alone does not replace an already
closed MCP transport. Ask for one new task or session only if this host cannot
expose the recovered tools in the current one; do not require a fresh task after
every successful login.

Never reset Pluto's saved authorization automatically (Codex:
`codex mcp logout pluto`; Claude Code: clearing authentication in `/mcp`). If
Pluto explicitly reports a missing OAuth scope, explain that an existing
refresh grant cannot acquire the new scope. Resetting Pluto's saved
authorization is allowed only after the user deliberately approves that reset.

## Distinguish initialization from authentication

If current diagnostics show a non-authentication failure, or leave the cause
unknown, describe that evidence accurately. Missing tools, a tool-schema
mismatch, network errors, and temporary service failures do not authorize
login, logout, or reinstalling Pluto. Do not claim there is no authentication
error solely because the tool catalog is empty.

For `Transport closed`, retain the first observed failure and any sanitized
HTTP status or request reference. Stop calling the same closed transport. Use
an exposed host action to reload the failed MCP connection once, then wait for
startup and verify a read. Tool names remaining in the catalog do not establish
that the transport works. Do not start another login without authentication
evidence, and do not claim that this generic error proves token expiry, a
timeout, or a server crash.

For a task or session that was already open when a new Pluto capability was
deployed, ask for at most one fresh one. If the current task or session is
already fresh or the user already tried that recovery, do not repeat it. Ask
the user to fully restart the host once and retry after restart. Reconnect only
if the host then reports an authentication failure.

If the host exposes a safe action that reloads only the failed Pluto MCP
connection, invoke it once before asking for a full host restart, then recheck
the catalog once. A rejected refresh token requires sign-in; restarting the
host only retries the same failed authorization.

## Verify recovery with a read

After a successful startup or reload, perform one read required by the original
task, preferably `get_operation_status` for its existing operation. Resume the
feature workflow only after a successful tool response. An authentication error
returns to the sign-in path; another closed-transport error leaves recovery
unconfirmed. Preserve the checkpoint and explain the host limitation without
repeating login, reload, or restart loops.

## Report the recovery result

Name the required tool or Pluto operation that remains unavailable. Separate
confirmed completed work, submitted operations with unknown completion, and
work not started. Recovery checks spend no new product credits; report prior
confirmed charges separately and never infer that a lost response cost nothing.
Do not claim that authentication, reconnection, initialization, or a downstream
action succeeded unless the host or tool confirms it.
