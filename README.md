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
- Review and create an email campaign for selected out-of-network candidates,
  using either TalentPluto-managed delivery or one connected Gmail inbox.
- Cancel an existing outbound campaign after confirming the exact one,
  stopping its remaining scheduled emails.
- Express interest in an in-network candidate for an active role.
- Check your organization's shared Pluto credit balance.

## How candidate search works

1. **Describe the role.** Tell Pluto what is required, preferred, and out of
   scope, or paste the job description.
2. **Run the search.** Pluto retrieves and deduplicates candidates from its
   configured sources while the conversation automatically follows the durable
   job to completion.
3. **Review the leads.** The connected assistant presents every returned
   source-ranked lead using explicit professional profile facts and bounded
   Team DNA context. Missing evidence stays unknown.
4. **Choose what happens next.** Select candidates before asking Pluto to get
   contact details, create a campaign, answer a private question, or express
   interest.

Pluto does not change your pipeline or create a campaign from search results
alone. Consequential actions require an explicit request and, where
applicable, your review of the final setup.

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

@pluto Give me a directional US market snapshot for engineering talent.

@pluto How many Pluto credits does my organization have left?
```

After a search, select the relevant candidates before asking Pluto to continue:

```text
@pluto Get and verify the available emails for these candidates.

@pluto Create a campaign for these candidates. Prefill the basics, let me
choose whether to write exact shared copy, provide generation instructions, or
have Pluto draft the emails for me, then show the complete editable sequence
and ask me to confirm the final review.

@pluto Express interest in this candidate for the Senior Engineer role.

@pluto Cancel my outbound campaign for the payments role.
```

## Credits and privacy

- Search planning and revision do not use credits.
- Each in-network candidate presented in search uses one shared organization
  credit. Out-of-network search results are free.
- Email enrichment starts one asynchronous job for 1–500 explicitly selected
  candidates or directly supplied LinkedIn profiles and polls it to completion.
  The legacy synchronous fallback accepts at most 100. Returned addresses are
  work or personal emails, each labeled with its type, source status, and
  independent verification result.
- A successful email lookup can use one credit for that candidate. It uses
  none when the candidate already has an accepted TalentPluto profile, when
  reusing an earlier successful lookup, or when no email is found.
- LinkedIn profile enrichment runs one asynchronous job for 1–100 supplied
  profile URLs, reuses a stored profile fetched within the last 3 months, and
  uses no candidate credits. It returns public profile details, not contact
  information.
- Connected-inbox campaigns create the first Gmail draft after copy generation
  and later drafts one at a time on cumulative days measured from campaign
  creation. Each draft is sent manually from Gmail.
- Cancelling a campaign permanently stops its remaining scheduled emails and
  future Gmail draft preparation. It does not recall emails already sent or
  remove drafts already created in Gmail, and the campaign stays visible in
  Pluto as Stopped.
- Market snapshots use aggregated data and omit metrics that do not meet
  privacy thresholds.
- Private candidate questions return a bounded answer, not the candidate's raw
  private information.

## Connection help

- If Pluto is missing from a task that was already open, start one new task or
  session to refresh the available tools.
- Sign in again only when Codex or Claude Code reports an authentication
  problem. Use **Connect Pluto** in Codex desktop, `codex mcp login pluto` in
  the Codex CLI, or `/mcp` in Claude Code.
- If Pluto is still unavailable in a fresh task and there is no authentication
  error, restart the client once.

Routine server updates do not require reinstalling Pluto or signing in again.

Maintaining the connector? See [Maintainer notes](MAINTAINING.md).
