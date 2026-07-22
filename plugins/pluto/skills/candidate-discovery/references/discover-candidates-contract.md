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

Every discovery result must contain a confirmed LinkedIn profile URL in its
`profileUrl` or `linkedinUrl` field. Use only the URL returned for that
candidate, and render the candidate's name as its Markdown link. Never
construct or infer a LinkedIn URL. A result without either URL is a
server/plugin contract mismatch that must be reported rather than silently
omitted or presented without a link.

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
Network unknown immediately beside the linked candidate name.
`qualificationStatus: verified` and `provisional` map to Verified match and
Provisional match. Only a verified candidate may be called an exact match, and
a provisional candidate always has a missing or unverified criterion.

Keep the server's exact, provisional, and near-match groups separate, and
preserve the returned order within every group. Do not create a replacement
ranking formula. A legacy `fitScore` is a discovery relevance heuristic that
may be used only as hidden context for the returned ordering. Do not display it
or another numeric relevance score unless the user explicitly asks about
scoring, and never treat a score as qualification proof or a hiring
recommendation.

A partial top-level status qualifies source coverage, not candidate
qualification. Near matches are missing at least one searchable criterion, and
broadening suggestions do not authorize changing the request. Present every
candidate with one concise, candidate-specific explanation based first on
relevant client-specific `fitEvidence`, then relevant
`candidateReportedHighlights`, recorded sales experience and segments, and
finally `matchReasons`, current role, company, and location. Label all
candidate-reported evidence as unverified, prefer richer differentiating
TalentPluto evidence for in-network candidates, and show every
`missingCriteria` and `unverifiedCriteria` item as an evidence gap.

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
