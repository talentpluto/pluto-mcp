# Pluto MCP

Install the Pluto MCP plugin in Codex to discover candidates through
TalentPluto's read-only MCP server.

## Install

Add the TalentPluto marketplace:

```bash
codex plugin marketplace add talentpluto/pluto-mcp
```

Install Pluto and authenticate the MCP server:

```bash
codex plugin add pluto@talentpluto
codex mcp login pluto --scopes candidates:read,offline_access
```

Complete the TalentPluto OAuth flow when prompted by `codex mcp login`, then
restart Codex or start a fresh task so the Pluto tools are loaded. Your
TalentPluto account must belong to an organization with Candidate MCP access
enabled.

## Use

Mention Pluto in Codex and describe the candidates you want to find:

```text
@pluto Find account executives in New York with at least three years of experience.
```

Pluto exposes read-only candidate discovery. It does not expose contact
details, private recruiting notes, project pipelines, resumes, or transcripts.

## Connection

The plugin connects to:

```text
https://app.talentpluto.com/api/mcp
```

Authentication uses OAuth. This repository contains no credentials or API
keys.
