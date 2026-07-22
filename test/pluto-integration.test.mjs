import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  assertSourceContract,
  collectPaginatedHostStatuses,
  collectPaginatedTools,
  compareToolInventories,
  getPlutoHostStatus,
  listAllRemoteTools,
  readSourceContract,
} from "../scripts/lib/pluto-integration.mjs";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

function remoteTool(name, overrides = {}) {
  return {
    name,
    title: `Title for ${name}`,
    description: `Description for ${name}`,
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
      },
      required: ["query"],
    },
    outputSchema: {
      type: "object",
      properties: {
        matches: { type: "array" },
      },
      required: ["matches"],
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
    },
    icons: [
      {
        src: "https://app.talentpluto.com/pluto.svg",
        mimeType: "image/svg+xml",
      },
    ],
    _meta: {
      securitySchemes: [
        {
          type: "oauth2",
          scopes: ["candidates:read"],
        },
      ],
      "pluto/custom": { version: 1 },
      connector_id: "remote-reserved-id",
      connector_name: "remote-reserved-name",
    },
    ...overrides,
  };
}

function hostToolFrom(remote, overrides = {}) {
  const description =
    typeof remote.description === "string" ? remote.description.trim() : "";
  const pluginSourceNote = "This tool is part of plugin `Pluto`.";
  const hostDescription =
    description === ""
      ? pluginSourceNote
      : /[.!?]$/u.test(description)
        ? `${description} ${pluginSourceNote}`
        : `${description}. ${pluginSourceNote}`;

  return {
    ...structuredClone(remote),
    description: hostDescription,
    _meta: {
      ...structuredClone(remote._meta),
      connector_id: "host-reserved-id",
      connector_display_name: "Pluto",
      connector_description: "Host-owned connector metadata",
      connectorDescription: "Host-owned legacy connector metadata",
    },
    ...overrides,
  };
}

test("collectPaginatedTools exhausts every page and preserves opaque cursors", async () => {
  const opaqueCursor = "opaque:+/= ?#%E2%98%83";
  const requestedCursors = [];

  const tools = await collectPaginatedTools(async (cursor) => {
    requestedCursors.push(cursor);
    if (cursor === undefined) {
      return {
        tools: [remoteTool("discover_candidates")],
        nextCursor: opaqueCursor,
      };
    }

    assert.equal(cursor, opaqueCursor);
    return {
      tools: [remoteTool("future_server_tool")],
      nextCursor: null,
    };
  });

  assert.deepEqual(requestedCursors, [undefined, opaqueCursor]);
  assert.deepEqual(
    tools.map((tool) => tool.name),
    ["discover_candidates", "future_server_tool"],
  );
});

test("collectPaginatedTools treats an empty string as an opaque cursor", async () => {
  const requestedCursors = [];
  const tools = await collectPaginatedTools(async (cursor) => {
    requestedCursors.push(cursor);
    return cursor === undefined
      ? { tools: [remoteTool("first_tool")], nextCursor: "" }
      : { tools: [remoteTool("second_tool")], nextCursor: null };
  });

  assert.deepEqual(requestedCursors, [undefined, ""]);
  assert.deepEqual(
    tools.map((tool) => tool.name),
    ["first_tool", "second_tool"],
  );
});

test("listAllRemoteTools reads streaming SSE incrementally and closes its session", async () => {
  const calls = [];
  let initializeStreamCancelled = false;
  const encoder = new TextEncoder();

  const fetchImpl = async (_url, options) => {
    const payload = options.body ? JSON.parse(options.body) : null;
    calls.push({ method: options.method, payload, headers: options.headers });

    if (options.method === "DELETE") {
      return new Response(null, { status: 204 });
    }
    if (payload.method === "initialize") {
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                jsonrpc: "2.0",
                id: payload.id,
                result: {
                  protocolVersion: "2025-06-18",
                  capabilities: { tools: {} },
                  serverInfo: { name: "pluto-test", version: "1" },
                },
              })}\n\n`,
            ),
          );
        },
        cancel() {
          initializeStreamCancelled = true;
        },
      });
      return new Response(stream, {
        headers: {
          "content-type": "text/event-stream",
          "mcp-session-id": "isolated-test-session",
        },
      });
    }
    if (payload.method === "notifications/initialized") {
      return new Response(null, { status: 202 });
    }
    if (payload.method === "tools/list") {
      const result = Object.hasOwn(payload.params, "cursor")
        ? { tools: [remoteTool("second_tool")], nextCursor: null }
        : { tools: [remoteTool("first_tool")], nextCursor: "" };
      return Response.json({ jsonrpc: "2.0", id: payload.id, result });
    }
    throw new Error(`Unexpected fake MCP method ${payload.method}`);
  };

  const tools = await listAllRemoteTools({
    accessToken: "isolated-fake-token",
    fetchImpl,
  });

  assert.deepEqual(
    tools.map((tool) => tool.name),
    ["first_tool", "second_tool"],
  );
  assert.equal(initializeStreamCancelled, true);
  assert.deepEqual(
    calls
      .filter((call) => call.payload?.method === "tools/list")
      .map((call) => call.payload.params),
    [{}, { cursor: "" }],
  );
  assert.equal(calls.at(-1).method, "DELETE");
  assert.equal(calls.at(-1).headers["Mcp-Session-Id"], "isolated-test-session");
});

test("listAllRemoteTools rejects protocol drift and still closes its session", async () => {
  const methods = [];
  const fetchImpl = async (_url, options) => {
    methods.push(options.method);
    if (options.method === "DELETE") {
      return new Response(null, { status: 204 });
    }
    const payload = JSON.parse(options.body);
    return Response.json(
      {
        jsonrpc: "2.0",
        id: payload.id,
        result: {
          protocolVersion: "2025-03-26",
          capabilities: {},
          serverInfo: { name: "pluto-test", version: "1" },
        },
      },
      { headers: { "mcp-session-id": "protocol-drift-session" } },
    );
  };

  await assert.rejects(
    listAllRemoteTools({
      accessToken: "isolated-fake-token",
      fetchImpl,
    }),
    /negotiated a protocol version that differs from Codex 0\.145/u,
  );
  assert.deepEqual(methods, ["POST", "DELETE"]);
});

test("collectPaginatedTools rejects a repeated cursor", async () => {
  let page = 0;

  await assert.rejects(
    collectPaginatedTools(async () => {
      page += 1;
      return {
        tools: [remoteTool(`page_${page}`)],
        nextCursor: "same-opaque-cursor",
      };
    }),
    /tools\/list returned a repeated pagination cursor/u,
  );
});

test("collectPaginatedTools rejects duplicate names across pages", async () => {
  await assert.rejects(
    collectPaginatedTools(async (cursor) =>
      cursor === undefined
        ? {
            tools: [remoteTool("discover_candidates")],
            nextCursor: "second-page",
          }
        : {
            tools: [remoteTool("discover_candidates")],
            nextCursor: null,
          },
    ),
    /tools\/list returned duplicate tool discover_candidates/u,
  );
});

test("compareToolInventories accepts an order-independent exact tool set", () => {
  const first = remoteTool("discover_candidates");
  const second = remoteTool("future_server_tool");
  const hostTools = {
    future_server_tool: hostToolFrom(second),
    discover_candidates: hostToolFrom(first),
  };

  const result = compareToolInventories([second, first], hostTools);

  assert.deepEqual(result.toolNames, [
    "discover_candidates",
    "future_server_tool",
  ]);
});

test("compareToolInventories fails when a future remote tool is missing", () => {
  const current = remoteTool("discover_candidates");
  const future = remoteTool("future_server_tool");

  assert.throws(
    () =>
      compareToolInventories([current, future], {
        discover_candidates: hostToolFrom(current),
      }),
    /Codex host Pluto tool names differ from the complete remote tools\/list inventory/u,
  );
});

test("compareToolInventories fails when the host exposes a stale extra tool", () => {
  const current = remoteTool("discover_candidates");
  const stale = remoteTool("retired_server_tool");

  assert.throws(
    () =>
      compareToolInventories([current], {
        discover_candidates: hostToolFrom(current),
        retired_server_tool: hostToolFrom(stale),
      }),
    /Codex host Pluto tool names differ from the complete remote tools\/list inventory/u,
  );
});

test("compareToolInventories allows only the known description and connector metadata normalization", () => {
  const remote = remoteTool("discover_candidates");
  const host = hostToolFrom(remote);

  assert.doesNotThrow(() =>
    compareToolInventories([remote], { discover_candidates: host }),
  );
});

test("compareToolInventories accepts Codex provenance for punctuated and missing descriptions", () => {
  const punctuated = remoteTool("punctuated_tool", {
    description: "Already punctuated!  ",
  });
  const missing = remoteTool("missing_description");
  delete missing.description;

  assert.doesNotThrow(() =>
    compareToolInventories([punctuated, missing], {
      punctuated_tool: hostToolFrom(punctuated),
      missing_description: hostToolFrom(missing),
    }),
  );
});

for (const drift of [
  {
    label: "description",
    expected: /did not preserve description metadata/u,
    change(host) {
      host.description = "A changed description";
    },
  },
  {
    label: "title",
    expected: /did not preserve title metadata/u,
    change(host) {
      host.title = "A changed title";
    },
  },
  {
    label: "input schema",
    expected: /did not preserve inputSchema metadata/u,
    change(host) {
      host.inputSchema.properties.query.type = "number";
    },
  },
  {
    label: "output schema",
    expected: /did not preserve outputSchema metadata/u,
    change(host) {
      host.outputSchema.properties.matches.type = "object";
    },
  },
  {
    label: "annotations",
    expected: /did not preserve annotations metadata/u,
    change(host) {
      host.annotations.readOnlyHint = false;
    },
  },
  {
    label: "icons",
    expected: /did not preserve icons metadata/u,
    change(host) {
      host.icons[0].src = "https://app.talentpluto.com/changed.svg";
    },
  },
  {
    label: "custom _meta",
    expected: /did not preserve custom _meta metadata/u,
    change(host) {
      host._meta.securitySchemes[0].scopes = ["different:scope"];
    },
  },
]) {
  test(`compareToolInventories rejects ${drift.label} drift`, () => {
    const remote = remoteTool("discover_candidates");
    const host = hostToolFrom(remote);
    drift.change(host);

    assert.throws(
      () =>
        compareToolInventories([remote], {
          discover_candidates: host,
        }),
      drift.expected,
    );
  });
}

test("collectPaginatedHostStatuses exhausts opaque host-status cursors", async () => {
  const requestedCursors = [];
  const opaqueCursor = "host/status:opaque?next=2";

  const statuses = await collectPaginatedHostStatuses(async (cursor) => {
    requestedCursors.push(cursor);
    return cursor === undefined
      ? {
          data: [{ name: "another-server" }],
          nextCursor: opaqueCursor,
        }
      : {
          data: [{ name: "pluto", tools: {} }],
          nextCursor: null,
        };
  });

  assert.deepEqual(requestedCursors, [undefined, opaqueCursor]);
  assert.deepEqual(
    statuses.map((status) => status.name),
    ["another-server", "pluto"],
  );
});

test("collectPaginatedHostStatuses treats an empty string as an opaque cursor", async () => {
  const requestedCursors = [];
  const statuses = await collectPaginatedHostStatuses(async (cursor) => {
    requestedCursors.push(cursor);
    return cursor === undefined
      ? { data: [{ name: "first-server" }], nextCursor: "" }
      : { data: [{ name: "second-server" }], nextCursor: null };
  });

  assert.deepEqual(requestedCursors, [undefined, ""]);
  assert.deepEqual(
    statuses.map((status) => status.name),
    ["first-server", "second-server"],
  );
});

test("getPlutoHostStatus finds Pluto after paging all host statuses", async () => {
  const calls = [];
  const client = {
    async request(method, params) {
      calls.push({ method, params });
      return params.cursor === undefined
        ? {
            data: [{ name: "another-server", tools: {} }],
            nextCursor: "opaque-host-cursor",
          }
        : {
            data: [
              {
                name: "pluto",
                serverInfo: { name: "pluto", version: "test" },
                tools: { discover_candidates: { name: "discover_candidates" } },
              },
            ],
            nextCursor: null,
          };
    },
  };

  const status = await getPlutoHostStatus(client, "thread-test-id");

  assert.equal(status.name, "pluto");
  assert.deepEqual(calls, [
    {
      method: "mcpServerStatus/list",
      params: {
        threadId: "thread-test-id",
        detail: "toolsAndAuthOnly",
        limit: 100,
      },
    },
    {
      method: "mcpServerStatus/list",
      params: {
        threadId: "thread-test-id",
        detail: "toolsAndAuthOnly",
        limit: 100,
        cursor: "opaque-host-cursor",
      },
    },
  ]);
});

test("assertSourceContract accepts the checked-in Pluto plugin contract", async () => {
  const contract = await readSourceContract(REPO_ROOT);
  const result = assertSourceContract(contract);

  assert.equal(result.pluginVersion, contract.plugin.version);
  assert.equal(result.server, contract.mcp.mcpServers.pluto);
});
