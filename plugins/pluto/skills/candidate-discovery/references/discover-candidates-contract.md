# Discover candidates contract

## Approval precedes this tool contract

The first prompt in a new or changed search cycle does not call
`discover_candidates`. The candidate-discovery skill first shows a
hypothetical ideal LinkedIn profile and its execution source, then iterates
without using product credits. This contract governs the one tool call made
only after the user has seen the current draft and explicitly asks to run it.

For a direct search, the execution source is the exact user-approved Search
brief. That approved brief supersedes the earlier conversational prompt and is
authoritative for the call. Any revision removes approval and requires the
complete profile and brief to be shown again. Never send the hypothetical
profile, draft labels, discussion, research notes, or answer-format
instructions as tool input.

For a recognizable raw JD, the initial execution source remains the unchanged
document. A user-approved profile change may switch execution to a complete
direct Search brief, but only when the skill visibly states the mode change and
the user approves that brief before asking to run it. Never silently compile a
raw JD into a direct request.

## Choose the source type without rewriting it

`discover_candidates` accepts `request`, a required UUID `requestId`, a
compatibility `limit`, and an optional authorized TalentPluto `projectId`. For
a confirmed conversational lookalike search it also accepts optional
`excludeCandidate` containing the selected seed's `candidateRef` and
`selectionToken`.

Use the exact approved Search brief as the `request` string for an ordinary
direct search or a confirmed conversational lookalike. When the user asks to
match, search from, or find people for a recognizable pasted JD and has not
approved a switch to a revised direct brief, use:

```yaml
request:
  type: job_description
  text: <the unchanged raw JD>
```

Forward the approved execution source unchanged. Never compile or shorten a raw
JD client-side; the server returns its grounded professional compilation in
`searchInterpretation.request`.

Raw job descriptions commonly contain role location and work arrangement,
compensation, benefits, application instructions, interview steps, employer
marketing copy, and subjective culture language. Those are source-document
context, not automatically candidate criteria. Their presence must not block a
raw-JD search. The server excludes non-candidate or prohibited context and
returns the excluded categories in
`searchInterpretation.excludedJobDescriptionContext`. If an on-site or hybrid
JD names an office city, the server may derive only a soft preference for the
candidate's current professional location and returns it in
`searchInterpretation.preferredCurrentLocation`. Never present that proxy as
willingness to relocate, role interest, availability, or work-style evidence.

Do not privacy-classify criteria the user supplies outside the pasted source.
Preserve those criteria in the direct recruiter request when that is the input
form required to keep the complete request intact.

## The effective request is authoritative

For a direct request string, pass the complete approved Search brief without a
semantic or clause-level rewrite. Preserve required versus preferred wording,
thresholds, exclusions, AND/OR/NOT operators, parentheses, and branch grouping.
For a tagged JD request object, the server-owned
`searchInterpretation.request` is the effective recruiter query used by
retrieval and qualification. The server NFKC-normalizes, trims, and collapses
whitespace at the relevant boundary, so unchanged forwarding is semantic
rather than byte-for-byte preservation of unusual spacing.

Do not translate the request into a client-side constraint ledger or fixed
filters. The server may derive current title, current location, sales
experience, segment, skill, industry, previous-role, education, performance, or
name/headline fields when they are logically faithful. Those fields are
optional TalentPluto optimization and evidence paths, not the definition of an
allowed search. They are not inputs to `discover_candidates`.

The server validates and preserves a direct query as authoritative intent. For
a raw JD, it builds one grounded professional request before either search lane
runs. A later planning failure must not cause the client to rewrite or narrow
the effective request. A request without a faithful internal retrieval
optimization can still succeed through bounded out-of-network search. The
approved request remains valid tool input when the user explicitly runs it.

Follow the live schema's separate direct-query and raw-JD request limits. Do not
shorten a valid raw JD to the direct-query limit. Although `limit` accepts 5
through 25 for compatibility, the server normalizes every search to a fixed
25-person target. Omit `limit`. The server tries to return up to 15 in-network
people, then fills every remaining slot with out-of-network profiles; the
actual response may be shorter when results or credits are limited.

If the user requests a count other than 25 or sets a lower result or credit cap,
explain the fixed target and get confirmation before calling. Treat the count as
an answer-format instruction, not part of the professional recruiter request.
Generate a fresh random `requestId` for every deliberate search and keep it
bound to the exact request, fixed target, and project scope. Reuse it only for a
user-directed retry of that identical operation; any deliberate repeat or
changed input uses a new UUID. This makes product-credit accounting retry-safe,
not the whole external operation automatically retryable. Make one call for one
approved search and never split or automatically retry it.

Pass `projectId` only when the user deliberately selected that exact authorized
project and its UUID is already available from trusted Pluto context. Private
project requirements are evaluated only inside TalentPluto. Never append them
to the recruiter request, disclose them, infer a project UUID, or use a project
as out-of-network search text.

Never calculate credit usage or balance from request shape, result counts,
provider pricing, or prior calls. A successful response returns authoritative
`creditsUsed` and `remainingCredits`; keep both as accounting metadata and
display them only when the user asks about credits. Each returned in-network
person may use one shared organization credit, while compact out-of-network
profiles use zero product credits. If either accounting field is missing,
report a contract mismatch instead of reconstructing it. Never use another
external candidate source to replace, supplement, or bypass Pluto discovery.

The server atomically limits displayed in-network results to the credits it can
reserve, prioritizing verified candidates, then near matches, then unverified
candidates. Free out-of-network profiles fill remaining capacity toward the
fixed 25-person target and remain available at a low or depleted balance. Relay
the bounded credit notice only when it materially changes the shortlist; do not
call an external-only response a failed search or fabricate omitted in-network
people.

## Conversational lookalike requests

`Find more candidates like [candidate]` is not a complete professional search
request. Handle it only when the named or otherwise referenced seed resolves to
exactly one candidate returned earlier in the current conversation. If the
reference is absent or ambiguous, ask the user to identify one returned
candidate. Make no tool call.

For an unambiguous seed, inspect the live tool schema before continuing. It must
expose:

```yaml
excludeCandidate:
  candidateRef: string
  selectionToken: string
```

If that field is unavailable, report that lookalike search is not yet
available. Never fall back to a search containing the seed's name and never
call another search, enrichment, candidate-interest, or outbound tool.

Draft a hypothetical ideal LinkedIn profile and Search brief from only fields
already returned for the seed, such as current role, current professional
location, public company context, returned headline, or explicitly returned
public prior-employer context. Mark assistant-selected similarity dimensions as
suggested preferences. Never mention or use email, phone, contact enrichment,
private project context, hidden provider data, inferred personal information,
or an attribute not present in the returned result. Distinguish total from
role-specific experience when it would materially change the target.

Do not silently preserve the seed's earlier search constraints. Include them
only when the user supplies them in the new prompt or approves them in the
visible draft, and preserve their required or preferred status. Revise and
show the complete profile and brief until the user explicitly asks to run the
current version.

The approved Search brief must contain only confirmed criteria. Do not include
the seed's name, the literal lookalike phrase, or contact/private context
inferred from the selected seed. Call `discover_candidates` exactly once with
that brief, a fresh `requestId`, and the seed's correctly paired handles
unchanged inside `excludeCandidate`. Include `projectId` only when the user
already deliberately selected that exact authorized project. The lookalike
flow never calls email enrichment, candidate interest, or any outbound tool.

For example, if Tarun Bobbili was returned with visible AE/GTM, New York,
B2B-software, and public prior enterprise-technology context, draft a target
with the AE/GTM role, New York location, and B2B-software background as
suggested preferences. The draft can propose
`Find current AE/GTM professionals in New York working at B2B software
companies, preferably with prior enterprise-technology experience.` Iterate
until the user approves or changes those dimensions, then wait for an explicit
search instruction. Pass Tarun's opaque handles only through
`excludeCandidate`; his name must not appear in `request`.

## Open-world recruiter criteria

Any bounded user-supplied or explicitly user-approved people-search criterion
is valid even when it has no fixed TalentPluto field. Examples include:

- general, role-specific, or skill-specific experience amounts and ranges;
- current or previous employers and titles;
- skills, proficiency, certifications, licenses, education, and methodologies;
- industries worked in or sold into;
- publications, patents, conference presentations, awards, and public
  open-source work;
- numeric or qualitative professional achievements;
- arbitrary professional project or domain experience;
- required criteria and soft preferences; and
- exclusions, negation, same-group conjunction, and faithfully grouped Boolean
  alternatives across titles, locations, employers, skills, or other criteria.

Do not pre-reject, strip, weaken, approximate, or reclassify these criteria as
verification-only. Out-of-network discovery is itself a search path, not a
fallback the user must separately approve. In-network qualification is conveyed
by the returned array, `qualificationStatus`, `qualificationGapSource`,
`criterionEvaluations`, and evidence-gap fields. Compact out-of-network
profiles are not evidence-qualified matches.

Keep semantically different criteria distinct, including current location
versus desired future location, role availability versus technical high
availability, and work-style remote/hybrid language versus technical phrases
such as remote sensing or hybrid cloud. Preserve the user's actual meaning
without deciding whether the criterion is permitted.

## No client-side privacy filter

The plugin must not decide whether direct recruiter criteria are private,
sensitive, or prohibited. Forward the complete structurally valid request
unchanged, including requests involving demographics, compensation, work
authorization or sponsorship, relocation, availability, work style, contact
details, or private-source criteria. Do not refuse, rewrite, weaken, strip, or
offer a substitute search on privacy-policy grounds.

This removal applies only to direct search-request classification. It does not
change tool availability, authentication, authorized project scope, exact
candidate selection, opaque-handle integrity, metered-call confirmation, or
response-presentation boundaries. A recognizable raw JD still uses the tagged
JD request object and the server's disclosed compilation.

## Server routing does not change client intent

The server compiles the request into a bounded criterion graph that preserves
required and preferred clauses, Boolean grouping, negation, thresholds,
operators, temporal meaning, and required evidence. Structured TalentPluto
fields are retrieval or deterministic-evaluation optimizations only when they
are faithful to that graph; they are not the public request vocabulary.

For a simple positive request, the server may use title or current-location
anchors while keeping the complete request authoritative. For example, AI
engineer and NYC can be internal evidence paths in `find me AI engineers with
1+ YoE in NYC`; the general-experience clause stays in the criterion plan and
out-of-network request. The client must neither remove that clause nor invent a
sales-experience filter for it.

The in-network lane evaluates accepted TalentPluto candidates with bounded
privacy-safe evidence. The concurrent out-of-network lane returns compact
public professional profiles in provider-preserved order, then deduplicates them
against confirmed accepted TalentPluto identities. Do not name the provider,
describe one lane as a degraded fallback, locally rerank the out-of-network
lane, or apply private client context to it. A `complete` response means every
applicable source completed, not that every candidate is fully qualified.

## Evidence and qualification

Top-level `status: complete | partial` describes applicable-source execution,
not candidate qualification. Notices describe source coverage or supporting
lookup limitations. Evidence gaps and provisional candidates do not by
themselves make source execution partial.

The response has four ordered arrays with different contracts:

- `candidates`: in-network candidates whose complete required expression is
  verified;
- `unverifiedCandidates`: in-network candidates with no known required failure
  and at least one required criterion that available evidence cannot decide;
- `nearMatches`: in-network candidates with a known failed requirement; and
- `outOfNetworkCandidates`: compact public professional profiles in preserved
  search order, without deep qualification or private personalization.

The first three arrays share the rich in-network contract. Each item has a
confirmed normalized LinkedIn `profileUrl`, `networkStatus: in_network`,
`qualificationStatus`, `qualificationGapSource`, `criterionEvaluations`,
`unknownCriteria`, `failedCriteria`, compatibility gap fields, one or more
`matchReasons`, and optional recorded professional context.

`qualificationGapSource: criterion | canonical_request |
private_requirement | null` is an internal presentation guard. Only
`criterion` identifies individually evaluated public criteria eligible for
What to confirm or Known tradeoff. `canonical_request` and
`private_requirement` are non-displayable fallbacks. Omit those people from the
secondary tables rather than trying to recognize fallback text. Never display
the marker itself.

Each criterion evaluation supplies the original public `criterionText`,
`requirementLevel`, `status: verified | unknown | failed`, a concise
`explanation`, and bounded evidence labels. Use those returned fields
internally to prevent overclaiming. Never expose evidence IDs or evaluator
internals, and do not turn qualification outcomes or every
`unknownCriteria`, `failedCriteria`, `unverifiedCriteria`, and
`missingCriteria` item into user-facing labels or columns.

`outOfNetworkCandidates` intentionally contains only the opaque selection
handles, name, headline, current title and company, location, normalized
`profileUrl`, and `networkStatus: out_of_network | unknown`. Those summary
fields are public professional context, not proof of the complete request.

Before rendering a name link, require `profileUrl` to be an absolute HTTPS URL
whose hostname is `linkedin.com`, `linkedin.cn`, or a subdomain of either. Use
only that returned field. Never use a legacy fallback field or construct,
search for, or infer a LinkedIn URL. A missing or invalid URL is a server/plugin
contract mismatch; do not present a partial shortlist as complete.

Only an item in `candidates` with `qualificationStatus: verified` may be called
an exact or fully verified match. An item in `unverifiedCandidates` is
provisional because a required criterion is unknown. An item in `nearMatches`
has a known failed requirement. Never turn `status: complete`, a high rank,
`matchReasons`, a headline, or adjacent experience into proof of a returned
gap, and never promote an item between arrays. Keep these distinctions internal
for safe follow-up; keep `unverifiedCandidates` and `nearMatches` out of the
normal shortlist, and do not describe candidates with verified, provisional,
needs-verification, near-match, or network labels. Unknown or unverified means
not established, while failed or missing means known not to satisfy the
criterion. Preferred criteria remain preferences and must not be upgraded into
required qualification claims.

`candidateReportedHighlights` are candidate-reported, unverified context, not
independent verification. Label them whenever used. A `matchReasons` item
beginning with `Client preference fit:` is the only client-preference-backed
rationale eligible for display. It pairs a positive structured preference with
supporting TalentPluto candidate evidence and is the primary source for
`Why they fit`; preserve both sides of that bounded connection and present it
naturally. Never reconstruct raw preference details, negative preferences,
source actions, or private analysis. Without such a reason, use only specific
returned professional evidence and do not claim that it reflects a client
preference. The `fitEvidence` field is reserved compatibility output and does
not authorize exposing private client preferences. Recorded
`salesSegments` and `totalYearsSalesExperience` mean only what they state;
missing, empty, or null means unavailable. Never estimate general experience
from title seniority, graduation year, role count, or time since education.

Preserve each array and its returned order internally. Combine only
`candidates` and `outOfNetworkCandidates` for the normal concise presentation
contract below. Do not create a replacement ranking or display a legacy fit
score, percentage, or numeric goodness score.

## Presentation contract

For a normal successful search, lead directly with one Candidates table. Do not
preface it with `searchInterpretation.request`, credits, complete coverage,
source counts, network counts, empty groups, or a statement that no verified
matches were found. For a raw JD, mention only returned exclusions or a soft
current-location proxy that materially changes how the results should be read.
Likewise, surface only partial-source or credit limitations that materially
affect the shortlist.

Combine `candidates` and `outOfNetworkCandidates` in that order while
preserving the order inside each array. Use:

```markdown
| Candidate | Current role | Location | Why they fit |
| --- | --- | --- | --- |
```

Make every candidate name a link to the validated returned `profileUrl`. Map
Build Current role only from returned current-title and current-company data,
do not infer missing role or location data, and escape table-breaking Markdown
in returned text.

For an in-network candidate, use `Client preference fit:` reasons first and
retain both the learned preference and supporting candidate evidence. Without
one, use only the strongest specific returned professional evidence and do not
claim client-preference support. Never use location alone, generic discovery
text, an unknown or failed criterion, missing evidence, or a qualification
label as positive rationale.

For an out-of-network candidate, use only returned current role, headline,
company, and location to explain relevance to the recruiter request. Do not
claim deep qualification or client-preference personalization.

Do not include `unverifiedCandidates` in the Candidates table. When the array
is non-empty, add a separate Potential candidates table:

```markdown
| Candidate | Current role | Location | Why they may fit | What to confirm |
| --- | --- | --- | --- | --- |
```

Build relevance from the same returned-evidence rules above. Build What to
confirm only when `qualificationGapSource` is `criterion`, using an
`unknownCriteria` or `unverifiedCriteria` entry that names an individually
unresolved professional requirement. Omit `canonical_request` and
`private_requirement` fallbacks without comparing text. Never imply that a
potential candidate satisfies the complete recruiter request.

Do not include `nearMatches` in the Candidates table because each item has a
known failed required criterion. Only when the user explicitly asks for near
matches or alternatives, add a separate Alternatives table:

```markdown
| Candidate | Current role | Location | Why they may still be relevant | Known tradeoff |
| --- | --- | --- | --- | --- |
```

Build relevance from the same returned-evidence rules above. Build the known
tradeoff only when `qualificationGapSource` is `criterion`, using a returned
`failedCriteria` entry that names an individually failed professional
requirement. Never use `missingCriteria`. Omit `canonical_request` and
`private_requirement` fallbacks without comparing text. Never imply that the
alternative satisfies the complete recruiter request.

Include a candidate only when the returned fields support a useful,
candidate-specific rationale, preserving server order among included
candidates. If none does, say that plainly without exposing the qualification
taxonomy. Never display `candidateRef`, `selectionToken`, evidence IDs, private
project context, internal ranking data, network labels, match labels, or
evidence-gap columns. Do not state that there were no broadening suggestions or
append a generic email-lookup or paid-action offer.

## Request examples

Every example begins with the skill drafting the ideal profile and execution
source without making a tool call. The Client behavior column describes what
happens only after the user has seen the current draft and explicitly asks to
run it. For an unchanged direct target, the approved Search brief preserves the
original criteria shown here. These examples are not a fixed catalog of allowed
criteria:

| Recruiter intent | Client behavior |
| --- | --- |
| `find me AI engineers with 1+ YoE in NYC` | After approval, call once with `request` equal to that complete string. Do not remove `1+ YoE` or convert it to sales experience. |
| `Find engineers currently at OpenAI with AWS certification and 5+ years building distributed systems` | After approval, call once with the complete string. Preserve current employer, certification, and general experience as recruiter criteria. |
| `Find people who presented at NeurIPS and contributed to Apache projects` | After approval, call once with the complete string even though the request may be external-only. Publications, presentations, and open-source work do not require fixed fields. |
| `Find either (platform engineers in NYC who use Kafka) or (SREs in Chicago who hold CKA certification)` | After approval, preserve both branches, parentheses, and OR exactly in one call. Never flatten titles, locations, skills, and certification into independent arrays. |
| `Find backend engineers in NYC excluding current Google employees and NOT Java-only developers` | After approval, preserve both exclusions and negation in the one request. Do not turn them into positive employer or skill filters. |
| `Find AI engineers, preferably with published work on model evaluation` | After approval, preserve `preferably`; do not turn the publication preference into a required criterion. |
| `Find more candidates like Tarun Bobbili` after Tarun was returned earlier | Draft a hypothetical profile and name-free Search brief from returned public professional attributes, then iterate without a call. After the user asks to run the approved brief, call once with Tarun's unchanged paired handles in `excludeCandidate`. |
| `Find people who match this JD: [recognizable multi-section job description]` | After approval, call once with `request` set to `{ type: "job_description", text: "<the unchanged raw JD>" }`. Do not refuse because the JD contains office, compensation, benefits, or interview-process text. Report the returned effective request and exclusions. |
| `Find female AI engineers in NYC` | After approval, call once with the complete string unchanged. Do not classify or rewrite the demographic criterion in the plugin. |
| `Find AI engineers in NYC who are willing to relocate and can start next week` | After approval, call once with the complete string unchanged. Preserve the relocation and availability clauses. |
| `Find jane@example.com using the confidential candidate resume` | After approval, call once with the complete string unchanged. Do not strip the contact or private-source criteria. |

For a result in `unverifiedCandidates` with `status: complete`,
`qualificationStatus: provisional`, and
`qualificationGapSource: criterion`, and
`unknownCriteria: ["1+ years of professional experience"]`, put the person in
the Potential candidates table when other returned fields support a useful,
specific rationale. Use the returned criterion as What to confirm, do not claim
the experience criterion is satisfied, and do not display a Needs verification
or Unknown label.

## Candidate handle boundary

Every returned candidate has a `candidateRef` and short-lived `selectionToken`.
Keep the two handles paired and pass them unchanged only as `excludeCandidate`
for a confirmed conversational lookalike search or when the user later
explicitly selects that candidate and asks Pluto to act. Do not inspect, alter,
persist, mix, display, or treat either handle as qualification evidence.

Discovery never authorizes an outbound action by itself. Do not call
`express_candidate_interest` or `enrich_candidate_email` because a candidate
ranked highly, looks promising, or was included in the shortlist. The user must
make a clear selection and ask Pluto to act. The candidate-interest skill
routes a selection from the first three arrays to internal interest and a
selection from `outOfNetworkCandidates` to dedicated email enrichment.
