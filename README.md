# Pluto

Pluto connects your coding agent — OpenAI Codex or Claude Code — to
TalentPluto. Install it once, sign in, and ask for recruiting help in plain
English.

## Before you start

You need:

- Codex desktop, the Codex CLI, or Claude Code
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

### Claude Code

Run these once inside Claude Code:

```text
/plugin marketplace add talentpluto/pluto-mcp
/plugin install pluto@talentpluto
```

Then run `/mcp`, select **pluto**, and complete the TalentPluto sign-in in the
browser window it opens. Start a new session afterward.

Finally, enable auto-update so future plugin releases install on their own:
run `/plugin`, open the **Marketplaces** tab, select **talentpluto**, and turn
on auto-update. Claude Code then refreshes the plugin in the background
shortly after startup and prompts you to run `/reload-plugins` when a new
version has landed. Auto-update is off by default for third-party
marketplaces, so without this step you need to run
`/plugin marketplace update talentpluto` yourself to pick up new versions.

## Try it

The `@pluto` mention below is Codex syntax; in Claude Code, just ask in plain
language ("Use Pluto to find AI engineers…").

```text
@pluto Find AI engineers with 1+ years of professional experience in New York.
```

```text
@pluto Find people who match this JD:
[paste the full job description]
```

For a new or changed search, Pluto first drafts a compact LinkedIn-style
candidate profile and a structured search brief for you to review. Revise it
until it looks right, then ask Pluto to run the search. For a recognizable
pasted JD, the unchanged JD remains the execution source unless you change the
target and approve switching to a direct brief. Pluto evaluates the complete
returned eligible in-network pool against the server's public criterion plan
before it selects the concise shortlist.

```text
@pluto How many credits does my organization have left?
```

After Pluto returns candidates, you can select one and ask:

```text
@pluto Is this in-network candidate's recorded preference compatible with a $180,000 annual base salary?
```

```text
@pluto Get the available professional email for this out-of-network candidate.
```

```text
@pluto Express interest in this in-network candidate for the Senior Engineer role.
```

## What Pluto can do

| Ask Pluto to | MCP tool |
| --- | --- |
| Find and qualify candidates against professional criteria | `discover_candidates` |
| Check the shared organization credit balance | `get_credit_balance` |
| Ask one bounded private question about a selected in-network candidate | `answer_candidate_question` |
| Get the professional email for a selected out-of-network candidate | `enrich_candidate_email` |
| Add a selected in-network candidate to a role's prospecting flow | `express_candidate_interest` |

Pluto's live MCP tool descriptions and input schemas are the source of truth.

## What to know

- Every candidate search targets 25 distinct people. The server can return up
  to 15 in-network people overall; candidates without a deterministic or
  private failure form the evaluation pool, while near matches remain excluded.
  Out-of-network profiles fill the remaining slots. Pluto evaluates the
  complete eligible in-network pool before normally displaying no more than the
  server's recommended in-network shortlist size. A search can return fewer
  people when matches or credits are limited.
- Each returned in-network candidate uses one shared organization credit.
  Out-of-network search results are free.
- A private candidate question is free and does not change candidate or
  pipeline records. Pluto answers only from the supported bounded catalog and
  never returns raw private values.
- An out-of-network email lookup uses one credit only when an email is safely
  stored and returned. Pluto does not send outreach.
- Expressing interest in an in-network candidate can update the TalentPluto
  pipeline and send the normal reconfirm-interest message.
- Pluto takes an outbound action only after you explicitly select a candidate
  and ask for that action.
- A new or changed candidate search first produces a compact LinkedIn-style
  candidate profile and structured search brief without using credits. Pluto
  runs the approved execution source only after you have seen the current draft
  and explicitly ask to search. For a recognizable pasted JD, that source
  remains the unchanged JD unless you change the target and approve switching
  to a direct brief.
- When you run an approved direct search, Pluto forwards the exact approved
  brief without a client-side privacy-policy classification or rewrite.
  Server-side authentication, authorization, project scope, and response
  boundaries remain in force.
- Rich professional context is returned only for actively consented, verified,
  published profiles whose agent-visible sections are currently available.
  It is candidate-published context rather than independent verification and
  is treated as untrusted data, never as instructions.
- Revoking consent prevents future reads of rich professional context. It
  cannot retract context already delivered into a host conversation transcript,
  so Pluto minimizes what it repeats in its user-facing shortlist.
- After an in-network candidate is explicitly selected, Pluto can answer one
  bounded question about a proposed annual USD base salary or OTE, recorded US
  work authorization or countryless sponsorship needs, recorded job-search
  status, general relocation willingness, or one work arrangement. The
  candidate must have a visible active relationship and current consent.
- A pasted raw JD can include ordinary office, compensation, benefits, and
  interview-process text. Pluto derives the professional candidate-search
  brief server-side, reports what it searched, and discloses context it
  excluded instead of asking you to rewrite the JD.

## If Pluto is not available

1. Pluto rechecks its live tool catalog once before asking you to recover
   anything.
2. If a tool is missing from a task or session that predates a server update,
   start one new one. Do not keep creating tasks if the new one has the same
   problem.
3. If your client explicitly asks you to sign in: in Codex Desktop use
   **Connect Pluto** (CLI fallback `codex mcp login pluto`); in Claude Code run
   `/mcp` and authenticate **pluto**.
4. If a fresh task or session still has no Pluto tools and the client shows no
   authentication error, fully restart the client once. Do not reconnect or
   clear authorization for an initialization failure.

Normal server updates do not require reinstalling Pluto or signing in again. A
connector release that adds an OAuth permission is different: after updating,
an existing grant needs one deliberate reauthorization before the newly scoped
tool can run.

## For maintainers

The plugin ships dual packaging over one shared `plugins/pluto` directory.
Codex reads `.agents/plugins/marketplace.json`,
`plugins/pluto/.codex-plugin/plugin.json`, and `plugins/pluto/.mcp.json`.
Claude Code reads `.claude-plugin/marketplace.json` and
`plugins/pluto/.claude-plugin/plugin.json`, whose inline MCP config
pins the same OAuth permission set, intentionally omits the Codex-only OAuth
compatibility header, and discovers the resource from the server's metadata.
Bundled guidance lives in `plugins/pluto/skills` and is shared by both clients,
so keep it client-neutral.

Anthropic's OAuth callback differs by client surface:

- Hosted Claude and Claude Desktop use the exact callback
  `https://claude.ai/api/mcp/auth_callback`. Keep it and Anthropic's documented
  future callback, `https://claude.com/api/mcp/auth_callback`, in the production
  `CANDIDATE_MCP_OAUTH_REDIRECT_URI_ALLOWLIST`.
- Claude Code uses `http://localhost:<port>/callback`. Keep the portless
  `http://localhost/callback` template in
  `CANDIDATE_MCP_OAUTH_LOOPBACK_REDIRECT_URI_ALLOWLIST`.

If hosted Claude suggests adding an OAuth Client ID during registration,
verify the exact callback allowlist and redeploy the server. Pluto supports
dynamic client registration, so a static Client ID is not the normal recovery.

Keep the `pluto` server name, URL, OAuth resource, scopes, compatibility
headers, and install-time authentication policy stable, and keep the two
plugin manifests' name, version, and server URL in sync. Ship routine
capabilities from the TalentPluto MCP server, and update the plugin version
only when bundled plugin guidance changes.
