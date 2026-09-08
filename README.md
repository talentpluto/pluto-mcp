# Pluto

Pluto brings TalentPluto recruiting workflows into OpenAI Codex and Claude
Code. Describe the person you are looking for or paste a job description, then
work with the retrieved leads directly in the conversation.

## What you can do

- Find and review candidate leads from a plain-English request or a full job
  description.
- Compare candidates and refine the search criteria.
- Get a directional, privacy-protected US talent-market snapshot.
- Ask supported questions about a selected in-network candidate's recorded
  preferences or availability.
- Find and verify available work and personal emails for selected candidates
  or directly supplied LinkedIn profiles.
- Pull full public profile details for LinkedIn profile URLs you supply.
- Deep-enrich one to 50 explicitly selected LinkedIn profiles with the
  identity-safe professional profile and derived recruiter intelligence for
  profile-identified employment companies.
- Full-enrich the same kind of selection to additionally gather cited
  public-web findings about each person.
- Compare supplied candidates' public professional backgrounds with your
  aggregate Team DNA to surface evidence-backed common ground,
  complementarity, and unknowns. This workflow does not identify a
  non-founder teammate or claim a personal relationship.
- Draft, save, and edit a client-shared candidate scoring rubric from a job
  description or role requirements after a complete editable review. Saved
  rubric replacements are loaded first and never overwrite a newer revision.
  Preferred and avoided employers can each carry a high, medium, or low
  priority. They are informational context only and never affect score or
  eligibility. All confirmed content remains stored through existing
  normalization; automated scoring uses only a server-approved professional
  projection without changing the saved rubric. Avoid wins when the same
  employer appears in both lists.
- Score selected candidates or supplied LinkedIn profiles from 0-100 against
  your company's stored Team DNA — shared prior companies, titles, seniority,
  locations, schools, recent-joiner patterns, founder backgrounds, and
  published hiring-preference signals — with a separate 0-100 match score
  against your job description when you provide one, or against a loaded saved
  rubric through server-owned scoring. Saved-rubric scoring runs as a durable
  operation the agent polls: one `get_rubrics` call for at most 10 profiles
  from one completed small, medium, or heavy lookup, or one
  `score_rubric_candidates` operation for up to 200 profiles across up to 10
  completed lookups. Medium sources retain privacy-filtered company evidence, and heavy
  sources retain company plus public-web evidence. Completed compatible
  lookups are reused; new scoring-only profile work defaults to a heavy lookup
  at five shared organization credits per admitted profile. Every assessed
  criterion cites explicit evidence, candidates are enriched first when
  needed, and durable results preserve requested order and per-candidate
  failures. New saved-rubric results use the complete supplied work history for
  a Luna scouting score with separate confidence, source-linked criterion
  narratives, and critical unknowns. Verification is not run: no criterion
  scores, coverage, passed prerequisites, or eligibility are inferred. Scouting
  supports human review and never authorizes automatic promotion.
- Draft, review, or create an email campaign for selected candidates.
  Pluto reuses completed email enrichment, prepares only missing recipient
  emails, and asks at most once between a saved template and custom content. A
  clear creation request proceeds after a compact summary without another
  confirmation turn; draft-only and review-only requests remain editable and
  do not launch. Delivery can use Pluto-managed delivery or one authorized
  Gmail inbox belonging to the requester or a coworker.
- Cancel an existing outbound campaign after confirming the exact one,
  stopping its remaining scheduled emails.
- Express interest in an in-network candidate for an active role.
- Source candidates from a job description, then use TalentPluto's stored,
  allowlisted Ashby connection for explicitly directed candidate creation,
  bounded candidate-field updates, native PDF resume uploads, public top-level
  notes, job consideration, or application-stage changes. A LinkedIn-only
  create request automatically runs medium profile and email enrichment,
  selects the strongest returned work or personal email, fills an empty primary
  Ashby email or adds a distinct alternate without replacing an existing
  primary, keeps personal addresses out of the public enrichment note, and can
  target one exact job and stage. Existing candidates can be updated only for
  explicitly requested name, primary email, one alternate email, phone,
  LinkedIn, GitHub, or website fields. Ashby's public candidate API does not
  expose direct Education or Experience writes. An explicitly supplied PDF can
  be uploaded for one exact existing candidate when it is available as a
  short-lived public HTTPS URL; Ashby parses it and may populate missing fields,
  but existing fields are not promised to be overwritten. Clear requests
  complete the prepare and confirm protocol without a redundant user
  confirmation. Pluto does not expose general Ashby reads or require a separate
  Ashby MCP connection.
- Check your organization's shared Pluto credit balance.

## How candidate search works

1. **Describe the role.** Tell Pluto what is required, preferred, and out of
   scope, or paste the job description.
2. **Run the search.** Pluto retrieves and deduplicates candidates from its
   configured sources while the conversation automatically follows the durable
   operation to completion.
3. **Review the leads.** The connected assistant presents every returned
   source-ranked lead using explicit professional profile facts and bounded
   Team DNA context. Missing evidence stays unknown.
4. **Choose what happens next.** Select candidates before asking Pluto to get
   contact details, create a campaign, answer a private question, or express
   interest.

Pluto does not change your pipeline or create a campaign from search results
alone. Consequential actions require an explicit request; Pluto asks a focused
question only when the requested action or a material detail is unclear.

## Install Pluto

You need Codex desktop, the Codex CLI, or Claude Code, plus a TalentPluto
account in an organization with Pluto access.

### Codex desktop

1. Open **Plugins**.
2. Add the marketplace `talentpluto/pluto-mcp`.
3. Install **Pluto** and complete the TalentPluto sign-in.
4. Start a new task.

### Codex CLI

```bash
codex plugin marketplace add talentpluto/pluto-mcp
codex plugin add pluto@talentpluto
codex mcp login pluto
```

Start a new Codex task after sign-in.

### Claude Code

Run these commands inside Claude Code:

```text
/plugin marketplace add talentpluto/pluto-mcp
/plugin install pluto@talentpluto
```

Then run `/mcp`, select **pluto**, and complete the TalentPluto sign-in. Start
a new Claude Code session afterward.

To receive plugin guidance updates automatically, open `/plugin`, choose the
**Marketplaces** tab, select **talentpluto**, and enable auto-update.

## Try it

In Codex, mention `@pluto`. In Claude Code, say "Use Pluto" in your request.

```text
@pluto Find senior backend engineers in New York with payments experience.

@pluto Find candidates for this role:
[paste the job description]

@pluto Get the full public profiles for these LinkedIn profile URLs:
[paste the URLs]

@pluto Deep-enrich these selected LinkedIn profiles with professional details
and employment-company intelligence:
[paste up to 50 LinkedIn profile URLs]

@pluto Who on my team has the strongest connection to this candidate?
[paste one LinkedIn profile URL]

@pluto Create a candidate scoring rubric from this job description. Prefer
Stripe at high priority and Adyen at medium priority; avoid Oracle at low
priority. Show me the complete draft, then ask whether I want changes or want
it created:
[paste the job description]

@pluto Load my "Senior Backend Engineer" rubric and update its system design
criterion, then change Stripe from medium to high preferred priority. Show me
the complete replacement before saving it.

@pluto Score this selected candidate against my "Senior Backend Engineer"
rubric.

@pluto Score this candidate against our Team DNA and this job description:
[paste one LinkedIn profile URL or select a returned candidate, plus the JD]

@pluto Give me a directional US market snapshot for engineering talent.

@pluto Source candidates from this Senior Account Executive job description,
then add the candidates I explicitly select to the exact Ashby job and stage I
give you:
[paste the job description]

@pluto Update the existing Ashby candidate selected by their current email
with this new professional email and LinkedIn URL. If the review matches these
exact changes, make them without asking me to confirm again:
[paste the current email, new email, and LinkedIn URL]

@pluto Upload this attached PDF resume to the existing Ashby candidate with
this current email. If the attachment is available as a short-lived public
HTTPS URL and the review resolves this exact candidate, complete the upload:
[attach the PDF and paste the candidate's current email]

@pluto How many Pluto credits does my organization have left?
```

After a search, select the relevant candidates before asking Pluto to continue:

```text
@pluto Get and verify the available emails for these candidates.

@pluto Create a campaign for these candidates. Prepare any missing recipient
emails, ask me once whether to use a saved template or custom content if I have
not already chosen, then create it without asking me to repeat or reconfirm
this request.

@pluto Express interest in this candidate for the Senior Engineer role.

@pluto Cancel my outbound campaign for the payments role.
```

## Credits and privacy

- Search planning and revision do not use credits.
- Each in-network candidate presented in search uses one shared organization
  credit. Out-of-network search results are free.
- Email enrichment starts one asynchronous operation for 1–500 explicitly
  selected candidates or directly supplied LinkedIn profiles and polls it to
  completion. Returned addresses are work or personal emails, each labeled
  with its type, source status, and independent verification result.
- A successful email lookup can use one credit for that candidate. It uses
  none when the candidate already has an accepted TalentPluto profile, when
  reusing an earlier successful lookup, or when no email is found.
- An explicit campaign request reuses completed email-enrichment results and
  runs one prerequisite enrichment batch only for selected recipients still
  missing them. Pluto states the maximum first; each new successful lookup may
  use one shared organization credit, while reuse consumes no new lookup
  credit.
- Small lookup (`small_lookup`) runs one asynchronous operation for 1–100
  supplied profile URLs, reuses a stored profile fetched within the last 3
  months, and uses one shared organization credit per newly admitted profile.
  An exact retry uses no additional credits. It returns public profile details,
  not contact information.
- Medium lookup (`medium_lookup`) runs one asynchronous operation for 1–50
  explicitly selected LinkedIn profiles and costs exactly three shared
  organization credits per profile, up to 150 credits for a maximum batch. It
  combines identity-safe professional profile lookup and derived company
  bands and signals for up to 50 profile-identified employment companies per
  candidate, and returns no emails. Companies without
  a stable profile-supplied identifier remain `identifier_unavailable` rather
  than being guessed by name. Company output is derived recruiter intelligence,
  not raw source records or precise headcount, funding, location, or financing
  details.
- Heavy lookup (`heavy_lookup`) runs the same
  one-operation batch shape for 1–50 explicitly selected profiles and costs
  exactly five shared organization credits per profile, up to 250 credits for a
  maximum batch. It returns the deep package plus cited public-web findings
  about the person; findings are public citations with titles and URLs, never
  verified facts, and never contact information.
- The team-connection skill enriches 1–100 supplied profiles, reads the stored
  aggregate Team DNA projection, and compares explicit professional facts.
  Newly admitted profile enrichment uses one credit per submitted URL; an exact
  retry uses no additional credits. The Team DNA read uses none. It can cite a
  returned public founder background, but it never identifies non-founder
  members, verifies a personal relationship, or offers a warm-introduction
  path.
- Rubric company preferences are informational context only. They never add or
  subtract points, satisfy criteria, or affect eligibility. Case-insensitive
  duplicates collapse to the strongest priority. Avoid wins when the same
  employer appears in both lists.
- Rubric creation, replacement, and retrieval remain content-neutral through
  existing normalization. Role context, criteria and evidence guides, scoring
  notes, preferred and avoided company entries, and profile exclusions remain
  stored and round-trippable without policy-based rejection, rewriting, or
  omission.
- Saved-rubric scoring treats every score-affecting item as unvalidated until
  the server returns an affirmative professional-policy disposition and an
  approved effective scorecard. Ineligible, review-required, ambiguous,
  undisposed, or policy-resolution-failed authored content remains stored but
  blocks candidate scoring until it is resolved. Company-list entries stay
  outside scoring regardless of priority.
- A server-approved professional exclusion has its own criterion in scouting.
  It remains unverified; its narrative can flag evidence or an open screening
  question but never establishes a pass or failure. Historical V2 exclusion
  results retain their grounded exact excerpts and source labels.
- Saved-rubric scoring reuses completed `small_lookup`, `medium_lookup`, or
  `heavy_lookup` profile snapshots. For at most 10 profiles from one completed
  lookup, `get_rubrics` hands the selection to the durable scorer and returns
  a `scoring` operation within seconds; the scores arrive through
  `get_operation_status`, and an identical repeat returns the same operation.
  Larger or multi-source selections use one read-only `score_rubric_candidates`
  operation for up to 200 profiles across up to 10 completed lookups, polled
  through `get_operation_status`. Medium and heavy snapshots retain their
  privacy-filtered company and public-web evidence. Completed compatible
  lookups are reused. New scoring-only profile work defaults to heavy lookup at
  exactly five shared organization candidate credits per newly admitted
  profile. For explicit employer-related criteria, the server
  reuses company profiles already present in medium or heavy snapshots, then
  resolves and fetches the remaining unique exact profile-identified employers
  once in bounded batches through the structured company path used by search.
  It does not run broad or natural-language company searches. Every
  company-evidence item remains bound to the criterion that requested it
  instead of becoming a general prestige score. The server serializes durable
  scoring jobs, evaluates sequential waves of up to 20 candidates, and retries
  invalid authored-criterion coverage and citations within Luna's bounded
  recovery path before recording a processing failure. The connector never
  recomputes, ranks, retries, or drops returned per-candidate results. Contract
  4.41.0 returns `rubric-v3-scouting.1`: `score` and `overallScore` are the same
  holistic Luna scouting estimate. The native receipt includes confidence,
  narratives and citations for every authored criterion, reasons, and the
  critical unknown. The entire supplied work history, descriptions, dates,
  education, skills, and summary travel through private scoring snapshots.
  Presentation highlights never replace the history; oversized or unavailable
  complete snapshots fail explicitly without silent truncation. Verification
  is not run. Criterion scores, coverage, and alignment bounds are null;
  eligibility and prerequisites remain unverified. Scouting is for human review
  and never authorizes automatic promotion. Historical `evidence-aware-v2`
  receipts retain their original overall comparison, observed alignment,
  coverage, and unknowns.
- Candidate scoring reads your company's stored, bounded Team DNA projection
  and saved rubrics without candidate credits. New scoring-only profile work
  defaults to heavy lookup at five credits per admitted URL so company and
  public-web evidence are available. Compatible completed lookups are reused,
  and an exact retry uses no additional credits. Scores are separate 0-100
  measures of cited professional overlap —
  background familiarity with your team, evidence-verified match to your job
  description, or a scouting estimate against your saved rubric — never a
  culture-fit judgment, protected-trait proxy, rejection, or hiring decision,
  and non-founder employees appear only
  as aggregate patterns.
- Connected-inbox campaigns are always one email per recipient. Pluto creates
  one Gmail draft per recipient in the selected authorized inbox belonging to
  the requester or a coworker after copy generation, and each draft is sent
  manually from Gmail.
- Cancelling a campaign permanently stops its remaining scheduled emails and
  any still-pending Gmail draft preparation. It does not recall emails already
  sent or remove drafts already created in Gmail, and the campaign stays
  visible in Pluto as Stopped.
- Market snapshots use aggregated data and omit metrics that do not meet
  privacy thresholds.
- Private candidate questions return a bounded answer, not the candidate's raw
  private information.

## Connection help

- If Pluto's tools are missing, its connection-recovery skill checks the live
  tool catalog and current startup status or local logs. Installed skill files
  can still load when the authenticated tool connection fails.
- For a confirmed authentication failure, Codex uses **Connect Pluto** when
  available or starts `mcp login pluto` with the current host's Codex executable.
  Desktop recovery uses the app's bundled CLI; a separate older CLI on PATH can
  save credentials that the app cannot refresh. Claude Code uses `/mcp`. You
  complete the browser sign-in, organization selection, and consent.
- After sign-in or a connection reload, the agent verifies a read before
  resuming your task. Login success or visible tool names alone do not prove
  that a closed connection recovered.
- Existing operation and request IDs are preserved. Recovery resumes submitted
  jobs rather than starting duplicate paid work. A `Transport closed` error
  alone does not establish an authentication failure.
- The same recovery rules apply to every operation: preserve sessions and
  cursors for reads, poll submitted jobs, replay only documented deduplicated
  requests with identical inputs, and reconcile uncertain writes before any
  repeat. Transient failures use bounded retries and the server's retry delay;
  terminal outcomes and unresolved external effects are not replayed blindly.
- If Pluto is still unavailable in a fresh task and there is no authentication
  error after checking startup diagnostics, restart the client once. A rejected
  refresh token requires sign-in; a restart alone will not repair it.

Routine server updates do not require reinstalling Pluto or signing in again.

Maintaining the connector? See [Maintainer notes](MAINTAINING.md).
