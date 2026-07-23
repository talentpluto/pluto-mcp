# Pluto MCP

Pluto is a stable, authenticated connection between Codex and TalentPluto's
live recruiting workflows. Install it once, connect it once, and use the tools
that TalentPluto makes available through the connection.

## Install once

### Codex desktop

Add the `talentpluto/pluto-mcp` marketplace, install **Pluto**, and complete the
TalentPluto sign-in when prompted. After this initial installation, fully quit
and reopen Codex and start a new task.

### Codex CLI

Run these commands once:

```bash
codex plugin marketplace add talentpluto/pluto-mcp
codex plugin add pluto@talentpluto
codex mcp login pluto
```

Then start a new Codex session. The TalentPluto account used to sign in must
belong to an organization with Candidate MCP access enabled.

That is the complete normal setup. Pluto requests `candidates:read`,
`candidates:outbound`, and `offline_access`. The outbound permission is used
only after you explicitly select a discovered candidate and ask Pluto to act;
it does not authorize automatic candidate selection or an external-candidate
email campaign.
`offline_access` lets Codex refresh expired access tokens without asking you to
sign in again. Codex's default `auto` credential store uses the OS keyring when
available and otherwise falls back to its persistent credential file; no
credential-store setting is normally needed.

## Updates do not require reconnecting

Normal Pluto features, fixes, and tool updates are delivered by the live
TalentPluto MCP server. They do not require users to upgrade or reinstall the
plugin, log out, or repeat OAuth consent.

A versioned change to Pluto's bundled client guidance is the narrow exception:
the server cannot replace a skill already installed on the user's machine.
Pluto 0.1.10 coordinates the shared-credit, four-group discovery, and dedicated
email-enrichment contract; Pluto 0.1.9 introduced open-world discovery. These
skill updates require the one-time plugin refreshes below, but they do not
change the connection or permission boundary.

Keep using Pluto normally after an update. A task that was already open may
retain its original tool catalog; if a newly deployed capability is not visible,
start a fresh task. Restart Codex only when Codex reports an initialization or
cache problem. Reconnect only when Codex explicitly reports that Pluto's saved
authorization is missing, expired, revoked, invalid, or lacks a newly required
permission.

### One-time billing and enrichment skill refresh from 0.1.9 or earlier

Pluto 0.1.10 supplies a UUID for each metered search, reads the server's shared
organization credit accounting, renders the four discovery result groups
separately, and uses `enrich_candidate_email` for an explicitly selected
out-of-network candidate. Refresh the TalentPluto marketplace, install the new
Pluto plugin, and start a fresh task so Codex loads the coordinated skill and
live tool catalog.

In Codex desktop, refresh the `talentpluto/pluto-mcp` marketplace and install or
update **Pluto**, then start a fresh task. For the CLI, run:

```bash
codex plugin marketplace upgrade talentpluto
codex plugin add pluto@talentpluto
```

Do not log out, reconnect, or repeat OAuth consent for this update. Pluto 0.1.10
keeps the existing `candidates:read`, `candidates:outbound`, and
`offline_access` scopes. Users upgrading from 0.1.8 or earlier receive the
0.1.9 open-world discovery guidance in the same plugin update.

### One-time discovery skill refresh from 0.1.8 or earlier

Pluto 0.1.9 replaces the fixed-filter discovery skill with the open-world
`discover_candidates` contract. Refresh the TalentPluto marketplace, install
the new Pluto plugin, and start a fresh task so Codex loads the new skill.

In Codex desktop, refresh the `talentpluto/pluto-mcp` marketplace and install or
update **Pluto**, then start a fresh task. For the CLI, run:

```bash
codex plugin marketplace upgrade talentpluto
codex plugin add pluto@talentpluto
```

Then start a new Codex session. Do not log out, reconnect, or repeat OAuth
consent for this discovery update. Pluto 0.1.9 keeps the existing
`candidates:read`, `candidates:outbound`, and `offline_access` scopes; discovery
continues to use `candidates:read`.

Users upgrading from 0.1.6 or earlier must also follow the separate outbound
permission migration below if they will use candidate interest. That pre-existing
scope addition, not the discovery-contract update, requires a user-directed
reconnect.

### One-time migration from 0.1.6 or earlier

Pluto 0.1.7 adds the `candidates:outbound` permission. An existing dynamic
client, consent, access token, or refresh token cannot gain that scope through
an ordinary refresh. After upgrading and reinstalling Pluto, make this one-time,
user-directed reconnect, approve the new permission, then fully restart Codex
and start a new task:

```bash
codex plugin marketplace upgrade talentpluto
codex plugin add pluto@talentpluto
codex mcp logout pluto
codex mcp login pluto
```

Do not automate the logout. It is required here only because the user must
explicitly approve the newly added permission.

## Use

The examples below show Pluto's initial workflows, not a fixed catalog. Pluto's
live tool descriptions and input schemas define the capabilities available in a
new task.

### Discover candidates

```text
@pluto Find AI engineers with 1+ years of professional experience in New York.
```

Pluto also preserves novel professional criteria and Boolean grouping:

```text
@pluto Find either (platform engineers in NYC who use Kafka) or (SREs in Chicago who hold CKA certification), excluding current Acme employees.
```

Pluto supplies a fresh private request ID for each deliberate search, reports
the exact organization credits used and remaining, and preserves the order of
each server-owned result group. Rich in-network results are presented in three
separate evidence-qualified sections:

```markdown
2 credits used · 4,998 organization credits remaining
3 in network · 1 out of network · 1 network status unavailable

### Verified in-network matches

| Candidate | Match | Current role | Location | Why this person | Evidence gaps |
| --- | --- | --- | --- | --- | --- |
| [Alex Rivera](returned-profile-url) | Verified match | Account Executive at Example Co. | New York | Returned evidence verifies eight years of enterprise sales experience. | None |

### In-network candidates needing verification

| Candidate | Match | Current role | Location | Why this person | Evidence gaps |
| --- | --- | --- | --- | --- | --- |
| [Jordan Lee](returned-profile-url) | Needs verification | Account Executive at Sample Co. | New York | Returned evidence verifies the current role and location. | Unknown: minimum sales experience |

### In-network near matches

| Candidate | Match | Current role | Location | Why this person | Evidence gaps |
| --- | --- | --- | --- | --- | --- |
| [Casey Morgan](returned-profile-url) | Near match | Sales Manager at Demo Co. | New York | Returned evidence verifies enterprise sales context. | Does not match: requested Account Executive title |

### Out-of-network profiles

| Candidate | Network | Current role | Location | Headline |
| --- | --- | --- | --- | --- |
| [Morgan Chen](returned-profile-url) | Out of network | Account Executive at Outside Co. | New York | Enterprise SaaS account executive |
| [Riley Singh](returned-profile-url) | Network status unavailable | Account Executive at Other Co. | New York | B2B sales professional |
```

Out-of-network profiles are compact public leads, not deeply verified matches.
They use no product credits and are not locally reranked or personalized.

### Check credits

```text
@pluto How many credits do I have left, and when do they reset?
```

### Act on a selected candidate

After choosing an in-network candidate for a role:

```text
@pluto Express interest in Alex Rivera from the Pluto results for the Senior Account Executive role.
```

After choosing an out-of-network candidate, do not select a role or project:

```text
@pluto Get the available professional email for Jordan Lee, the out-of-network candidate from my Pluto results.
```

Each in-network person returned by discovery uses one credit from the
organization's shared monthly allowance; out-of-network profiles are free.
Every successful search returns exact `creditsUsed` and `remainingCredits`.
The current allowance is 5,000 credits per organization per UTC calendar month,
shared by its authorized users, with no rollover. At a low or depleted balance,
Pluto limits billed in-network results while retaining available free
out-of-network profiles.
Credit-balance lookup calls `get_credit_balance` without a user or organization
ID and reports the exact shared `monthlyCredits`, `remainingCredits`, and
`resetsAt` values returned by Pluto. Pluto never reconstructs accounting from
result counts or provider pricing.

An outbound action runs only after the user explicitly selects a returned
candidate and asks Pluto to act. Selection alone is insufficient. For an
in-network candidate, `express_candidate_interest` can add or reuse the
candidate in the selected role's normal prospecting flow, send the normal
reconfirm-interest message, and mark them for automatic sharing after Ready to
Submit. For a selection from the compact out-of-network group,
`enrich_candidate_email` omits project selection, runs fresh professional
enrichment, commits the disclosure, and returns one stored email when
available. A stored and returned email uses one organization credit; an
unavailable result uses zero. It does not add the candidate to a role, create
or send an outreach campaign, start onboarding, contact the candidate, or
return phone numbers.

Pluto does not automatically retry an ambiguous search, interest action, or
email enrichment. Request IDs protect product-credit accounting for an
explicit retry of the identical metered operation; they do not authorize
automatic retries.

Pluto does not expose private notes, resumes, transcripts, account identifiers,
authentication metadata, raw provider data, or uncommitted contact results. Its
skills fail closed when their tools are unavailable and do not block unrelated
Codex tasks.

## If Pluto is unavailable

Use the first step that matches what Codex reports:

1. **Pluto was just installed:** fully quit and reopen Codex, then start a new
   task.
2. **A newly deployed capability is missing from an existing task:** start a
   fresh task. Do not reinstall or reconnect Pluto.
3. **Codex asks you to sign in or reconnect:** run `codex mcp login pluto`, then
   restart Codex and start a new task. Do not log out first.
4. **A tool remains absent in a fresh task while Pluto is connected:** report
   the unavailable tool or initialization error. Do not treat it as a plugin
   version or authentication problem without an explicit Codex error.
5. **Candidate interest reports a missing permission after upgrading from
   0.1.6 or earlier:** complete the one-time scope reconnect above. A refresh
   token cannot add `candidates:outbound` to the old grant.
6. **A normal login still fails because the saved grant is invalid or revoked:**
   reset only Pluto's saved authorization, then restart Codex and start a new
   task.

   ```bash
   codex mcp logout pluto
   codex mcp login pluto
   ```

Never automate logout during installation, startup, or an ordinary upgrade.
Only the explicit 0.1.7 scope migration above or a genuinely invalid saved grant
requires the user to remove Pluto's saved authorization.

## Maintainers

Pluto connects to `https://app.talentpluto.com/api/mcp` with OAuth. This
repository contains no credentials or API keys. Keep the MCP server name, URL,
OAuth resource, scopes, and compatibility headers stable. Ship routine feature
work from the server; change the plugin connection only when the connector or
its permission boundary genuinely changes. When a server change deliberately
replaces bundled behavioral guidance, update the plugin skill and version
without changing the connector or forcing OAuth reconnection. Keep server tool
descriptions, schemas, side effects, costs, retry behavior, privacy boundaries,
and output semantics self-contained and backward compatible wherever possible.
