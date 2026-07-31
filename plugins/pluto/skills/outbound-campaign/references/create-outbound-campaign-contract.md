# Create outbound campaign contract

Use this reference only for internal validation and tool mapping. Keep schema
names and opaque values out of normal user-facing conversation.

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
- On `success`, repeat the tool's message exactly. The result does not confirm
  that an email was sent, delivered, internally approved, or manually sent
  from Gmail.
