---
name: market-snapshot
description: Use when a user asks Pluto for a directional US talent-market snapshot, broad talent supply or demand, candidate-reported compensation expectations, sales deal-size experience, or client-entered role ranges. Calls get_market_snapshot for one supported role family and preserves its privacy-thresholded methodology and distinct evidence bases.
---

# Market snapshot

Use this skill for aggregate US talent-market questions. The result is a
privacy-thresholded directional snapshot, not candidate discovery,
individualized compensation advice, a salary survey, or universal market
truth. The tool is read-only and does not use shared Candidate MCP credits.

## Confirm Pluto is available

Before calling, confirm that the current host context exposes Pluto's
`get_market_snapshot` tool and inspect its live input schema. Loading this skill
does not prove that Pluto initialized or that the connected server advertises
the market-snapshot contract.

The live schema must accept one `roleFamily` and either default `country` to
`US` or accept the literal `US`. If the tool is absent or its schema differs,
follow the `connection-recovery` skill for `get_market_snapshot`. If recovery
does not expose the expected contract, report that no snapshot ran. Do not call
another data source or substitute candidate discovery.

## Choose one supported scope

The current tool supports the United States and these broad role families:

- `sales`
- `engineering`
- `marketing_growth`
- `customer_success`
- `operations_finance`
- `product`
- `people`
- `design`
- `executive`

Choose the closest supported family from the user's requested professional
role without adding unrequested seniority, industry, title, geography, or
company filters. State the broad family in the answer so the aggregation scope
is clear. If two families would materially change the interpretation, ask one
focused question before calling.

If the user explicitly asks for several supported families, make one call per
requested family and keep their results separate. Do not expand a request to
additional families automatically. If the user asks for a non-US market,
explain that the current snapshot supports only US cohorts and make no call;
never map another country to `US`.

## Call the tool

Call `get_market_snapshot` once for each explicitly requested supported family
with only:

```yaml
roleFamily: <supported role family>
```

Omit `country` when the live schema defaults it to `US`; otherwise pass the
literal `US`. Never pass a title, location, organization identifier, candidate
identifier, compensation target, or invented filter.

Do not retry an ambiguous failure automatically. The tool is read-only and
free of Candidate MCP credits, but repeated calls can still duplicate external
work. If the result fails or is malformed, report that the snapshot is
temporarily unavailable.

## Validate the response

Require:

- `schemaVersion: talentpluto.market-snapshot.v2`;
- the requested `scope.roleFamily`, `scope.country: US`, and
  `scope.windowDays: 365`;
- a valid `generatedAt`;
- `status: complete | partial | insufficient_data`; and
- separate `candidateMarket`, `employerMarket`, `methodology`, and `notices`
  fields.

If those boundaries do not hold, report a plugin/server contract mismatch
instead of reconstructing or estimating the result.

## Preserve the evidence bases

Keep every returned basis and unit attached to its metric:

- candidate base and OTE values are candidate-reported minimum expectations,
  not salaries, accepted offers, or guaranteed compensation;
- candidate deal-size values are reported deal experience and use
  `usd_deal_value`;
- employer base and OTE values are client-entered role ranges, not candidate
  expectations, completed-hire compensation, or accepted offers;
- supply covers the returned 90-day recent-activity window, while the overall
  snapshot scope covers 365 days.

Never combine candidate and employer values into one benchmark, calculate a
blended market number, or infer a gap between the two populations. Use exact
returned `p25`, `median`, and `p75` values only when the metric's status is
`available`. Treat `insufficient_data`, `not_applicable`, and null values as
unavailable; never estimate around them.

Underlying cohort sizes, contributor counts, and privacy thresholds are
intentionally private. Do not infer, estimate, or imply them. Do not infer an
individual candidate, client, company, or accepted salary from aggregate
values.

## Present a concise snapshot

Lead with the scope and generation time. Show only available metrics in a
compact table:

```markdown
| Signal | Basis | P25 | Median | P75 |
| --- | --- | ---: | ---: | ---: |
```

Keep candidate-reported and client-entered rows visibly distinct and format
their exact units without changing the values. Then summarize returned supply
and demand availability without inventing counts. Include only methodology or
notice text that materially affects interpretation.

For `partial`, identify the unavailable section without filling it in. For
`insufficient_data`, say that the privacy-safe cohort was insufficient and
stop; do not broaden the role family, call another source, or estimate the
suppressed values.
