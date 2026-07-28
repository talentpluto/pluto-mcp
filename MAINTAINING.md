# Maintaining Pluto

The customer-facing setup and product overview live in
[README.md](README.md). This file contains connector packaging and
authentication details for maintainers.

## Packaging

The plugin ships dual packaging over one shared `plugins/pluto` directory.

- Codex reads `.agents/plugins/marketplace.json`,
  `plugins/pluto/.codex-plugin/plugin.json`, and `plugins/pluto/.mcp.json`.
- Claude Code reads `.claude-plugin/marketplace.json` and
  `plugins/pluto/.claude-plugin/plugin.json`. Its inline MCP config uses the
  same OAuth permissions, discovers the resource from server metadata, and
  intentionally omits the Codex-only OAuth compatibility header.
- Guidance in `plugins/pluto/skills` is shared by both clients and must remain
  client-neutral.

Keep the two plugin manifests' name, version, and server URL in sync.

## OAuth callbacks

Anthropic uses different OAuth callbacks across client surfaces:

- Hosted Claude and Claude Desktop use
  `https://claude.ai/api/mcp/auth_callback`. Keep it and the documented future
  callback, `https://claude.com/api/mcp/auth_callback`, in the production
  `CANDIDATE_MCP_OAUTH_REDIRECT_URI_ALLOWLIST`.
- Claude Code uses `http://localhost:<port>/callback`. Keep the portless
  `http://localhost/callback` template in
  `CANDIDATE_MCP_OAUTH_LOOPBACK_REDIRECT_URI_ALLOWLIST`.

If hosted Claude suggests adding an OAuth Client ID during registration,
verify the exact callback allowlist and redeploy the server. Pluto supports
dynamic client registration, so a static Client ID is not the normal recovery.

## Release boundaries

Keep the `pluto` server name, URL, OAuth resource, scopes, compatibility
headers, and install-time authentication policy stable. Routine capabilities
belong in the TalentPluto MCP server. Update the plugin version only when the
bundled plugin guidance changes.
