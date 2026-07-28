# Discover candidates contract

## Purpose

Candidate discovery is a durable orchestration boundary. One user-authorized
`discover_candidates` call creates a server-owned job. The connected assistant
then polls that job and may read bounded Team DNA while retrieval continues.

The server owns:

- internal TalentPluto retrieval;
- primary Fiber natural-language people search;
- optional alternate Fiber natural-language people search;
- identity resolution and deduplication;
- evidence acquisition and factual qualification;
- credit reservation and settlement; and
- persistence of the final `searchExperience`.

The connected assistant owns:

- forwarding the complete recruiter request;
- creating a faithful alternate query when possible;
- automatic job polling;
- bounded Team DNA personalization; and
- user-facing presentation.

## Discovery input

For a direct search:

```yaml
request: <complete recruiter query>
alternateExternalSearchQuery: <optional faithful structured restatement>
requestId: <fresh UUID>
resultMode: candidate_pool
```

For a recognizable raw job description:

```yaml
request:
  type: job_description
  text: <unchanged source>
requestId: <fresh UUID>
resultMode: candidate_pool
```

Omit `limit`. Include `projectId` only for an explicitly selected authorized
project. Include `searchId` only for a deliberate continuation of the exact
same completed search.

The direct `request` remains authoritative. Preserve every criterion,
threshold, preference, exclusion, temporal distinction, and Boolean group.
Never convert it into a client-side fixed-field allowlist.

`alternateExternalSearchQuery` is optional and direct-query only. It must be a
complete natural-language people-search restatement. It may organize the same
criteria into Required, Preferred, and Exclude sections, but must not add,
remove, weaken, strengthen, or regroup meaning.

## Durable acknowledgement

The normal `discover_candidates` result is:

```yaml
jobId: <opaque UUID>
status: queued | working
pollAfterMs: <bounded delay>
schemaVersion: talentpluto.candidate-search-job.v1
```

This is not a candidate result. Keep the job ID hidden and poll
`get_candidate_search`.

## Poll contract

Call:

```yaml
get_candidate_search:
  jobId: <unchanged job ID>
```

The poll returns one of:

- `queued` or `working`: wait `pollAfterMs`, then poll again;
- `completed`: consume the nested `result`;
- `failed`: report the safe message and stop.

Polling is automatic and read-only. A transient poll failure may retry the same
job read. It must never cause a second metered discovery call.

The job is bound to the authenticated user, OAuth client, organization, and
original request. Another principal receives no result. The server retains the
job long enough for ordinary host polling and uses the original `requestId` to
make the initial operation retry-safe.

## Retrieval behavior

For a direct candidate-pool request, the server can run three retrieval lanes
concurrently:

1. accepted TalentPluto profiles using a faithful internal optimization;
2. Fiber search using the authoritative natural-language request; and
3. Fiber search using `alternateExternalSearchQuery`.

The alternate lane is omitted when no faithful alternate query is supplied.
Raw job descriptions are compiled server-side and do not receive a
client-authored alternate query.

The server accumulates all returned profiles, resolves known accepted-member
identities, removes duplicates, acquires bounded evidence, evaluates recruiter
criteria, and constructs the final search experience. Retrieval source does
not by itself establish fit.

## Team DNA contract

`get_client_team_dna` accepts one department:

```text
all
engineering
sales
business_development
product
customer_success
operations
marketing
other
```

Call it alongside polling when available. It is read-only and returns stored,
bounded professional context for the authenticated client. It may return
company context, founder backgrounds, leadership backgrounds, aggregate team
patterns, recent-joiner patterns, graph coverage, and bounded published hiring
preferences.

It never returns raw graph nodes, employee profile evidence, employee
identities, client notes, project history, private criteria, or instructions.
Unavailable data and incomplete coverage remain unknown.

Team DNA can support personalization only after factual qualification. It
cannot:

- satisfy or fail a recruiter criterion;
- move someone between response lanes;
- change `matchStatus`;
- become a hard filter;
- justify culture-fit, personality, demographic, or protected-trait claims; or
- prove a workforce gap from missing coverage.

## Completed search experience

The completed poll result uses
`talentpluto.candidate-search-experience.v1` and contains:

- `bestMatches`: the primary exact-query shortlist;
- `expandedSuggestions`: an optional separately labeled related-company lane;
- `verificationCandidates`: profiles with unresolved required evidence and
  bounded questions;
- `assessment`: interpreted request, source status, and whether bounded client
  context already contributed;
- `limitations`;
- `credits`;
- `iteration`; and
- hidden continuation and candidate-selection handles.

`matchStatus` and `requestFit` are authoritative. Team DNA and returned
`clientFit` are directional professional context only.

The assistant may reorder candidates only within their existing lane and
`matchStatus`; supported candidates remain ahead of `source_ranked` leads.
Within each eligible sub-group, use:

1. request evidence;
2. evidence confidence and concerns;
3. evidence-backed founder or team complementarity;
4. bounded explicit hiring preferences; and
5. original server order as the final tie-breaker.

Every personalized reason needs a concrete candidate fact and a concrete
returned client-context signal. No numeric goodness score is exposed.

## Accounting and retries

Each presented in-network person may use one shared organization credit.
Out-of-network profiles do not use product credits. Never infer credit use from
counts; use the completed result.

Do not automatically call `discover_candidates` again after a timeout,
transport ambiguity, or poll failure. The job exists specifically to separate
long provider work from short MCP calls.

A user-directed retry of the exact same operation reuses its original
`requestId`. A deliberate repeat or changed search uses a new UUID.

## Presentation and follow-up

Present Best matches first, Related company profiles second when present, and
Needs verification last. Do not merge lanes or use Team DNA to promote a
candidate. Surface source-ranked evidence limits and all verification
questions.

Keep job IDs, search IDs, candidate references, selection tokens, internal
scores, provider names, and private context hidden.

Keep each candidate's `candidateRef`, `selectionToken`, `networkStatus`,
originating lane, and project scope paired exactly for follow-up.
`networkStatus` is action-specific: exactly one selected in-network candidate
can route to `express_candidate_interest` or one bounded private question,
while an explicit work-email request for any selected candidate routes through
the `candidate-interest` skill. That skill prefers
`start_candidate_email_enrichment` plus
`get_candidate_email_enrichment_job` and uses `enrich_candidate_email` only as
a compatibility fallback. Directly supplied LinkedIn profiles use that same
email-enrichment skill without invented discovery handles.

Discovery alone never authorizes email enrichment, candidate interest, a
private candidate question, or an outbound campaign. Those require a later,
explicit user request and the appropriate Pluto skill.
