# Pluto MCP

Pluto adds candidate discovery, monthly credit-balance lookup, and explicit
candidate-interest actions to Codex through TalentPluto.

## Install

### Codex desktop

Add the `talentpluto/pluto-mcp` marketplace, install **Pluto**, and complete the
TalentPluto sign-in when prompted. Then fully quit and reopen Codex and start a
new task.

### Codex CLI

Run these commands once:

```bash
codex plugin marketplace add talentpluto/pluto-mcp
codex plugin add pluto@talentpluto
codex mcp login pluto
```

Then start a new Codex session. The TalentPluto account used to sign in must
belong to an organization with Candidate MCP access enabled.

That is the complete normal setup. Pluto requests `candidates:read`,
`candidates:outbound`, and `offline_access`. The outbound permission is used
only after you explicitly select a discovered candidate and ask Pluto to act;
it does not authorize automatic candidate selection or an external-candidate
email campaign.
`offline_access` lets Codex refresh expired access tokens without asking you to
sign in again. Codex's default `auto` credential store uses the OS keyring when
available and otherwise falls back to its persistent credential file; no
credential-store setting is normally needed.

### Upgrading from 0.1.6 or earlier

Pluto 0.1.7 adds the `candidates:outbound` permission. An existing dynamic
client, consent, access token, or refresh token cannot gain that scope through
an ordinary refresh. After upgrading and reinstalling Pluto, make this one-time,
user-directed reconnect, approve the new permission, then fully restart Codex
and start a new task:

```bash
codex plugin marketplace upgrade talentpluto
codex plugin add pluto@talentpluto
codex mcp logout pluto
codex mcp login pluto
```

Do not automate the logout. It is required here only because the user must
explicitly approve the newly added permission.

## Use

### Discover candidates

```text
@pluto Find account executives in New York with at least three years of experience.
```

### Check credits

```text
@pluto How many credits do I have left, and when do they reset?
```

### Express candidate interest

After choosing one candidate from Pluto's results:

```text
@pluto Express interest in Jordan Lee from the Pluto results for the Senior Account Executive role.
```

Candidate discovery consumes monthly credits. Credit-balance lookup calls
`get_credit_balance` without a user or organization ID and reports the exact
`monthlyCredits`, `remainingCredits`, and `resetsAt` values returned by Pluto.

Candidate interest runs only after an explicit selection. For an internal
candidate, it can add or reuse the candidate in the selected role's normal
prospecting flow, send the normal reconfirm-interest message, and mark them for
automatic sharing after Ready to Submit. For an external candidate, it can run
a fresh professional contact lookup, store the committed disclosure, and return
that one email to the authorized user. It does not create or send an outreach
campaign, start onboarding, or return phone numbers.

The underlying action is `express_candidate_interest`. It is non-idempotent, so
Pluto does not automatically retry an ambiguous failure.

Pluto does not expose private notes, resumes, transcripts, account identifiers,
authentication metadata, raw provider data, or uncommitted contact results. Its
skills fail closed when their tools are unavailable and do not block unrelated
Codex tasks.

## If Pluto is unavailable

Use the first step that matches what Codex reports:

1. **Pluto was just installed, upgraded, or reconnected:** fully quit and
   reopen Codex, then start a new task.
2. **Codex asks you to sign in or reconnect:** run `codex mcp login pluto`, then
   restart Codex and start a new task. Do not log out first.
3. **Codex says a Pluto tool is unavailable in the current version:** run the
   commands below, then restart Codex and start a new task.

   ```bash
   codex plugin marketplace upgrade talentpluto
   codex plugin add pluto@talentpluto
   ```

4. **Candidate interest reports a missing permission after upgrading from
   0.1.6 or earlier:** complete the one-time scope reconnect above. A refresh
   token cannot add `candidates:outbound` to the old grant.
5. **A normal login still fails because the saved grant is invalid or revoked:**
   reset only Pluto's saved authorization, then restart Codex and start a new
   task.

   ```bash
   codex mcp logout pluto
   codex mcp login pluto
   ```

Never automate logout during installation, startup, or an ordinary upgrade.
Only the explicit 0.1.7 scope migration above or a genuinely invalid saved grant
requires the user to remove Pluto's saved authorization.

## Maintainers

Pluto connects to `https://app.talentpluto.com/api/mcp` with OAuth. This
repository contains no credentials or API keys.
