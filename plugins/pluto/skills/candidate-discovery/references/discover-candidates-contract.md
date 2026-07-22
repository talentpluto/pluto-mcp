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
title, current company, location, profile link, fit score, and match reasons.
They do not contain a complete dated work-history ledger.

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
what they explicitly state. A partial status qualifies source coverage, near
matches are missing at least one searchable criterion, and broadening
suggestions do not authorize changing the request.
