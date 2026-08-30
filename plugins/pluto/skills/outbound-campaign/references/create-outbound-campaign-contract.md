# Outbound campaign contract

Use this reference only for internal validation and tool mapping. Keep schema
names and opaque values out of normal user-facing conversation. The sections
through request identity cover `create_outbound_campaign`; the saved-template
and cancellation sections cover their respective tools.

## Audience and campaign boundaries

- `campaignName` must contain from 1 through 160 characters after trimming.
- Accept one to 100 explicitly selected candidates regardless of network
  status.
- Use the fresh `candidateRef` and `selectionToken` returned together by a
  completed email-enrichment result. A legacy discovery pair can start the
  prerequisite enrichment operation but is not itself proof that email
  enrichment completed.
- An explicit request to create, make, start, launch, or send a campaign
  authorizes both one campaign creation and one prerequisite email-enrichment
  batch for selected recipients who do not already have reusable completed
  results. State the missing-recipient count and maximum one shared
  organization credit per new lookup in a compact progress update, then run the
  batch without another approval question unless the user set a conflicting
  no-spend boundary.
- A clear create, make, start, launch, or send request remains the authorization
  through prerequisite enrichment, required clarifications, user-authorized
  audience corrections, template loading, and edits within the requested
  campaign. Do not ask the user to reconfirm merely because settings or copy
  were not displayed earlier. Ask whether to create only when creation intent is
  genuinely ambiguous. When a required material detail remains unauthorized or
  the assembled campaign materially differs from the request, ask one focused
  material-choice question rather than another creation confirmation; once the
  user authorizes that choice, continue under the existing creation intent. A
  draft-only or review-only request ends with the requested artifact, not a
  launch question.
- A candidate presented by the current search surface carries no handles. Use
  the card's returned `profileUrl` only as the direct-URL input to prerequisite
  `enrich_email`; after completion, build the campaign from the newly minted
  handle pair. Never pass a profile URL to `create_outbound_campaign`.
- Each `candidateRef` may appear only once.
- Preserve every handle pair together, unchanged, hidden, and in selected
  order. Never substitute a name, LinkedIn URL, email, internal ID, or stale
  token.
- Enrich only recipients without reusable completed results. For a mixed
  audience, call `enrich_email` once with only the missing subset and reuse
  every prior successful handle unchanged. Keep returned addresses private
  unless the user separately asked to receive them; the campaign-preparation
  route does not render the candidate-interest table or CSV.
- Campaign creation still revalidates address freshness, contactability,
  identity, prior enrollment, and recipient-policy eligibility. Passing a
  completed enrichment handle reuses its committed disclosure without another
  contact lookup or credit.
- Successful enrichment handles may be used for campaign creation regardless
  of network status. Preserve the complete selected audience without asking
  the user to remove in-network candidates.
- Every selected recipient must have a usable handle pair before the campaign
  request can be built. If prerequisite enrichment does not return one for any
  item, no campaign-creation call occurs; relay only that item's displayed name
  and safe outcome, then ask whether to remove or replace only that recipient.
  This is a necessary audience clarification, not a new creation confirmation.
  A user-authorized changed audience preserves active creation intent. This
  handle-admission failure is distinct from the private recipient-policy
  outcomes below.
- An account or login email may be visible in enrichment results but is never
  eligible for campaign delivery, even when independently validated.
- Recipient-policy outcomes can retain a safe subset without changing the
  authorized request. Relay the returned aggregate coverage message, including
  requested, included, and excluded counts, without exposing contact data,
  provider details, or suppression reasons. Do not ask the user to reconfirm
  the audience. When no campaign-safe recipient remains, the operation fails
  and creates no campaign; relay that safe failure and never claim success.
- Ask before repeating a metered discovery or enrichment operation for an
  expired or missing handle.
- Ask the user to reduce an audience over 100. Do not split it automatically.
- One exact outreach role applies to the campaign. It is copy context only.
  Never look up or pass `projectId`.
- Do not ask for or pass `campaignType`. The server records MCP campaigns as
  cold outreach.

## Campaign setup lookup

Call `get_outbound_campaign_setup` once before drafting when the live catalog
exposes it. The input is empty and the result is read-only:

- `emailPriority` is the organization's current Campaigns default.
- `senderOptions` contains up to 100 authorized active Gmail choices. Each
  safe option has an email, optional display name, private `connectionId`, and
  `ownership` of `current_user` or `coworker`.
- `templates` contains organization-shared summaries with private `templateId`
  and `updatedAt`; it deliberately excludes reusable copy and generation
  instructions.

Use these values as editable prefill in the complete campaign definition. If
the user has not already chosen campaign content and templates are available,
ask once whether to use one of the named templates or create custom content.
Load only the template the user selects through
`get_outbound_campaign_templates` with its private ID before using its exact
`sequenceSettings`. A clearly matching template may be suggested first but is
never selected automatically. The setup lookup never creates a campaign and
does not require separate user approval. Answering this necessary content
question preserves any earlier explicit creation intent.

## Delivery mapping

Pass exactly one delivery object:

- Pluto-managed delivery: `delivery: { method: 'talentpluto' }`
- Connected Gmail drafts:
  `delivery: { method: 'connected_inbox', connectionId }`
- Compatibility-only managed alias:
  `delivery: { method: 'client_campaign_inbox' }`

For connected Gmail drafts, pair the private `connectionId` only with its safe
email and ownership label from trusted context or a `needs_sender` response.
Never place two delivery routes or two senders in one campaign. For managed
delivery, never pass an inbox identifier: the server verifies current
organization eligibility, selects one inbox from the managed pool, and pins it
to the campaign. Use `talentpluto` for new managed campaigns. Treat
`client_campaign_inbox` as the same pool rather than a separate user choice,
and preserve it only for an unchanged retry that already used that alias.

Connected-inbox copy must represent the real person and organization behind
that inbox. Never write as TalentPluto unless it is the sender's actual
organization, and never impersonate an employee of a separate hiring company.
Describe the sender as recruiting for or working with that company when
appropriate. Do not add TalentPluto's managed-delivery mailing-address or
unsubscribe footer.

For normal connected-inbox creation, use a `connectionId` returned by
`get_outbound_campaign_setup`. Omitting it is only a recovery fallback when
setup context was unavailable or changed; the tool can then return
`needs_sender` without creating a campaign. After a returned sender is
selected, never omit its connection ID.

Connected Gmail drafts are single-email only. If a saved template contains
follow-ups, treat the one-email version as a material difference that must be
authorized, or use managed delivery. Never silently truncate the defined
sequence.

Managed campaign copy uses the recruiting organization's perspective. Use
`{senderName}` rather than inventing a managed inbox identity. Both managed
method values remain subject to private server-side delivery policy. Pool
composition, including temporary versus dedicated senders, is private server
state and never a user choice. Missing not-yet-ready capacity does not prevent
campaign creation; actual system or provider failures remain errors. Never
infer existing campaign or reply visibility from current eligibility,
describe managed routing as forwarding messages to another email address, or
mention an internal review, approval, confirmation, suppression, or wait to
the user.

## Sequence mapping

- `emailPriority` is optional. Use `work` or `personal` only for an explicit
  override. Omit it to inherit the organization's Campaigns
  configuration, including when a loaded template omitted it. The selected
  verified type is tried first and the other verified type remains a fallback.
  An unrequested change is a material difference that must be authorized; a
  requested change does not erase active creation intent.
- `connected_inbox` requires `totalStepCount: 1` and `followUpDelays: []`.
  Omit `followUpTemplates` and `followUpSendTimes`, or pass them as empty
  arrays. The server rejects every multi-step connected-inbox campaign.
- For managed routes, `totalStepCount` is the total number of emails, including
  the initial email, and must be from 1 through 21.
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
- `templateVariableOverrides` accepts up to 24 campaign-wide values. Each key
  is at most 64 characters, begins with a letter, and contains only letters,
  numbers, or underscores. Each trimmed value is non-empty and at most 240
  characters.

For recipient-specific generation, omit the corresponding template field and
put that step's numbered purpose in `generationPrompt`.

For exact shared copy, put the reviewed sendable copy in the corresponding
template field. A fully templated campaign still needs a `generationPrompt`
that records the opportunity, audience, tone, factual boundaries, purpose of
each step, and call to action.

Every non-empty body template for `connected_inbox`, `talentpluto`, or
`client_campaign_inbox` must include `{senderName}`. Never hard-code a person's
name in any route's signoff.

For a hybrid campaign:

- The initial subject and body may use different representations.
- `followUpTemplates`, when present, must contain exactly one item per
  follow-up. Use an empty object for a generated follow-up so later indices
  remain aligned.
- Omit the entire `followUpTemplates` array when every follow-up is generated.

Never put an instruction such as “write a friendly follow-up” in a template
field.

## Template variables

Built-in variables are:

`{firstName}`, `{lastName}`, `{fullName}`, `{candidateCompany}`,
`{senderName}`, `{companyName}`, `{roleTitle}`

`{companyName}` means the recruiting organization or company.
`{candidateCompany}` means the recipient's company. Candidate built-ins
resolve per recipient unless an explicit campaign-wide override replaces them.
`{senderName}` always resolves from the selected sender, is reserved, and
cannot appear in `templateVariableOverrides`.

Users may define arbitrary additional variables that satisfy the key and value
limits above. Every custom placeholder in fixed copy must have an exact
matching key in `templateVariableOverrides`. Do not use `{projectName}`.
Single braces are required; double braces and malformed placeholders are
invalid. An override does not change candidate source data or generated
instructions.

## Request identity and response handling

- Generate a fresh random UUID for the initial creation call.
- Reuse it only for either:
  - a `needs_sender` continuation after the user selects one returned sender;
    when original creation intent remains active, give a compact updated
    summary and retry without another creation confirmation; or
  - a user-directed retry of the exact unchanged campaign, including when the
    tool says to retry shortly with the same request ID.
- Use a fresh UUID for another campaign or any material setup change outside
  the explicit sender continuation, including a recipient email-priority
  change.
- Never automatically retry an ambiguous timeout or transport failure.
- Call the tool once for each explicitly authorized campaign. Do not merge
  separate campaign requests.
- The prerequisite email-enrichment batch may use up to one shared
  organization credit for each recipient needing a new lookup. Campaign
  creation reuses every successful-enrichment disclosure without a second
  lookup credit.
- Only a fresh campaign-safe verified address is eligible. An enrichment result
  alone does not establish campaign eligibility.
- A `queued` result returns an opaque `operationId` with `retryAfterMs`. Keep the
  operation ID hidden, wait at least `retryAfterMs`, and poll
  `get_operation_status` with it unchanged while status is `queued` or
  `running`. Every response must echo that unchanged `operationId` and carry
  `operationType: outbound_campaign`. Continue automatically until
  `completed` or `failed`; do not impose a caller-side poll cap or ask the user
  to continue. Polling is idempotent and never creates another campaign, but it
  may recover a lost enqueue and is therefore not purely read-only.
- Completion means the campaign exists and personalized copy generation was
  queued after private recipient-policy handling. It does not mean copy
  generation, connected-inbox draft creation, or delivery completed.
- On `completed` or `success`, repeat the tool's message and any returned
  aggregate coverage message exactly unless a
  legacy managed-route result mentions internal review, approval,
  confirmation, or waiting. Normalize that legacy result to **Campaign created
  successfully. We'll take care of the rest.** The result does not confirm
  that an email was sent, delivered, internally approved, or manually sent
  from Gmail.
- Never call `create_outbound_campaign` again to check on a queued campaign,
  and never restart a `failed` creation operation automatically.

## Saved campaign templates

- Call `get_outbound_campaign_templates` without `templateId` to list bounded
  summaries, then with the selected private `templateId` to load the complete
  `sequenceSettings`. Keep `templateId` and `updatedAt` hidden.
- If the user did not already choose campaign content, present the available
  template names and custom content in one compact question. Custom content may
  be exact copy or instructions from the user, or Pluto-drafted copy from known
  context. Choosing either path alone does not establish creation intent, but
  it preserves an earlier explicit request to create the campaign.
- A loaded template is editable prefill, not creation intent by itself. An
  explicit request to create a campaign using that template authorizes the
  exact loaded settings without a post-load confirmation. Preserve all loaded
  settings and whether `emailPriority` is absent (organization-default
  inheritance) or present (template override) until the user requests a
  change. Campaign creation receives the defined `sequenceSettings`, never a
  `templateId`.
- A template stores reusable generation guidance, fixed copy, variable
  overrides, step count, cadence, optional send times, and optional email
  priority. It excludes recipients, handles, campaign name, delivery route,
  and sender inbox.
- Call `save_reusable_outreach_template` only for an explicit request to save
  or update the exact reviewed reusable settings. Immediately before asking
  for confirmation, state that this saves template prefill only and does not
  create a campaign, add recipients, prepare drafts, schedule follow-ups, or
  send email. Ask **Save this reusable template?** and treat template approval
  as separate from campaign launch approval. Omit `templateId` and
  `expectedUpdatedAt` for a new save. For an update, load the exact template
  first and pass both its private `templateId` and unchanged `updatedAt`. A
  `stale` or `name_conflict` result means no write occurred; load and review
  the relevant current template before asking again. After success, state that
  the reusable template was saved and no campaign was created.
- Call `delete_outbound_campaign_template` only after loading the exact
  template and obtaining explicit deletion confirmation. Pass its private
  `templateId` and unchanged `updatedAt`. A `stale` result deletes nothing and
  requires a fresh load and confirmation. Deletion is irreversible but does
  not modify campaigns already created from the template.

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
- Cancellation is one-way. Remaining managed sends and any still-pending
  connected-inbox draft preparation stop, and this tool cannot resume or
  restart the campaign.
  It does not recall emails already sent, does not remove Gmail drafts already
  created in a connected inbox, and does not delete the campaign, which stays
  visible in Pluto Campaigns as Stopped.
- A repeat cancel of the same campaign is safe to direct after an ambiguous
  failure: a campaign that already stopped reports `already_cancelled`.
- On a blocked or failed result, relay the safe returned reason and do not
  claim the campaign was cancelled.
