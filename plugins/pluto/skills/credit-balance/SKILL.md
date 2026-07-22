---
name: credit-balance
description: Use when a user asks Pluto about their monthly credit allowance, remaining credits, current credit balance, or reset date. Calls get_credit_balance once and reports the exact authenticated-user balance.
---

# Credit balance

Use this skill whenever a user asks how many Pluto credits they receive, how
many credits remain, or when those credits reset. Report only the balance
returned for the authenticated user.

## Confirm Pluto is available

Before promising or attempting a balance lookup, confirm that the current task
exposes Pluto's `get_credit_balance` MCP tool. Loading this skill alone does not
prove that Pluto initialized successfully.

If the tool is absent, do not call the MCP endpoint directly, infer a balance
from prior searches, or imply that a lookup ran. Report the applicable state and
recovery step concisely:

- If Codex requests authentication or reports Pluto as disconnected, say that
  Pluto authentication is required. Ask the user to connect Pluto, fully restart
  the desktop app, and start a new task.
- If Pluto reports an initialization error, say that Pluto failed to initialize.
  Ask the user to restart Codex after installation or upgrade and start a new
  task. Reconnect only when Codex reports that the saved authorization is
  missing, expired, revoked, invalid, or no longer authorized.
- If Pluto is connected and otherwise healthy but does not expose
  `get_credit_balance`, say that credit balance is unavailable in the current
  Pluto version. Ask the user to update Pluto, fully restart the desktop app,
  and start a new task. Do not misreport this version mismatch as an
  authentication failure.
- If Pluto was just installed or upgraded and no explicit error is available,
  ask the user to fully restart the desktop app or start a fresh task before
  diagnosing credentials.

Never run `codex mcp logout pluto` automatically. A logout/login reset is a
user-directed last resort for genuinely invalid credentials, not a normal
startup step.

## Read the balance once

Call `get_credit_balance` exactly once for each user request. Pass no arguments,
including no user, organization, account, or credential identifiers. Pluto
resolves the balance from the authenticated MCP session.

Do not retry the call, call another tool to reconstruct the balance, or estimate
credits from prior searches, provider pricing, or elapsed time. If the tool
fails or omits a required field, say that the exact balance is unavailable; do
not substitute a guessed value. If the single call reports an authentication,
disconnection, or initialization problem, follow the recovery guidance above
without retrying it.

## Report the exact balance

Use the response's exact `monthlyCredits`, `remainingCredits`, and `resetsAt`
values. State them plainly, for example: "You have 800 of 1,000 monthly credits
remaining. They reset at 2026-08-01T00:00:00.000Z."

Do not calculate a different reset date, round or adjust either credit value, or
claim that the balance is current after a failed call. Never expose user IDs,
organization IDs, OAuth client IDs, access tokens, or raw authentication
metadata in the response.
