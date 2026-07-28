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
target and approve switching to a direct brief. The server evaluates,
qualifies, and ranks the complete result, and Pluto presents every returned
search-experience lane without client-side reranking. Natural-language
employer clauses remain intact: the client does not choose a provider or
construct a company list, while the server selects the retrieval strategy and
applies the complete clause across its candidate sources.

When the authenticated client has a fresh precomputed company graph, the
server privately selects the role-relevant founder, leadership, and team
projection and combines it with explicit client preferences for ranking. The
graph is never sent by the connected agent, never changes factual
qualification, and never exposes employee identities or raw graph data.

For a privacy-thresholded US market view:

```text
@pluto Give me a directional US market snapshot for engineering talent.
```

```text
@pluto How many credits does my organization have left?
```

After Pluto returns candidates, you can select one or more and ask:

```text
@pluto Is this in-network candidate's recorded preference compatible with a $180,000 annual base salary?
```

```text
@pluto Get and verify the available professional emails for these three out-of-network candidates.
```

```text
@pluto Draft a complete three-email campaign for these out-of-network candidates, including the audience, timing, subject, and every message, then let me review it before creation.
```

```text
@pluto Express interest in this in-network candidate for the Senior Engineer role.
```

## What Pluto can do

| Ask Pluto to | MCP tool |
| --- | --- |
| Find and qualify candidates against professional criteria | `discover_candidates` |
| Read a privacy-thresholded US snapshot for one broad role family | `get_market_snapshot` |
| Check the shared organization credit balance | `get_credit_balance` |
| Ask one bounded private question about a selected in-network candidate | `answer_candidate_question` |
| Get and verify professional emails for 1–100 selected out-of-network candidates | `enrich_candidate_email` |
| Draft, review, and create one email campaign for 1–100 selected out-of-network candidates | `create_outbound_campaign` |
| Add a selected in-network candidate to a role's prospecting flow | `express_candidate_interest` |

Pluto's live MCP tool descriptions and input schemas are the source of truth.

## What to know

- Every search returns a server-owned search experience with up to 15 Best
  matches, up to five separately labeled related-company suggestions, and up
  to five candidates with specific verification questions. Pluto preserves
  every lane and candidate in returned order. A search can return fewer people
  when evidence, source coverage, or credits are limited.
- The server returns authoritative requested-criterion evidence for each card.
  Pluto never promotes an unresolved profile, reconstructs the criterion
  graph, or reranks the returned lanes.
- A related-company cohort changes one returned company criterion. Pluto keeps
  it outside Best matches and never implies that those profiles meet the
  original company requirement.
- Each presented in-network candidate uses one shared organization credit.
  Out-of-network search results are free.
- Market snapshots are read-only, use no shared candidate credits, and support
  one broad US role family at a time. Candidate-reported minimum compensation
  expectations and sales deal experience remain separate from client-entered
  role ranges; unavailable privacy-thresholded metrics are never estimated.
- A private candidate question is free and does not change candidate or
  pipeline records. Pluto answers only from the supported bounded catalog and
  never returns raw private values.
- One email-enrichment call accepts 1–100 explicitly selected out-of-network
  candidates and preserves their order. One new lookup that safely stores and
  returns one or more emails uses one credit for that candidate; reusing a
  successful enrichment handle uses zero new lookup credits. Each returned
  email includes a separate passed, failed, or unavailable verification
  outcome; a failed or unavailable check does not suppress the email. A
  successful result can continue into drafting or a campaign without another
  contact-lookup credit. Email enrichment does not create or send outreach.
- One outbound campaign accepts 1–100 explicitly selected out-of-network
  candidates from discovery or successful enrichment for one active role.
  Pluto drafts the complete audience, role, sequence, subject, and copy for
  review when details are missing, then creates exactly the latest reviewed
  campaign after explicit direction. Contact preparation can use up to one
  credit per candidate not already enriched.
- Expressing interest in an in-network candidate can update the TalentPluto
  pipeline and send the normal reconfirm-interest message.
- Pluto takes an outbound action only after you explicitly select the candidate
  or candidates and ask for that action.
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
- The server may use currently authorized candidate-published professional
  context to evaluate evidence, but the compact search experience does not
  return the raw context. Pluto uses only the bounded `requestFit` evidence and
  explanations returned for presentation.
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
