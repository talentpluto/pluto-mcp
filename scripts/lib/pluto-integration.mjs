import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import readline from "node:readline";

export const PLUTO_SERVER_NAME = "pluto";
export const PLUTO_MCP_URL = "https://app.talentpluto.com/api/mcp";
export const PLUTO_COMPATIBILITY_HEADER = {
  "x-talentpluto-codex-oauth-compatibility": "missing-callback-issuer-v1",
};
export const MCP_PROTOCOL_VERSION = "2025-06-18";

const TOOL_METADATA_FIELDS = [
  "title",
  "inputSchema",
  "outputSchema",
  "annotations",
  "icons",
];

const RESERVED_CONNECTOR_META_KEYS = new Set([
  "connector_id",
  "connector_name",
  "connector_display_name",
  "connector_description",
  "connectorDescription",
]);

const PLUTO_PLUGIN_DISPLAY_NAME = "Pluto";
const EXPECTED_SKILL_METADATA = `interface:
  display_name: "Pluto candidate discovery"
  short_description: "Find and assess candidates with Pluto"
  default_prompt: "Use $candidate-discovery to find and assess candidates with Pluto."

dependencies:
  tools:
    - type: "mcp"
      value: "pluto"
      description: "Pluto's authenticated, read-only candidate discovery MCP server"
      transport: "streamable_http"
      url: "https://app.talentpluto.com/api/mcp"
`;

export class McpAuthenticationError extends Error {
  constructor(status) {
    super(
      `Pluto authentication is required or invalid (HTTP ${status}). Reconnect the isolated test credential before retrying.`,
    );
    this.name = "McpAuthenticationError";
    this.status = status;
  }
}

function assertNonEmptyString(value, label) {
  assert.equal(typeof value, "string", `${label} must be a string`);
  assert.notEqual(value.trim(), "", `${label} must not be empty`);
}

function jsonRpcMessagesFromPayload(payload) {
  const parsed = JSON.parse(payload);
  return Array.isArray(parsed) ? parsed : [parsed];
}

function jsonRpcMessageFromBody(body, expectedId) {
  if (body.trim() === "") {
    return null;
  }

  const messages = jsonRpcMessagesFromPayload(body);

  if (expectedId === null) {
    return messages.at(-1) ?? null;
  }

  const message = messages.find((candidate) => candidate?.id === expectedId);
  assert.ok(message, `MCP response did not contain JSON-RPC id ${expectedId}`);
  return message;
}

function jsonRpcMessagesFromSseEvent(event) {
  const data = event
    .split(/\r\n|\r|\n/u)
    .filter((line) => line.startsWith("data:"))
    .map((line) => {
      const value = line.slice(5);
      return value.startsWith(" ") ? value.slice(1) : value;
    })
    .join("\n");

  if (data === "" || data === "[DONE]") {
    return [];
  }
  return jsonRpcMessagesFromPayload(data);
}

function takeNextSseEvent(buffer, flush = false) {
  const boundary = /\r\n\r\n|\n\n|\r\r/u.exec(buffer);
  if (!boundary) {
    return flush && buffer !== ""
      ? { event: buffer, remaining: "" }
      : null;
  }
  return {
    event: buffer.slice(0, boundary.index),
    remaining: buffer.slice(boundary.index + boundary[0].length),
  };
}

async function readJsonRpcSseResponse(response, expectedId) {
  if (expectedId === null) {
    await response.body?.cancel();
    return null;
  }

  assert.ok(response.body, "Pluto MCP SSE response body is missing");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    for (;;) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });

      for (;;) {
        const next = takeNextSseEvent(buffer, done);
        if (!next) {
          break;
        }
        buffer = next.remaining;
        const message = jsonRpcMessagesFromSseEvent(next.event).find(
          (candidate) => candidate?.id === expectedId,
        );
        if (message) {
          return message;
        }
      }

      if (done) {
        assert.fail(`MCP SSE response did not contain JSON-RPC id ${expectedId}`);
      }
    }
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

async function readJsonRpcHttpResponse(response, expectedId) {

  if (response.status === 401 || response.status === 403) {
    throw new McpAuthenticationError(response.status);
  }

  if (!response.ok) {
    throw new Error(`Pluto MCP returned HTTP ${response.status}`);
  }

  const contentType = (response.headers.get("content-type") ?? "").toLowerCase();
  const message = contentType.includes("text/event-stream")
    ? await readJsonRpcSseResponse(response, expectedId)
    : jsonRpcMessageFromBody(await response.text(), expectedId);

  if (message?.error) {
    const code = message.error.code ?? "unknown";
    const detail =
      typeof message.error.message === "string"
        ? message.error.message.slice(0, 300)
        : "Unknown MCP error";
    throw new Error(`Pluto MCP JSON-RPC error ${code}: ${detail}`);
  }

  return message;
}

export async function collectPaginatedTools(requestPage) {
  const tools = [];
  const names = new Set();
  const seenCursors = new Set();
  let cursor;

  for (let pageNumber = 1; pageNumber <= 1_000; pageNumber += 1) {
    const result = await requestPage(cursor);
    assert.ok(result && typeof result === "object", "tools/list result is missing");
    assert.ok(Array.isArray(result.tools), "tools/list result.tools must be an array");

    for (const tool of result.tools) {
      assert.ok(tool && typeof tool === "object", "tools/list returned a non-object tool");
      assertNonEmptyString(tool.name, "tool.name");
      assert.ok(
        tool.inputSchema && typeof tool.inputSchema === "object",
        `Tool ${tool.name} is missing inputSchema metadata`,
      );
      assert.ok(!names.has(tool.name), `tools/list returned duplicate tool ${tool.name}`);
      names.add(tool.name);
      tools.push(tool);
    }

    const nextCursor = result.nextCursor;
    if (nextCursor === undefined || nextCursor === null) {
      return tools;
    }

    assert.equal(typeof nextCursor, "string", "tools/list nextCursor must be a string");
    assert.ok(!seenCursors.has(nextCursor), "tools/list returned a repeated pagination cursor");
    seenCursors.add(nextCursor);
    cursor = nextCursor;
  }

  throw new Error("tools/list exceeded 1,000 pages");
}

export async function listAllRemoteTools({
  accessToken,
  fetchImpl = fetch,
  timeoutMs = 30_000,
  url = PLUTO_MCP_URL,
}) {
  assertNonEmptyString(accessToken, "PLUTO_MCP_ACCESS_TOKEN");

  let requestId = 1;
  let sessionId;

  const post = async (payload, expectedId) => {
    const headers = {
      Accept: "application/json, text/event-stream",
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "MCP-Protocol-Version": MCP_PROTOCOL_VERSION,
      ...PLUTO_COMPATIBILITY_HEADER,
    };

    if (sessionId) {
      headers["Mcp-Session-Id"] = sessionId;
    }

    const response = await fetchImpl(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(timeoutMs),
    });

    sessionId = response.headers.get("mcp-session-id") ?? sessionId;
    return readJsonRpcHttpResponse(response, expectedId);
  };

  try {
    const initializeId = requestId;
    requestId += 1;
    const initialize = await post(
      {
        jsonrpc: "2.0",
        id: initializeId,
        method: "initialize",
        params: {
          protocolVersion: MCP_PROTOCOL_VERSION,
          capabilities: {},
          clientInfo: {
            name: "pluto-plugin-integration-health-check",
            version: "1.0.0",
          },
        },
      },
      initializeId,
    );

    assert.ok(initialize?.result, "Pluto MCP initialize result is missing");
    assert.equal(
      initialize.result.protocolVersion,
      MCP_PROTOCOL_VERSION,
      "Pluto MCP negotiated a protocol version that differs from Codex 0.145",
    );

    await post(
      {
        jsonrpc: "2.0",
        method: "notifications/initialized",
      },
      null,
    );

    return await collectPaginatedTools(async (cursor) => {
      const id = requestId;
      requestId += 1;
      const message = await post(
        {
          jsonrpc: "2.0",
          id,
          method: "tools/list",
          params: cursor === undefined ? {} : { cursor },
        },
        id,
      );
      assert.ok(message?.result, "Pluto tools/list result is missing");
      return message.result;
    });
  } finally {
    if (sessionId) {
      try {
        await fetchImpl(url, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "MCP-Protocol-Version": MCP_PROTOCOL_VERSION,
            "Mcp-Session-Id": sessionId,
            ...PLUTO_COMPATIBILITY_HEADER,
          },
          signal: AbortSignal.timeout(timeoutMs),
        });
      } catch {
        // Session termination is best-effort and must not hide the health result.
      }
    }
  }
}

function withoutReservedConnectorMetadata(value) {
  if (value === undefined || value === null) {
    return {};
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).filter(([key]) => !RESERVED_CONNECTOR_META_KEYS.has(key)),
  );
}

function expectedHostDescription(remoteDescription) {
  const description =
    typeof remoteDescription === "string" ? remoteDescription.trim() : "";
  const pluginSourceNote = `This tool is part of plugin \`${PLUTO_PLUGIN_DISPLAY_NAME}\`.`;

  if (description === "") {
    return pluginSourceNote;
  }
  if (/[.!?]$/u.test(description)) {
    return `${description} ${pluginSourceNote}`;
  }
  return `${description}. ${pluginSourceNote}`;
}

export function compareToolInventories(remoteTools, hostTools) {
  assert.ok(Array.isArray(remoteTools), "Remote tools must be an array");
  assert.ok(hostTools && typeof hostTools === "object", "Host tools must be an object");

  const remoteByName = new Map();
  for (const tool of remoteTools) {
    assertNonEmptyString(tool?.name, "remote tool.name");
    assert.ok(!remoteByName.has(tool.name), `Remote inventory duplicated ${tool.name}`);
    remoteByName.set(tool.name, tool);
  }

  const remoteNames = [...remoteByName.keys()].sort();
  const hostNames = Object.keys(hostTools).sort();
  assert.deepEqual(
    hostNames,
    remoteNames,
    "Codex host Pluto tool names differ from the complete remote tools/list inventory",
  );

  for (const name of remoteNames) {
    const remoteTool = remoteByName.get(name);
    const hostTool = hostTools[name];
    assert.ok(hostTool && typeof hostTool === "object", `Host tool ${name} is missing`);
    assert.equal(hostTool.name, name, `Host tool ${name} did not preserve its raw name`);

    assert.equal(
      hostTool.description,
      expectedHostDescription(remoteTool.description),
      `Host tool ${name} did not preserve description metadata and exact Pluto provenance`,
    );

    for (const field of TOOL_METADATA_FIELDS) {
      assert.deepEqual(
        hostTool[field],
        remoteTool[field],
        `Host tool ${name} did not preserve ${field} metadata`,
      );
    }

    assert.deepEqual(
      withoutReservedConnectorMetadata(hostTool._meta),
      withoutReservedConnectorMetadata(remoteTool._meta),
      `Host tool ${name} did not preserve custom _meta metadata`,
    );
  }

  return { toolNames: remoteNames };
}

export async function collectPaginatedHostStatuses(requestPage) {
  const statuses = [];
  const seenCursors = new Set();
  let cursor;

  for (let pageNumber = 1; pageNumber <= 1_000; pageNumber += 1) {
    const result = await requestPage(cursor);
    assert.ok(result && typeof result === "object", "MCP status result is missing");
    assert.ok(Array.isArray(result.data), "MCP status result.data must be an array");
    statuses.push(...result.data);

    const nextCursor = result.nextCursor;
    if (nextCursor === undefined || nextCursor === null) {
      return statuses;
    }

    assert.equal(typeof nextCursor, "string", "MCP status nextCursor must be a string");
    assert.ok(!seenCursors.has(nextCursor), "MCP status returned a repeated cursor");
    seenCursors.add(nextCursor);
    cursor = nextCursor;
  }

  throw new Error("MCP status exceeded 1,000 pages");
}

export async function getPlutoHostStatus(client, threadId) {
  const statuses = await collectPaginatedHostStatuses((cursor) =>
    client.request("mcpServerStatus/list", {
      threadId,
      detail: "toolsAndAuthOnly",
      limit: 100,
      ...(cursor === undefined ? {} : { cursor }),
    }),
  );

  const matches = statuses.filter((status) => status?.name === PLUTO_SERVER_NAME);
  assert.equal(matches.length, 1, "Codex host must expose exactly one Pluto MCP server");
  return matches[0];
}

function sanitizedChildEnvironment(codexHome) {
  const environment = { ...process.env, CODEX_HOME: codexHome };
  delete environment.PLUTO_MCP_ACCESS_TOKEN;
  return environment;
}

function codexConfigArguments(configOverrides = []) {
  assert.ok(Array.isArray(configOverrides), "configOverrides must be an array");
  return configOverrides.flatMap((override, index) => {
    assertNonEmptyString(override, `configOverrides[${index}]`);
    return ["-c", override];
  });
}

function childHasExited(child) {
  return child.exitCode !== null || child.signalCode !== null;
}

function waitForChildExit(child, timeoutMs) {
  if (childHasExited(child)) {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    let settled = false;
    const finish = (exited) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeout);
      child.off("exit", onExit);
      resolve(exited);
    };
    const onExit = () => {
      finish(true);
    };
    const timeout = setTimeout(() => finish(false), timeoutMs);
    child.once("exit", onExit);
    if (childHasExited(child)) {
      onExit();
    }
  });
}

async function terminateChild(child, label) {
  if (childHasExited(child)) {
    return;
  }

  child.kill("SIGTERM");
  if (await waitForChildExit(child, 2_000)) {
    return;
  }

  child.kill("SIGKILL");
  assert.equal(
    await waitForChildExit(child, 2_000),
    true,
    `${label} did not exit after SIGKILL`,
  );
}

function waitForChildOutcome(child, timeoutMs) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const cleanup = () => {
      clearTimeout(timeout);
      child.off("error", onError);
      child.off("close", onClose);
    };
    const onError = (error) => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      reject(error);
    };
    const onClose = (code, signal) => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      resolve({ code, signal, timedOut: false });
    };
    const timeout = setTimeout(() => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      resolve({ code: null, signal: null, timedOut: true });
    }, timeoutMs);

    child.once("error", onError);
    child.once("close", onClose);
  });
}

function redact(text, secrets = []) {
  let output = text;
  for (const secret of secrets) {
    if (secret) {
      output = output.split(secret).join("[REDACTED]");
    }
  }
  return output;
}

export class AppServerClient {
  constructor({ codexBin = "codex", codexHome, configOverrides = [], cwd }) {
    assertNonEmptyString(codexHome, "codexHome");
    this.nextId = 1;
    this.notifications = [];
    this.pending = new Map();
    this.stderr = "";
    this.closing = false;

    this.process = spawn(
      codexBin,
      [...codexConfigArguments(configOverrides), "app-server", "--stdio"],
      {
        cwd,
        env: sanitizedChildEnvironment(codexHome),
        stdio: ["pipe", "pipe", "pipe"],
      },
    );

    this.lines = readline.createInterface({ input: this.process.stdout });
    this.lines.on("line", (line) => this.handleLine(line));
    this.process.stderr.on("data", (chunk) => {
      this.stderr = `${this.stderr}${chunk.toString()}`.slice(-20_000);
    });
    this.process.on("error", (error) => this.rejectPending(error));
    this.process.on("exit", (code, signal) => {
      if (!this.closing) {
        this.rejectPending(
          new Error(
            `codex app-server exited unexpectedly (${code ?? signal ?? "unknown"}): ${redact(this.stderr)}`,
          ),
        );
      }
    });
  }

  async initialize() {
    await this.request("initialize", {
      clientInfo: {
        name: "pluto-plugin-integration-health-check",
        title: "Pluto plugin integration health check",
        version: "1.0.0",
      },
    });
    this.notify("initialized");
  }

  handleLine(line) {
    if (line.trim() === "") {
      return;
    }

    let message;
    try {
      message = JSON.parse(line);
    } catch (error) {
      this.rejectPending(new Error(`Invalid app-server JSONL: ${error.message}`));
      return;
    }

    if (message.id !== undefined && this.pending.has(message.id)) {
      const pending = this.pending.get(message.id);
      this.pending.delete(message.id);
      clearTimeout(pending.timeout);
      if (message.error) {
        pending.reject(
          new Error(
            `app-server ${pending.method} failed (${message.error.code ?? "unknown"}): ${message.error.message ?? "Unknown error"}`,
          ),
        );
      } else {
        pending.resolve(message.result);
      }
      return;
    }

    if (typeof message.method === "string") {
      this.notifications.push(message);
      if (this.notifications.length > 1_000) {
        this.notifications.shift();
      }
    }
  }

  rejectPending(error) {
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timeout);
      pending.reject(error);
    }
    this.pending.clear();
  }

  request(method, params = {}, timeoutMs = 45_000) {
    const id = this.nextId;
    this.nextId += 1;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Timed out waiting for app-server ${method}`));
      }, timeoutMs);

      this.pending.set(id, { method, reject, resolve, timeout });
      this.process.stdin.write(`${JSON.stringify({ id, method, params })}\n`);
    });
  }

  notify(method, params) {
    const message = params === undefined ? { method } : { method, params };
    this.process.stdin.write(`${JSON.stringify(message)}\n`);
  }

  waitForNotification(method, predicate, timeoutMs = 45_000) {
    const existing = this.notifications.find(
      (notification) =>
        notification.method === method && predicate(notification.params ?? {}),
    );
    if (existing) {
      return Promise.resolve(existing.params ?? {});
    }

    return new Promise((resolve, reject) => {
      const deadline = Date.now() + timeoutMs;
      const poll = () => {
        const match = this.notifications.find(
          (notification) =>
            notification.method === method && predicate(notification.params ?? {}),
        );
        if (match) {
          resolve(match.params ?? {});
          return;
        }
        if (Date.now() >= deadline) {
          reject(new Error(`Timed out waiting for app-server notification ${method}`));
          return;
        }
        setTimeout(poll, 50);
      };
      poll();
    });
  }

  async close() {
    this.closing = true;
    this.process.stdin.end();

    if (!(await waitForChildExit(this.process, 2_000))) {
      await terminateChild(this.process, "codex app-server");
    }
    this.lines.close();
  }
}

export async function startFreshTaskAndWaitForPluto(client, cwd) {
  const response = await client.request("thread/start", {
    cwd,
    ephemeral: true,
    approvalPolicy: "never",
    sandbox: "read-only",
  });
  const threadId = response?.thread?.id;
  assertNonEmptyString(threadId, "thread/start thread.id");

  const startup = await client.waitForNotification(
    "mcpServer/startupStatus/updated",
    (params) =>
      params.name === PLUTO_SERVER_NAME &&
      params.threadId === threadId &&
      (params.status === "ready" ||
        params.status === "failed" ||
        params.status === "cancelled"),
  );

  return { startup, threadId };
}

export async function readSourceContract(repoRoot) {
  const files = {
    marketplace: path.join(repoRoot, ".agents/plugins/marketplace.json"),
    mcp: path.join(repoRoot, "plugins/pluto/.mcp.json"),
    openai: path.join(
      repoRoot,
      "plugins/pluto/skills/candidate-discovery/agents/openai.yaml",
    ),
    plugin: path.join(repoRoot, "plugins/pluto/.codex-plugin/plugin.json"),
    readme: path.join(repoRoot, "README.md"),
    skill: path.join(repoRoot, "plugins/pluto/skills/candidate-discovery/SKILL.md"),
  };

  const [marketplaceText, mcpText, openaiText, pluginText, readme, skill] =
    await Promise.all([
      readFile(files.marketplace, "utf8"),
      readFile(files.mcp, "utf8"),
      readFile(files.openai, "utf8"),
      readFile(files.plugin, "utf8"),
      readFile(files.readme, "utf8"),
      readFile(files.skill, "utf8"),
    ]);

  return {
    files,
    marketplace: JSON.parse(marketplaceText),
    mcp: JSON.parse(mcpText),
    openaiText,
    plugin: JSON.parse(pluginText),
    readme,
    skill,
  };
}

export function assertSourceContract(contract) {
  assert.equal(contract.marketplace.name, "talentpluto");
  assert.equal(contract.plugin.name, PLUTO_SERVER_NAME);
  assert.match(contract.plugin.version, /^\d+\.\d+\.\d+$/u);
  assert.equal(contract.plugin.mcpServers, "./.mcp.json");
  assert.equal(contract.plugin.skills, "./skills/");
  assert.equal(contract.plugin.interface?.displayName, PLUTO_PLUGIN_DISPLAY_NAME);

  const marketplaceMatches = (contract.marketplace.plugins ?? []).filter(
    (plugin) => plugin.name === PLUTO_SERVER_NAME,
  );
  assert.equal(
    marketplaceMatches.length,
    1,
    "Marketplace must contain exactly one Pluto plugin entry",
  );
  const [marketplacePlugin] = marketplaceMatches;
  assert.deepEqual(marketplacePlugin.source, {
    source: "local",
    path: "./plugins/pluto",
  });
  assert.equal(marketplacePlugin.policy?.installation, "AVAILABLE");
  assert.equal(marketplacePlugin.policy?.authentication, "ON_INSTALL");

  assert.deepEqual(
    Object.keys(contract.mcp.mcpServers ?? {}),
    [PLUTO_SERVER_NAME],
    "Plugin .mcp.json must contain only the stable pluto server entry",
  );
  const server = contract.mcp.mcpServers?.[PLUTO_SERVER_NAME];
  assert.ok(server, "Plugin .mcp.json is missing the stable pluto server name");
  assert.equal(server.type, "http");
  assert.equal(server.url, PLUTO_MCP_URL);
  assert.deepEqual([...server.scopes].sort(), ["candidates:read", "offline_access"]);
  assert.equal(server.oauth_resource, PLUTO_MCP_URL);
  assert.equal(
    server.http_headers?.["x-talentpluto-codex-oauth-compatibility"],
    PLUTO_COMPATIBILITY_HEADER["x-talentpluto-codex-oauth-compatibility"],
  );
  assert.equal(
    Object.hasOwn(server, "required"),
    false,
    "Do not make the plugin globally required; the skill handles missing Pluto explicitly",
  );

  assert.equal(
    contract.openaiText,
    EXPECTED_SKILL_METADATA,
    "Candidate-discovery metadata must match the supported Pluto MCP dependency schema",
  );

  assert.match(contract.skill, /confirm that the current\s+task exposes Pluto's `discover_candidates` MCP tool/iu);
  assert.match(contract.skill, /Pluto authentication is required/iu);
  assert.match(contract.skill, /Pluto failed to initialize/iu);
  assert.match(contract.skill, /Never run `codex mcp logout pluto` automatically/iu);

  assert.match(contract.readme, /mcp_oauth_credentials_store\s*=\s*"keyring"/u);
  assert.match(contract.readme, /https:\/\/app\.talentpluto\.com\/api\/mcp/u);
  assert.match(contract.readme, /candidates:read/u);
  assert.match(contract.readme, /offline_access/u);
  assert.match(contract.readme, /codex mcp logout pluto/u);
  assert.match(contract.readme, /codex mcp login pluto/u);

  return {
    pluginVersion: contract.plugin.version,
    server,
  };
}

export async function runCodexJson({
  args,
  codexBin = "codex",
  codexHome,
  configOverrides = [],
  cwd,
  timeoutMs = 45_000,
}) {
  const child = spawn(
    codexBin,
    [...codexConfigArguments(configOverrides), ...args],
    {
      cwd,
      env: sanitizedChildEnvironment(codexHome),
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  let stdout = "";
  let stderr = "";

  child.stdout.on("data", (chunk) => {
    stdout += chunk.toString();
  });
  child.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  const outcome = await waitForChildOutcome(child, timeoutMs);
  if (outcome.timedOut) {
    await terminateChild(child, `codex ${args[0] ?? "command"}`);
    throw new Error(`Timed out running codex ${args[0] ?? ""}`);
  }
  if (outcome.code !== 0) {
    throw new Error(
      `codex ${args.join(" ")} failed with exit ${outcome.code ?? outcome.signal ?? "unknown"}: ${redact(stderr)}`,
    );
  }

  try {
    return JSON.parse(stdout);
  } catch (error) {
    throw new Error(
      `codex ${args.join(" ")} returned invalid JSON: ${error.message}; stderr: ${redact(stderr)}`,
    );
  }
}
