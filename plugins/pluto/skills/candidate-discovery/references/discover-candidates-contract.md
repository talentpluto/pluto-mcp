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
distinct candidates across exact, provisional, and near matches, report the
shortfall rather than duplicating candidates, inventing results, using an
unauthorized source, or silently broadening the request.

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

Public discovery results can contain a candidate's name, headline, current
title, current company, location, profile link, recorded sales context, fit
score, match reasons, network and qualification labels, candidate-reported
highlights, client-connected fit evidence, unverified criteria, and opaque
candidate-selection handles. They do not contain a complete dated work-history
ledger.

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

`fitScore` measures discovery relevance. `matchReasons` are evidence only for
what they explicitly state. `candidateReportedHighlights` and `fitEvidence` are
candidate-reported supporting context, not independent verification. Every
`unverifiedCriteria` item is an explicit evidence gap and must not be described
as satisfied.

`networkStatus` is TalentPluto membership, not raw provider provenance: present
`in_network`, `out_of_network`, and `unknown` as In network, Out of network, and
Network unknown. `qualificationStatus: verified` means the requested criteria
have TalentPluto matching evidence and is the only state that may be called an
exact match. `qualificationStatus: provisional` always carries a missing or
unverified criterion. A partial top-level status qualifies source coverage, not
candidate qualification. Near matches are missing at least one searchable
criterion, and broadening suggestions do not authorize changing the request.
Present every candidate with one candidate-specific "Why this person" sentence
and an "Evidence gaps" sentence whenever `missingCriteria` or
`unverifiedCriteria` is non-empty.

## Candidate-interest boundary

Every returned candidate has a `candidateRef` and short-lived
`selectionToken`. Keep the two handles paired and return them unchanged only
when the user later explicitly selects that candidate and asks Pluto to express
interest. Do not inspect, alter, persist, mix, or treat either handle as
qualification evidence.

Discovery never authorizes an interest action by itself. Do not call
`express_candidate_interest` because a candidate ranked highly, looks
promising, or was included in the shortlist. The user must make a clear
selection and ask Pluto to act; the candidate-interest skill governs that
separate, non-idempotent workflow.
