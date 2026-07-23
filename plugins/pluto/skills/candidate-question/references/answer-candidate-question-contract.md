# Answer candidate question contract

## Purpose and eligibility

`answer_candidate_question` answers one free-form question about one explicitly
selected in-network candidate. It accepts only the unchanged `candidateRef` and
`selectionToken` returned together by `discover_candidates`, the user's
unchanged single `question`, and an optional exact authorized `projectId`.

The server requires:

- the `candidates:private_assess` OAuth scope;
- a current authorized owner, admin, or recruiter membership;
- an accepted in-network candidate;
- an existing client-visible relationship on an active role;
- current capability-versioned AI Visibility consent; and
- the relevant candidate visibility category to remain unhidden.

These checks are fail-closed and server-owned. Do not tell the user which
private condition failed or infer a raw value from an `unknown` or `blocked`
result.

## Closed predicate catalog

The current catalog supports:

- one actual proposed annual USD base-salary or OTE amount compared with the
  matching recorded minimum;
- an explicit recorded response about authorization to work in the United
  States;
- a countryless recorded employer-sponsorship requirement;
- recorded job-search availability;
- recorded general willingness to relocate; and
- compatibility with one remote, hybrid, or in-person arrangement.

It does not support exact compensation preferences, offer-acceptance
prediction, raw work-authorization values, non-US work authorization,
citizenship, nationality, visa or immigration status, full work-style
preferences, desired relocation locations, multiple facts in one question,
behavior prediction, or arbitrary private-record questions.

The local compiler sees only the question and maps it to a server-owned
predicate. It never receives candidate, profile, project, resume, transcript,
or database data. Preserve this boundary by forwarding one question unchanged.

## Work-authorization boundary

Explicit US work authorization and countryless employer sponsorship are
different predicates. A generic work-authorization question needs the user's
US-jurisdiction clarification before the call. A non-US jurisdiction is
unsupported and must not be rewritten. A sponsorship answer never proves US
work authorization, and a US-work-authorization answer never proves whether
employer sponsorship is required.

The two predicates share a 180-day disclosure lane for the organization and
candidate. Exact-predicate replay is allowed, but after either predicate is
assessed, switching to the other is blocked across users, projects, refreshed
selection tokens, evidence changes, and paraphrases. Never attempt to combine
the two answers.

## Other disclosure guards

Compensation and work arrangement each use a 180-day anti-probing guard. The
first distinct annual proposal or arrangement claims the disclosure budget for
the organization, candidate, and current recorded preference. Exact replay is
idempotent; a different amount or arrangement is blocked. A changed recorded
preference begins a new server-side budget, but clients must never probe for
that change.

The operation consumes no product credits and does not modify candidate,
project, or pipeline records. A successful guarded assessment writes only its
server-side disclosure claim.

## Result handling

The normal result is a fixed union:

- `answered` returns one bounded `message` based on a permitted recorded
  response or profile preference;
- `unknown` returns one bounded `message` for insufficient permitted evidence
  or a supported clarification;
- `unsupported` returns one bounded `message` and forbids probing variants; and
- `blocked` returns one safe `message` for selection, relationship,
  authorization, permission, or disclosure-guard failure.

Relay only the returned message. Do not expose `basis`, strengthen `outcome`,
name private evidence, describe work-authorization information as independently
verified or legally determinative, claim candidate confirmation or freshness,
or infer a hidden negative answer. Do not automatically retry any result.
