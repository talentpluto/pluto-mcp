# Discover candidates contract

Aligned to server contract `0.51.0`. When the live server reports a newer
version, behaviors here may be incomplete; prefer the live tool descriptions
and schema field descriptions on any conflict. Optional assessment fields
added after `0.43.0` may be absent on an older deployed server; treat every
rule about them as conditional on the field being returned.

## Purpose

Candidate discovery is a durable orchestration boundary. One user-authorized
recruiter request may require several short MCP calls. Each
`discover_candidates` call creates one server-owned durable job. The connected
assistant polls and pages that job, may read bounded Team DNA while retrieval
continues, and may start a bounded continuation job when an explicit numeric
target remains unmet and the server permits continuation.

The server owns:

- internal TalentPluto retrieval;
- structured company and people routing for the authoritative original request;
- optional external natural-language search for the alternate request only;
- current-employer safety filtering and canonical identity deduplication;
- credit reservation and settlement; and
- persistence of each completed `searchExperience` page.

The connected assistant owns:

- forwarding the complete recruiter request;
- creating a faithful alternate query when possible;
- automatic job polling and persisted-page traversal;
- bounded continuation across durable jobs for an unmet explicit target;
- comparison of the request with explicit returned candidate facts;
- bounded Team DNA personalization without factual qualification; and
- user-facing presentation.

`candidate_pool` deliberately skips network membership resolution,
private-project qualification, and server-side personalization. The server
does, however, run its own relevance judge over the merged roster: cards may
carry a `tier` (`strong` or `plausible`) with quotable `judgedEvidence`, and
`assessment.judged` reports how many leads each tier holds and how many were
rejected and removed before the response. The separate `qualified_matches`
compatibility mode retains the legacy server qualification path; new
connected clients use `candidate_pool`.

## Discovery input

For a direct search:

```yaml
request: <complete recruiter query>
alternateExternalSearchQuery: <optional faithful structured restatement>
requestId: <fresh UUID>
resultMode: candidate_pool
targetCount: <optional integer 5..1000 or all>
```

For a recognizable raw job description:

```yaml
request:
  type: job_description
  text: <unchanged source>
requestId: <fresh UUID>
resultMode: candidate_pool
targetCount: <optional integer 5..1000 or all>
```

For a lookalike search from one user-supplied LinkedIn profile ("find more
people like this person"):

```yaml
request:
  type: reference_profile
  linkedinUrl: <the supplied LinkedIn profile URL>
  notes: <optional extra criteria, at most 300 characters>
requestId: <fresh UUID>
resultMode: candidate_pool
targetCount: <optional integer 5..1000 or all>
```

A profile URL is valid only inside `reference_profile`; an ordinary string
request containing a URL is rejected. The server resolves the public profile,
derives a lookalike brief from its primary current role, employer peers, and
seniority, returns that brief as `searchInterpretation.request`, and excludes
the reference person from every result section. Present the returned brief so
the user can refine it; forward extra spoken criteria in `notes` unchanged.

Omit `limit`. Include `projectId` only for an explicitly selected authorized
project. Include `searchId` only for a deliberate continuation of the exact
same completed search.

Omit `targetCount` for the default target of one full page (100). Preserve an
explicit requested count from 5 through 1000. Use `all` only for an explicit
all/every/complete request or a requested count above 1000. The server then
continues until retrievable sources are exhausted or the current
1000-candidate safety ceiling is reached. A target is not a guarantee that
the real-world cohort is complete.

External profiles consume provider credits as they are retrieved. Completed
pages report concrete roster numbers in `assessment.roster` (people shown on
the page and the estimated external total when known); notices may restate
the estimate. Relay those numbers when the user weighs asking for more, and
never inflate a target beyond the user's stated volume.

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
targetCount: <normalized numeric target>
schemaVersion: talentpluto.candidate-search-job.v1
```

This is not a candidate result. Keep the job ID hidden and poll `get_job`,
the single poll tool for every asynchronous Pluto job; a candidate-search
response carries `jobType: candidate_search`.

## Poll contract

Call:

```yaml
get_job:
  jobId: <unchanged job ID>
  cursor: <omit for the first page; otherwise exact nextCursor>
```

The poll returns one of:

- `queued` or `working`: read optional checkpoint `progress`, wait
  `pollAfterMs`, then poll again;
- `completed`: consume the nested `result` page and its `pageInfo`;
- `failed`: report the safe message and stop.

Polling is automatic and read-only. A transient poll failure may retry the same
job read. It must never cause a second metered discovery call.

For a completed job, `pageInfo.hasMore` means another persisted page exists.
Pass `pageInfo.nextCursor` unchanged with the same `jobId` until `hasMore` is
false. These reads do not rerun retrieval or consume more credits. Accumulate
distinct candidates without changing their returned section, order,
`matchStatus`, or opaque selection handles.

`pageInfo.completionReason` is `target_reached`, `source_exhausted`,
`safety_limit`, or `partial_failure`. A partial failure is terminal but retains
every page checkpointed before the later failure.

The job is bound to the authenticated user, OAuth client, organization, and
original request. Another principal receives no result. The server retains the
job long enough for ordinary host polling and uses the original `requestId` to
make the initial operation retry-safe.

## Client call state machine

Treat polling, paging, and continuation as separate loops:

```text
discover_candidates
  -> queued or working: get_job(jobId) until terminal
  -> completed: get_job(jobId, nextCursor) until hasMore=false
  -> explicit target still unmet and canContinue=true:
       discover_candidates(searchId, fresh requestId, remaining target)
       then repeat the poll and page loops
  -> otherwise: present accumulated candidates
```

Polling and paging are read-only and automatic. A clear candidate-search
request authorizes those calls without another user message. A continuation
job may consume credits, so it is authorized automatically only to fulfill the
user's original explicit numeric target.

Track the numeric target across jobs. For a continuation, preserve the exact
original request, alternate query, project, and result mode; pass the prior
hidden `searchId`; generate a fresh `requestId`; and set `targetCount` to the
remaining count when it is at most 1000 or `all` when more than 1000 remain.

Accumulate only distinct candidates, preferring hidden `candidateRef` for
identity and normalized `profileUrl` as fallback. Preserve the returned
section, order, `matchStatus`, and selection handles. Sum `credits.used` across
jobs and use the last completed job's `credits.remaining`.

Stop when the target is reached, continuation is unavailable, the source is
exhausted, a continuation adds no distinct candidate, a job fails or partially
fails, or the live contract rejects continuation. A safety limit is terminal
unless the original request was an explicit numeric target above 1000 and
`iteration.canContinue` remains true. Never automatically continue a
default-volume search or push an explicit `all` request past the server's
reported safety ceiling.

## Retrieval behavior

For a direct candidate-pool request, the server can run three retrieval lanes
concurrently:

1. accepted TalentPluto profiles using a faithful internal optimization;
2. structured company and people search routed from the authoritative original
   request; and
3. external natural-language search using `alternateExternalSearchQuery`.

The alternate lane is omitted when no faithful alternate query is supplied.
Raw job descriptions are compiled server-side and do not receive a
client-authored alternate query. Reference profiles are likewise resolved
server-side into a lookalike brief — the person's primary role at companies
similar to their employer, at a similar seniority — and do not receive a
client-authored alternate query; the reference person is excluded from
results.

The structured route may also decompose the request into labeled secondary
sub-searches (reported in `assessment.searchLanes` and on cards as
`searchLane`), resolve request-named cohorts and request-named people through
dedicated lanes, retrieve named-employer searches from more than one
independent data source (reported in `assessment.coverage`), and run one
automatic broadened follow-up search when the first retrieval pass
under-delivers. Stated criteria that no filter, lane, or exclusion can
express come back in `assessment.unenforcedRequestCriteria` instead of being
silently dropped. The server never fetches URLs contained in a request.

The server accumulates the returned profiles, applies current-employer safety
filtering, removes canonical identity duplicates, judges the merged roster
against the request, and persists the result without resolving network
membership or applying private client personalization. Retrieval source and
source rank do not establish factual fit; the judged tier and its quoted
evidence are the server's relevance signal.

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

Team DNA can support a client-specific explanation of a retrieved lead. It
cannot:

- satisfy or fail a recruiter criterion;
- move someone between response sections;
- change `matchStatus`;
- become a hard filter;
- establish a candidate fact that the returned profile does not contain;
- justify culture-fit, personality, demographic, or protected-trait claims; or
- prove a workforce gap from missing coverage.

## Team connection lookups

Discovery does not call `find_team_connection`. Each call can trigger one
live public-profile lookup, so per-result team-connection annotation is
excluded from the search flow; a later explicit user request about one
supplied candidate profile URL routes through the `team-connection` skill.

## Completed search experience

The completed poll result uses
`talentpluto.candidate-search-experience.v1` and contains:

- `bestMatches`: the candidate-pool leads, strong tier first when judged;
  cards may carry `tier`, `judgedEvidence`, `searchLane`, and
  `crossVerified`;
- `alternateQueryMatches`: a separate bounded cohort found only by the
  faithful alternate phrasing, with its query text;
- `expandedSuggestions`: a compatibility section for separately labeled
  related-company leads when returned;
- `verificationCandidates`: a compatibility section for bounded verification
  questions when returned;
- `assessment`: interpreted request, source status, whether bounded client
  context contributed, and the honesty channel — `roster` (shown and
  estimated external total), `judged` (strong, plausible, rejected),
  `coverage` (crossVerified and independentlyAdded), `searchLanes`,
  `unenforcedRequestCriteria`, and, when returned, `feasibility` (pre-flight
  matching count with `basis` exact or estimate and an optional
  `limitingConstraint`), `searchStrategy` (bounded automatic self-correction
  rounds), and `disambiguation` (same-name company clarification);
- `limitations`;
- `credits`;
- `iteration`; and
- hidden continuation and candidate-selection handles.

In `candidate_pool`, expect `matchStatus: source_ranked` and do not treat a
missing or unknown `requestFit` entry as satisfied. When cards carry `tier`,
present the roster in returned order (strong first), cite `judgedEvidence`,
state the `judged.rejected` count once, and treat `basis: unverifiable`
evidence as a screening question. A `plausible` tier is not a verified match,
and a missing `crossVerified` flag means single-source, never unverified. The
assistant otherwise compares the request only with explicit returned public
professional fields. Team DNA and returned client-context fields are
directional professional context only.

Preserve the server order. Every personalized reason needs a concrete returned
candidate fact and a concrete returned client-context signal. If either side
is missing, omit the personalized connection. Do not expose a numeric goodness
score.

## Accounting and retries

Never infer credit use from candidate counts or source membership; use the
completed result's accounting fields.

Do not start a replacement `discover_candidates` job after a timeout,
transport ambiguity, or poll failure. Retry the same read-only job poll when
appropriate. The job exists specifically to separate long provider work from
short MCP calls.

A user-directed retry of the exact same operation reuses its original
`requestId`. A continuation, deliberate repeat, or changed search uses a new
UUID. A continuation must also carry the prior `searchId`.

## Presentation and follow-up

Present Best matches in returned order, capped at the user's explicit requested
count. When `assessment.judged` is present, state the rejected count once and
cite tiers and `judgedEvidence` instead of the source-ranked caveat; when it
is absent, describe the cohort as source-ranked leads rather than verified
matches. Disclose `assessment.coverage`, `assessment.searchLanes`,
`assessment.unenforcedRequestCriteria`, and the `assessment.roster` follow-up
numbers once each when present, and render `alternateQueryMatches` as its own
section introduced by its returned query text. For a request of 1–4 candidates, the server target is normalized to
five but the assistant displays only the original requested count. When no
numeric count was requested or the user explicitly requested all results,
present every returned profile. Use only explicit candidate fields and
supported Team DNA connections in the explanation. Present Related company
profiles and Needs verification separately if those compatibility sections are
populated. Surface the source-ranked evidence limitation once and include all
returned verification questions.

When `assessment.feasibility` is returned, set expectations once:
`estimatedMatching` is how many public profiles matched every stated
criterion in a pre-flight count — an exact index count when `basis` is
`exact`, otherwise an estimate — and `limitingConstraint` names the hardest
stated requirement when identified. A small exact count above a full roster
means the stated world is small, not that the search failed. When
`assessment.searchStrategy` is returned, mention at most once that the
search corrected itself automatically, using only the returned round fields;
its absence means the first plan needed no correction.

When `assessment.disambiguation` is returned, two or more companies share
the exact requested name and nothing in the request says which one is meant.
External retrieval was skipped instead of guessing. Present each returned
company option — name, domain, headcount range, and industries — ask the
user which company they meant, and then issue a new search (a fresh request
without `searchId`) whose request text includes the chosen company's website
domain. Never pick silently and never present that response as an empty or
failed result.

Keep job IDs, search IDs, candidate references, selection tokens, internal
scores, provider names, private context, `networkStatus`, and source membership
hidden. Never describe candidates as in-network or out-of-network, refer to a
Pluto network, or split the response by source membership.

Never mention an external data provider or vendor by name in the user-facing
answer, evidence rationale, limitation, or source description.

Keep each candidate's `candidateRef`, `selectionToken`, `networkStatus`,
originating lane, and project scope paired exactly for follow-up.
`networkStatus` is action-specific: exactly one selected in-network candidate
can route to `express_candidate_interest` or one bounded private question,
while an explicit work-email request for any selected candidate routes through
the `candidate-interest` skill. That skill prefers
`start_candidate_email_enrichment` plus the shared `get_job` poll tool and
uses `enrich_candidate_email` only as
a compatibility fallback. Directly supplied LinkedIn profiles use that same
email-enrichment skill without invented discovery handles.

Discovery alone never authorizes email enrichment, candidate interest, a
private candidate question, a team-connection lookup, or an outbound
campaign. Those require a later, explicit user request and the appropriate
Pluto skill.
