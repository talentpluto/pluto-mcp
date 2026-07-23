# Pluto

Pluto connects Codex to TalentPluto. Install it once, sign in, and ask for
recruiting help in plain English.

## Before you start

You need:

- Codex desktop or the Codex CLI
- A TalentPluto account whose organization has Pluto access

## Install

### Codex desktop

1. Open **Plugins** in Codex.
2. Add the marketplace `talentpluto/pluto-mcp`.
3. Install **Pluto** and complete the TalentPluto sign-in.
4. Fully quit and reopen Codex, then start a new task.

### Codex CLI

Run:

```bash
codex plugin marketplace add talentpluto/pluto-mcp
codex plugin add pluto@talentpluto
codex mcp login pluto
```

Then start a new Codex session.

## Try it

```text
@pluto Find AI engineers with 1+ years of professional experience in New York.
```

```text
@pluto How many credits does my organization have left?
```

After Pluto returns candidates, you can select one and ask:

```text
@pluto Get the available professional email for this out-of-network candidate.
```

```text
@pluto Express interest in this in-network candidate for the Senior Engineer role.
```

## What Pluto can do

| Ask Pluto to | MCP tool |
| --- | --- |
| Find and assess candidates | `discover_candidates` |
| Check the shared organization credit balance | `get_credit_balance` |
| Get the professional email for a selected out-of-network candidate | `enrich_candidate_email` |
| Add a selected in-network candidate to a role's prospecting flow | `express_candidate_interest` |

Pluto's live MCP tool descriptions and input schemas are the source of truth.

## What to know

- Every candidate search targets 25 distinct people: up to 15 in-network
  candidates, followed by out-of-network profiles for the remaining slots.
  A search can return fewer people when matches or credits are limited.
- Each returned in-network candidate uses one shared organization credit.
  Out-of-network search results are free.
- An out-of-network email lookup uses one credit only when an email is safely
  stored and returned. Pluto does not send outreach.
- Expressing interest in an in-network candidate can update the TalentPluto
  pipeline and send the normal reconfirm-interest message.
- Pluto takes an outbound action only after you explicitly select a candidate
  and ask for that action.
- Candidate searches may use public professional criteria. Pluto rejects
  sensitive or private criteria such as demographics, compensation, work
  authorization, relocation intent, availability, work-style preferences, and
  private notes or resumes.

## If Pluto is not available

1. Pluto rechecks its live tool catalog once before asking you to recover
   anything.
2. If a tool is missing from a task that predates a server update, start one new
   task. Do not keep creating tasks if the new one has the same problem.
3. If Codex explicitly asks you to sign in, use **Connect Pluto** in Codex
   Desktop. The CLI fallback is `codex mcp login pluto`.
4. If a fresh task still has no Pluto tools and Codex shows no authentication
   error, fully restart Codex once. Do not reconnect or clear authorization for
   an initialization failure.

Normal server updates do not require reinstalling Pluto or signing in again.

## For maintainers

The connection is defined in `plugins/pluto/.mcp.json`; bundled guidance lives
in `plugins/pluto/skills`. Keep the `pluto` server name, URL, OAuth resource,
scopes, compatibility headers, and install-time authentication policy stable.
Ship routine capabilities from the TalentPluto MCP server, and update the
plugin version only when bundled plugin guidance changes.
