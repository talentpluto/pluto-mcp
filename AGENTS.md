# Repository instructions

Do not add test files, test packages, test scripts, test fixtures, test-specific
documentation, or CI workflows that run tests in this repository.

Treat Pluto as a stable, thin connector. Ship routine tools and behavior from
the TalentPluto MCP server; do not change the `pluto` server name, URL, OAuth
resource, scopes, compatibility headers, or `ON_INSTALL` policy unless an
explicit connector or permission-boundary migration requires it.

The plugin ships dual packaging over one shared `plugins/pluto` directory:
Codex reads `.agents/plugins/marketplace.json`,
`plugins/pluto/.codex-plugin/plugin.json`, and `plugins/pluto/.mcp.json`;
Claude Code reads `.claude-plugin/marketplace.json` and
`plugins/pluto/.claude-plugin/plugin.json`, which carries an inline MCP config.
Keep the two plugin manifests' name, version, and server URL in sync. Keep the
skills in `plugins/pluto/skills/` client-neutral — they are loaded by both
clients — and keep the Codex-only OAuth compatibility header out of the Claude
Code config.

Do not tell users to upgrade, reinstall, log out, or reconnect for routine
server updates or a missing tool alone. A newly deployed tool may require one
fresh task to refresh the live tool catalog. Keep the general routing skill
principles-only and do not turn it into a static tool catalog.
