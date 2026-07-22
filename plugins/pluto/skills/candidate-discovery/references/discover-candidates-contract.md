# Discover candidates contract

## Searchable criteria

Pluto can directly search:

- current title alternatives;
- current city or metro alternatives;
- minimum total sales experience for an explicitly sales-role request;
- enterprise, mid-market, or SMB sales segment;
- named professional skills, products, methodologies, or tools;
- industries sold into and industries worked in;
- explicitly previous employers and previous titles;
- education institution, degree, and field; and
- an explicit candidate name or headline keyword.

Alternatives inside one filter group are supported. Different filter groups are
combined as requirements. Non-numeric professional performance evidence is a
soft ranking signal rather than a hard eligibility filter.

## Result quantity

Every search must request a `limit` of at least `10`, or the user's larger
requested count up to the schema maximum. The limit is a requested maximum, not
a guarantee that ten eligible candidates exist. If Pluto returns fewer than ten
distinct candidates across verified, provisional, and near matches, report the
shortfall rather than duplicating candidates, inventing results, using an
unauthorized source, or silently broadening the request.

The schema-valid `limit` sent to the server is the effective requested result
count. Present every distinct result the server returns up to that count. Do not
stop after ten, suppress a lower-ranked result, or use near matches only as
filler. Count network membership across every displayed group. If fewer than
five distinct in-network candidates were returned, state the exact count and
shortfall from five without inventing candidates, broadening the search, or
relabeling near matches as exact matches.

## Metering and credit reporting

`discover_candidates` is metered and non-idempotent. Call it once for a
faithful request and never retry a timeout or ambiguous failure. Report the
uncertainty and stop. Do not use another external candidate source to replace,
supplement, or bypass Pluto discovery.

Never calculate credit usage or balance client-side from request shape, result
counts, provider prices, or prior calls. Display authoritative usage or balance
information concisely only when the server returns it; otherwise do not infer
or mention an amount.

## Unsupported criteria

Pluto cannot faithfully search:

- general or non-sales experience amounts, ranges, or maximums;
- maximum sales experience or a sales-experience range;
- current-employer requirements;
- exclusions, negation, or OR across different filter groups;
- skill proficiency, certification, or years of skill use; or
- numeric quota or attainment thresholds.

Remote preference, relocation or desired location, availability, compensation,
work authorization, demographics, and other private criteria are not usable.
Never approximate an unsupported criterion with another filter, and never infer
or use private criteria.

## Evidence rules

Every discovery result must contain a confirmed LinkedIn profile URL in its
`profileUrl` or `linkedinUrl` field. Use only the URL returned for that
candidate, and render the candidate's name as its Markdown link. Never
construct, search for, or infer a LinkedIn URL. If any result lacks both URLs,
the response cannot satisfy the complete presentation contract. Report the
server/plugin contract mismatch and do not present a partial table as though it
were the complete shortlist.

Public discovery results can also contain a candidate's headline, current
title, current company, location, recorded sales context, match reasons,
network and qualification labels, candidate-reported highlights,
candidate-reported and unverified `fitEvidence`, unverified criteria, opaque
candidate-selection handles, and a legacy fit score. They do not contain a
complete dated work-history ledger.

Years of experience are therefore often verification-only. Pluto supports a
minimum total-sales-experience filter only for explicit sales searches; it does
not prove general experience, exact amounts, ranges, or maximums. If another
authorized source provides complete dated history, define which roles count,
treat ongoing work as ending today, merge overlapping intervals, and accept a
range only when both bounds are established. Never estimate experience from
title seniority, graduation year, role count, or time since education.

A current-employer requirement is not searchable, although `currentCompany`
may verify it for an individual returned candidate. Such post-filtering is not
an exhaustive search.

`matchReasons` are evidence only for what they explicitly state.
`candidateReportedHighlights` and `fitEvidence` are candidate-reported,
unverified supporting context, not independent verification. Every
`unverifiedCriteria` item is an explicit evidence gap and must not be described
as satisfied.

`networkStatus` is TalentPluto membership, not raw provider provenance. Present
`in_network`, `out_of_network`, and `unknown` as In network, Out of network, and
Network unknown. `qualificationStatus: verified` maps to Verified match and is
the only state that may be called an exact match. `qualificationStatus:
provisional` maps to Provisional match and always carries a missing or
unverified criterion. Every result from `nearMatches` maps to Near match.

A partial top-level status qualifies source coverage, not candidate
qualification. Near matches are missing at least one searchable criterion, and
broadening suggestions do not authorize changing the request. Keep the
server's verified, provisional, and near-match groups separate, and preserve
the returned order within every group. Do not create a replacement ranking
formula. A legacy `fitScore` is a discovery relevance heuristic that may be
used only as hidden context for understanding the returned order. Do not
display it or another numeric relevance score unless the user explicitly asks
about scoring, and never treat a score as qualification proof or a hiring
recommendation.

## Presentation contract

Immediately above the result tables, state the exact In network and Out of
network counts across all distinct displayed results. State the Network unknown
count when nonzero so the total reconciles, and state the exact in-network
shortfall when the in-network count is below five.

Render separate Verified matches, Provisional matches, and Near matches
sections in that order. Use a compact Markdown table for every non-empty
section and say none were returned for an empty section. Every table must use
exactly these columns:

```markdown
| Candidate | Network | Match | Current role | Location | Why this person | Evidence gaps |
| --- | --- | --- | --- | --- | --- | --- |
```

Each candidate name must be a Markdown link using only its returned
`profileUrl` or `linkedinUrl`. Use the exact network and match labels defined
above. Build Current role only from returned current-title and current-company
data, and do not infer unavailable role or location values.

Give every candidate one concise, candidate-specific `Why this person` cell.
Prefer relevant client-specific `fitEvidence`, then relevant
`candidateReportedHighlights`, recorded sales experience and segments, and
finally `matchReasons`, current role, company, and location. Label all
candidate-reported evidence as unverified. Put every `missingCriteria` and every
`unverifiedCriteria` item in `Evidence gaps`, labeling the two kinds separately;
use None only when both lists are empty. Escape table-breaking Markdown in
returned text. Never expose `candidateRef` or `selectionToken` in the displayed
shortlist.

## Candidate-interest boundary

Every returned candidate has a `candidateRef` and short-lived
`selectionToken`. Keep the two handles paired and return them unchanged only
when the user later explicitly selects that candidate and asks Pluto to express
interest. Do not inspect, alter, persist, mix, display, or treat either handle
as qualification evidence.

Discovery never authorizes an interest action by itself. Do not call
`express_candidate_interest` because a candidate ranked highly, looks
promising, or was included in the shortlist. The user must make a clear
selection and ask Pluto to act; the candidate-interest skill governs that
separate, non-idempotent workflow.
