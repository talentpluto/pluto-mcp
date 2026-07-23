---
name: connection-recovery
description: Use when a required Pluto MCP tool is missing or unavailable, Pluto is disconnected or needs authentication, or Pluto failed to initialize. Rechecks the live tool catalog once, launches host-native Pluto connection only for a confirmed authentication failure, and prevents repeated fresh-task or logout loops.
---

# Pluto connection recovery

Use this shared skill after a Pluto feature skill identifies that its required
tool is absent or unusable. Preserve the user's original operation and return
to the feature skill if recovery makes the tool available.

Do not replace Pluto with another recruiting source, call the MCP endpoint
directly, claim that an operation ran, or spend product credits during
connection recovery.

## Recheck the live catalog once

When Codex has not reported a specific authentication or initialization error,
use the host's tool-discovery mechanism to refresh or reinspect Pluto's live
tools once. If the host reports that Pluto startup is still in progress, wait
for that bounded startup attempt to finish before the recheck.

If the required tool appears, resume the original feature skill and perform the
user's operation normally. If it remains absent, stop rechecking. Never loop on
tool discovery, create tasks automatically, or repeatedly tell the user to
start another fresh task.

## Launch connection only for a confirmed authentication failure

A missing tool by itself is not evidence that OAuth is invalid. Treat the
problem as authentication only when Codex or Pluto explicitly reports that
Pluto needs authentication, is disconnected, or has a saved authorization that
is missing, expired, revoked, invalid, or no longer authorized.

For a confirmed authentication failure, invoke Codex's host-provided
**Connect Pluto** or **Reconnect Pluto** action once when it is available. This
may open the user-visible TalentPluto OAuth flow; the user must complete sign-in,
organization selection, and consent. Never choose or submit those decisions for
the user.

If the host does not expose a native connection action, give the exact CLI
fallback `codex mcp login pluto`. Do not execute the CLI login silently. After
connection succeeds, ask for one new task so it receives Pluto's live tool
catalog.

Never run `codex mcp logout pluto` automatically. If Pluto explicitly reports a
missing OAuth scope, explain that an existing refresh grant cannot acquire the
new scope. Resetting Pluto's saved authorization is allowed only after the user
deliberately approves that reset.

## Distinguish initialization from authentication

If no explicit authentication error exists after the single catalog recheck,
describe the problem as Pluto initialization or tool availability, not as
expired authentication.

For a task that was already open when a new Pluto capability was deployed, ask
for at most one fresh task. If the current task is already fresh or the user
already tried that recovery, do not repeat it. Ask the user to fully restart
Codex once and retry after restart. Reconnect only if Codex then reports an
authentication failure.

If the host exposes a safe action that reloads only the failed Pluto MCP
connection, invoke it once before asking for a full Codex restart, then perform
the single catalog recheck above.

## Report the recovery result

Name the required tool or Pluto operation that remains unavailable. State
whether no search, balance lookup, enrichment, or interest action ran, and
state that no credits were used when the blocked operation could have consumed
credits. Do not claim that authentication, reconnection, initialization, or a
downstream action succeeded unless the host or tool confirms it.
