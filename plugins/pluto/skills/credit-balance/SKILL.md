---
name: credit-balance
description: Use when a user asks Pluto about their organization's shared monthly credit allowance, remaining credits, current credit balance, or reset date. Calls get_credit_balance once and reports the exact authenticated-organization balance.
---

# Credit balance

Use this skill whenever a user asks how many Pluto credits they receive, how
many credits remain, or when those credits reset. Report only the balance
returned for the organization selected by the authenticated Pluto session.

## Confirm Pluto is available

Before promising or attempting a balance lookup, confirm that the current host
context exposes Pluto's `get_credit_balance` MCP tool. Loading this skill alone
does not prove that Pluto initialized successfully.

If the tool is absent, do not call the MCP endpoint directly, infer a balance
from prior searches, or imply that a lookup ran. Follow the
`connection-recovery` skill for `get_credit_balance`. If recovery exposes the
tool, continue this skill and read the balance once. Otherwise report that no
balance lookup ran and do not substitute a prior or estimated value.

## Read the balance once

Call `get_credit_balance` exactly once for each user request. Pass no arguments,
including no user, organization, account, or credential identifiers. Pluto
resolves the shared organization balance from the authenticated MCP session.

Do not retry the call, call another tool to reconstruct the balance, or estimate
credits from prior searches, provider pricing, or elapsed time. If the tool
fails or omits a required field, say that the exact balance is unavailable; do
not substitute a guessed value. If the single call reports an authentication,
disconnection, or initialization problem, follow the recovery guidance above
without retrying it.

The current product contract is one shared allowance per organization for each
UTC calendar month, with no rollover. Use the returned fields for the exact
current allowance, balance, and reset timestamp rather than calculating the
calendar boundary yourself.

## Report the exact balance

Use the response's exact `monthlyCredits`, `remainingCredits`, and `resetsAt`
values. State that the balance is shared by the organization, for example:
"Your organization has 4,800 of 5,000 monthly credits remaining. They reset at
2026-08-01T00:00:00.000Z."

Do not calculate a different reset date, round or adjust either credit value, or
claim that the balance is current after a failed call. Do not attribute the
shared balance to one user or infer rollover behavior from prior months. Never
expose user IDs, organization IDs, OAuth client IDs, access tokens, or raw
authentication metadata in the response.
