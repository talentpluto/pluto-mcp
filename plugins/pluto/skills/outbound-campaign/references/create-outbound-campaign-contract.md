# Outbound campaign contract

Use this reference only for internal validation and tool mapping. Keep schema
names and opaque values out of normal user-facing conversation. The sections
through request identity cover `create_outbound_campaign`; the final section
covers `cancel_outbound_campaign`.

## Audience and campaign boundaries

- `campaignName` must contain from 1 through 160 characters after trimming.
- Accept one to 100 explicitly selected out-of-network candidates.
- Use a candidate returned by `discover_candidates`, or the fresh
  `candidateRef` and `selectionToken` returned by completed email enrichment.
- Each `candidateRef` may appear only once.
- Preserve every handle pair together, unchanged, hidden, and in selected
  order. Never substitute a name, LinkedIn URL, email, internal ID, or stale
  token.
- Campaign creation performs its own contact preparation. Do not call email
  enrichment first unless the user separately asked to receive email
  addresses. Reuse a successful enrichment handle when one already exists.
- Successful enrichment does not make an in-network candidate eligible for a
  campaign. If a mixed audience contains a known in-network candidate, ask
  whether to continue with only the selected external candidates.
- A direct-URL enrichment handle whose network status was previously unknown
  may be passed for server reauthorization. A known in-network candidate still
  fails closed.
- An account or login email may be visible in enrichment results but is never
  eligible for campaign delivery, even when independently validated.
- Do not silently omit an invalid selection. Ask before repeating a metered
  discovery or enrichment operation for an expired or missing handle.
- Ask the user to reduce an audience over 100. Do not split it automatically.
- One exact outreach role applies to the campaign. It is copy context only.
  Never look up or pass `projectId`.
- Do not ask for or pass `campaignType`. The server records MCP campaigns as
  cold outreach.

## Delivery mapping

Pass exactly one delivery object:

- TalentPluto-managed: `delivery: { method: 'talentpluto' }`
- Connected inbox:
  `delivery: { method: 'connected_inbox', connectionId }`

For a connected inbox, pair the private `connectionId` only with its safe email
from trusted context or a `needs_sender` response. Never place two delivery
routes or two senders in one campaign.

Connected-inbox copy must represent the real person and organization behind
that inbox. Never write as TalentPluto unless it is the sender's actual
organization, and never impersonate an employee of a separate hiring company.
Describe the sender as recruiting for or working with that company when
appropriate. Do not add TalentPluto's managed-delivery mailing-address or
unsubscribe footer.

When the user chose connected-inbox delivery but no authorized sender is
known, the first confirmed call may omit `connectionId`. The tool can then
return `needs_sender` without creating a campaign. After a returned sender is
selected, never omit its connection ID.

Connected-inbox follow-up delays are measured from campaign creation. For
example, `[3, 7]` produces drafts on campaign days 3 and 10 whether or not the
preceding draft was sent.

## Sequence mapping

- `totalStepCount` is the total number of emails, including the initial email,
  and must be from 1 through 21.
- `followUpDelays` must contain exactly `totalStepCount - 1` whole-day values.
  Each delay is from 1 through 30 days after the preceding email.
- `followUpSendTimes`, when reviewed, must contain exactly one `HH:mm`
  America/New_York time per follow-up. Omit it when the user did not request
  exact times.
- `generationPrompt` is always required, must be from 1 through 4,000
  characters, and contains campaign context and writing instructions rather
  than sendable template copy.
- `initialSubjectTemplate` is at most 240 characters.
- `initialBodyTemplate` and every
  `followUpTemplates[].bodyTemplate` are at most 12,000 characters.
- `clientName`, `companyName`, `projectName`, and `roleTitle` values in
  `templateVariableOverrides` are each at most 240 characters.

For recipient-specific generation, omit the corresponding template field and
put that step's numbered purpose in `generationPrompt`.

For exact shared copy, put the reviewed sendable copy in the corresponding
template field. A fully templated campaign still needs a `generationPrompt`
that records the opportunity, audience, tone, factual boundaries, purpose of
each step, and call to action.

Every non-empty connected-inbox body template must include `{senderName}`.
Never hard-code a person's name in a connected-inbox signoff.

For a hybrid campaign:

- The initial subject and body may use different representations.
- `followUpTemplates`, when present, must contain exactly one item per
  follow-up. Use an empty object for a generated follow-up so later indices
  remain aligned.
- Omit the entire `followUpTemplates` array when every follow-up is generated.

Never put an instruction such as “write a friendly follow-up” in a template
field.

## Template variables

Allow only:

`{firstName}`, `{lastName}`, `{fullName}`, `{currentCompany}`, `{senderName}`,
`{companyName}`, `{clientName}`, `{roleTitle}`, `{projectName}`

`{firstName}`, `{lastName}`, `{fullName}`, `{currentCompany}`, and
`{senderName}` resolve from recipient or sender context.

Use `templateVariableOverrides` only for reviewed campaign-wide
`clientName`, `companyName`, `projectName`, and `roleTitle` values. An override
does not change candidate source data or generated instructions.

## Request identity and response handling

- Generate a fresh random UUID for the initial creation call.
- Reuse it only for either:
  - a `needs_sender` continuation after the user selects one returned sender,
    reviews the updated campaign, and confirms again; or
  - a user-directed retry of the exact unchanged campaign, including when the
    tool says to retry shortly with the same request ID.
- Use a fresh UUID for another campaign or any material setup change outside
  the explicit sender continuation.
- Never automatically retry an ambiguous timeout or transport failure.
- Call the tool once for each explicitly confirmed campaign. Do not merge
  separate reviewed campaigns.
- A candidate needing a new contact lookup may use up to one shared
  organization credit. A successful-enrichment handle reuses its committed
  contact without a new lookup credit.
- Only a fresh campaign-safe verified address is eligible. An enrichment result
  alone does not establish campaign eligibility.
- A `queued` result returns an opaque `jobId` with `retryAfterMs`. Keep the
  job ID hidden, wait at least `retryAfterMs`, and poll
  `get_outbound_campaign_job` with it unchanged while status is `queued` or
  `running`. Polling is read-only and never creates another campaign.
- Completion means the campaign and its eligible enrollments exist and
  personalized copy generation was queued in the background. It does not
  mean copy generation, Gmail draft creation, or delivery completed.
- On `completed` or `success`, repeat the tool's message exactly. The result
  does not confirm that an email was sent, delivered, internally approved, or
  manually sent from Gmail.
- Never call `create_outbound_campaign` again to check on a queued campaign,
  and never restart a `failed` creation job automatically.

## Campaign cancellation

`cancel_outbound_campaign` permanently stops one existing campaign. It shares
the `candidates:outbound` permission with creation but is otherwise separate:
it takes no request ID, candidate handles, or delivery fields.

- The input has two optional fields. `campaignId` is the opaque UUID of the
  exact campaign to cancel and is valid only when taken from this tool's own
  `needs_campaign` options. `campaignQuery` (1–120 characters after trimming)
  is a case-insensitive campaign-name filter applied only while listing and is
  ignored when `campaignId` is present.
- Always start without `campaignId`, even when the user named the campaign;
  use `campaignQuery` to narrow the listing instead.
- `needs_campaign` returns up to 20 of the most recently created cancellable
  campaigns and cancels nothing. Each option carries the hidden `campaignId`,
  `campaignStatus` (`draft`, `active`, or `paused` — the only cancellable
  statuses), `name`, `recipientCount`, `contactedCount` (recipients already
  sent at least one email), `createdAt`, and a nullable `nextScheduledAt`. The
  user must confirm one exact option before the cancelling call.
- When a user-named campaign is missing from an unfiltered listing, retry the
  listing with `campaignQuery` before concluding it is not cancellable; the
  listing is capped at the 20 most recently created.
- `cancelled` returns `campaignName`, `previousStatus` (the status before this
  cancellation), and `affectedRecipientCount` (recipients whose remaining
  scheduled emails were stopped) with a fixed confirmation message. Repeat the
  returned message exactly. An optional `warning` reports that some
  already-scheduled sends could not be confirmed as cancelled; when present,
  relay it verbatim.
- `already_cancelled` returns `campaignName` with a fixed message: the
  campaign was already stopped before this request.
- Cancellation is one-way. Remaining scheduled emails and future Gmail draft
  preparation stop, and this tool cannot resume or restart the campaign. It
  does not recall emails already sent, does not remove Gmail drafts already
  created in a connected inbox, and does not delete the campaign, which stays
  visible in Pluto Campaigns as Stopped.
- A repeat cancel of the same campaign is safe to direct after an ambiguous
  failure: a campaign that already stopped reports `already_cancelled`.
- On a blocked or failed result, relay the safe returned reason and do not
  claim the campaign was cancelled.
