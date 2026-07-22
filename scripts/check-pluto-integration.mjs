#!/usr/bin/env node

import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import {
  chmod,
  mkdir,
  readFile,
  readdir,
  realpath,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import {
  AppServerClient,
  PLUTO_COMPATIBILITY_HEADER,
  PLUTO_MCP_URL,
  PLUTO_SERVER_NAME,
  assertSourceContract,
  compareToolInventories,
  getPlutoHostStatus,
  listAllRemoteTools,
  readSourceContract,
  runCodexJson,
  startFreshTaskAndWaitForPluto,
} from "./lib/pluto-integration.mjs";

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const minimumCodexVersion = [0, 145, 0];
const testHomeMarkerName = ".pluto-integration-test-home.json";
const testHomeMarker = {
  kind: "pluto-plugin-integration-test-home",
  version: 1,
};
const fileCredentialStoreOverride = 'mcp_oauth_credentials_store="file"';
const modeOptions = new Map([
  ["source", new Set([])],
  ["clean-install", new Set(["codex-bin", "codex-home", "marketplace-source"])],
  ["live", new Set(["codex-bin", "codex-home"])],
  [
    "upgrade",
    new Set(["codex-bin", "codex-home", "expected-version", "marketplace"]),
  ],
  ["reconnect", new Set(["codex-bin", "codex-home"])],
]);

function usage() {
  return `Usage:
  node scripts/check-pluto-integration.mjs source
  node scripts/check-pluto-integration.mjs clean-install --codex-home /absolute/test/home
  PLUTO_MCP_ACCESS_TOKEN=... node scripts/check-pluto-integration.mjs live --codex-home /absolute/test/home
  PLUTO_MCP_ACCESS_TOKEN=... node scripts/check-pluto-integration.mjs upgrade --codex-home /absolute/test/home [--marketplace talentpluto]
  node scripts/check-pluto-integration.mjs reconnect --codex-home /absolute/test/home

Options:
  --codex-bin PATH             Codex executable (default: codex)
  --codex-home PATH            Explicit isolated Codex home; ~/.codex is refused
  --marketplace NAME           Marketplace name (default: talentpluto)
  --marketplace-source SOURCE  Local or Git source for clean-install (default: this repository)
  --expected-version VERSION   Expected installed version (default: source plugin version)`;
}

function parseArguments(argv) {
  const mode = argv[0] ?? "source";
  const allowedOptions = modeOptions.get(mode);
  if (!allowedOptions) {
    throw new Error(`Unknown mode ${mode}\n\n${usage()}`);
  }
  const options = Object.create(null);

  for (let index = 1; index < argv.length; index += 1) {
    const argument = argv[index];
    if (!argument.startsWith("--")) {
      throw new Error(`Unexpected argument ${argument}\n\n${usage()}`);
    }
    const value = argv[index + 1];
    if (value === undefined || value.startsWith("--")) {
      throw new Error(`Missing value for ${argument}\n\n${usage()}`);
    }
    const name = argument.slice(2);
    if (!allowedOptions.has(name)) {
      throw new Error(`Unknown option ${argument} for ${mode}\n\n${usage()}`);
    }
    if (Object.hasOwn(options, name)) {
      throw new Error(`Duplicate option ${argument}\n\n${usage()}`);
    }
    options[name] = value;
    index += 1;
  }

  return { mode, options };
}

function isSamePathOrDescendant(candidate, parent) {
  const relative = path.relative(parent, candidate);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

async function canonicalPath(candidate) {
  try {
    return await realpath(candidate);
  } catch (error) {
    if (error?.code === "ENOENT") {
      return path.resolve(candidate);
    }
    throw error;
  }
}

async function assertIsolatedCodexHome(
  codexHome,
  { create = false, requireMarker = false } = {},
) {
  assert.equal(typeof codexHome, "string", "--codex-home is required");
  assert.ok(path.isAbsolute(codexHome), "--codex-home must be an absolute path");

  const resolved = path.resolve(codexHome);
  assert.notEqual(resolved, path.parse(resolved).root, "Refusing a filesystem root");
  if (create) {
    await mkdir(resolved, { recursive: true });
  }

  const canonical = await realpath(resolved);
  assert.notEqual(canonical, path.parse(canonical).root, "Refusing a filesystem root");

  const canonicalUserHome = await canonicalPath(os.homedir());
  const canonicalDefaultCodexHome = await canonicalPath(
    path.join(os.homedir(), ".codex"),
  );
  const canonicalRepoRoot = await canonicalPath(repoRoot);
  assert.notEqual(canonical, canonicalUserHome, "Refusing the user's home directory");
  assert.ok(
    !isSamePathOrDescendant(canonical, canonicalDefaultCodexHome),
    "Refusing ~/.codex or any directory inside it; use an isolated test home",
  );
  assert.ok(
    !isSamePathOrDescendant(canonical, canonicalRepoRoot),
    "Refusing to create a Codex test home inside the source repository",
  );

  if (process.env.CODEX_HOME) {
    const canonicalActiveCodexHome = await canonicalPath(process.env.CODEX_HOME);
    assert.ok(
      !isSamePathOrDescendant(canonical, canonicalActiveCodexHome),
      "Refusing the active CODEX_HOME; unset CODEX_HOME and pass a dedicated --codex-home",
    );
  }

  if (requireMarker) {
    let marker;
    try {
      marker = JSON.parse(
        await readFile(path.join(canonical, testHomeMarkerName), "utf8"),
      );
    } catch (error) {
      throw new Error(
        `Refusing an unmarked Codex home. Create it with this harness's clean-install mode first (${error.message}).`,
      );
    }
    assert.deepEqual(
      marker,
      testHomeMarker,
      `Invalid ${testHomeMarkerName}; refusing to use this Codex home`,
    );
    const config = await readFile(path.join(canonical, "config.toml"), "utf8");
    const credentialStores = [
      ...config.matchAll(
        /^\s*mcp_oauth_credentials_store\s*=\s*["']([^"']+)["']\s*(?:#.*)?$/gmu,
      ),
    ].map((match) => match[1]);
    assert.deepEqual(
      credentialStores,
      ["file"],
      "Marked test homes must keep exactly one unambiguous file credential-store setting",
    );
  }

  return canonical;
}

async function prepareCleanCodexHome(codexHome) {
  const canonical = await assertIsolatedCodexHome(codexHome, { create: true });
  const entries = await readdir(canonical);
  assert.deepEqual(
    entries,
    [],
    "clean-install requires an empty isolated --codex-home and will not delete existing data",
  );
  await chmod(canonical, 0o700);

  await writeFile(
    path.join(canonical, "config.toml"),
    'mcp_oauth_credentials_store = "file"\n',
    { encoding: "utf8", mode: 0o600 },
  );
  await writeFile(
    path.join(canonical, testHomeMarkerName),
    `${JSON.stringify(testHomeMarker, null, 2)}\n`,
    { encoding: "utf8", mode: 0o600 },
  );
  return canonical;
}

function compareVersions(left, right) {
  for (let index = 0; index < 3; index += 1) {
    const difference = left[index] - right[index];
    if (difference !== 0) {
      return difference;
    }
  }
  return 0;
}

function parseSemver(version, label) {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/u);
  assert.ok(match, `${label} must be a three-part semantic version`);
  return match.slice(1).map(Number);
}

async function assertSupportedCodex(codexBin, codexHome) {
  const childEnvironment = { ...process.env, CODEX_HOME: codexHome };
  delete childEnvironment.PLUTO_MCP_ACCESS_TOKEN;
  const { stdout } = await execFileAsync(codexBin, ["--version"], {
    env: childEnvironment,
    timeout: 15_000,
  });
  const match = stdout.match(/(\d+)\.(\d+)\.(\d+)/u);
  assert.ok(match, `Could not parse Codex version from: ${stdout.trim()}`);
  const installed = match.slice(1).map(Number);
  assert.ok(
    compareVersions(installed, minimumCodexVersion) >= 0,
    "The integration health check requires Codex 0.145.0 or newer",
  );
  if (installed[0] !== 0 || installed[1] !== 145) {
    console.warn(
      `Codex ${installed.join(".")} is newer than the 0.145 compatibility baseline; strict failures may indicate host behavior drift that needs review.`,
    );
  }
  return installed.join(".");
}

function findInstalledPluto(pluginList) {
  const matches = (pluginList.installed ?? []).filter(
    (plugin) => plugin.name === PLUTO_SERVER_NAME,
  );
  assert.equal(matches.length, 1, "Expected exactly one installed Pluto plugin");
  assert.equal(matches[0].enabled, true, "Installed Pluto plugin must be enabled");
  return matches[0];
}

async function assertInstalledSkillDependency(client) {
  const response = await client.request("skills/list", {
    cwds: [repoRoot],
    forceReload: true,
  });
  const entries = response?.data ?? [];
  const errors = entries.flatMap((entry) => entry.errors ?? []);
  assert.deepEqual(errors, [], "Codex reported an error while loading installed skills");

  const skills = entries.flatMap((entry) => entry.skills ?? []);
  const matches = skills.filter(
    (skill) =>
      skill.name === "candidate-discovery" ||
      skill.name.endsWith(":candidate-discovery"),
  );
  assert.equal(matches.length, 1, "Codex did not load exactly one candidate-discovery skill");

  const tools = matches[0].dependencies?.tools ?? [];
  const dependency = tools.find(
    (tool) => tool.type === "mcp" && tool.value === PLUTO_SERVER_NAME,
  );
  assert.ok(dependency, "Codex did not parse the candidate-discovery Pluto dependency");
  assert.equal(dependency.transport, "streamable_http");
  assert.equal(dependency.url, PLUTO_MCP_URL);
  assert.ok(dependency.description, "Pluto skill dependency needs a description");
}

async function openAppServer({ codexBin, codexHome }) {
  const client = new AppServerClient({
    codexBin,
    codexHome,
    configOverrides: [fileCredentialStoreOverride],
    cwd: repoRoot,
  });
  try {
    await client.initialize();
    await assertInstalledSkillDependency(client);
    return client;
  } catch (error) {
    await client.close();
    throw error;
  }
}

async function runOneHealthyBoot({ codexBin, codexHome, remoteTools }) {
  const client = await openAppServer({ codexBin, codexHome });
  try {
    const { startup, threadId } = await startFreshTaskAndWaitForPluto(client, repoRoot);
    assert.equal(
      startup.status,
      "ready",
      `Pluto failed to initialize in a fresh task: ${startup.error ?? "unknown error"}`,
    );

    const host = await getPlutoHostStatus(client, threadId);
    assert.equal(
      host.authStatus,
      "oAuth",
      "Healthy Pluto host status must use stored OAuth",
    );
    assert.ok(host.serverInfo, "Healthy Pluto initialization is missing serverInfo");
    const comparison = compareToolInventories(remoteTools, host.tools);
    return { comparison, serverInfo: host.serverInfo, threadId };
  } finally {
    await client.close();
  }
}

async function sourceMode(contract) {
  const summary = assertSourceContract(contract);
  console.log(
    `Source contract is consistent for Pluto ${summary.pluginVersion}; no canonical tool-name list is stored locally.`,
  );
}

async function cleanInstallMode({ codexBin, codexHome, marketplaceSource }, contract) {
  const codexVersion = await assertSupportedCodex(codexBin, codexHome);

  const marketplace = await runCodexJson({
    args: ["plugin", "marketplace", "add", marketplaceSource, "--json"],
    codexBin,
    codexHome,
    configOverrides: [fileCredentialStoreOverride],
    cwd: repoRoot,
  });
  assert.equal(marketplace.marketplaceName, "talentpluto");

  const installed = await runCodexJson({
    args: ["plugin", "add", "pluto@talentpluto", "--json"],
    codexBin,
    codexHome,
    configOverrides: [fileCredentialStoreOverride],
    cwd: repoRoot,
  });
  assert.equal(installed.authPolicy, "ON_INSTALL");
  assert.equal(installed.version, contract.plugin.version);

  const pluginList = await runCodexJson({
    args: ["plugin", "list", "--json"],
    codexBin,
    codexHome,
    configOverrides: [fileCredentialStoreOverride],
    cwd: repoRoot,
  });
  assert.equal(findInstalledPluto(pluginList).version, contract.plugin.version);

  const effectiveMcp = await runCodexJson({
    args: ["mcp", "get", PLUTO_SERVER_NAME, "--json"],
    codexBin,
    codexHome,
    configOverrides: [fileCredentialStoreOverride],
    cwd: repoRoot,
  });
  assert.equal(effectiveMcp.name, PLUTO_SERVER_NAME);
  assert.equal(effectiveMcp.transport?.type, "streamable_http");
  assert.equal(effectiveMcp.transport?.url, PLUTO_MCP_URL);
  assert.equal(
    effectiveMcp.transport?.http_headers?.[
      "x-talentpluto-codex-oauth-compatibility"
    ],
    PLUTO_COMPATIBILITY_HEADER["x-talentpluto-codex-oauth-compatibility"],
  );

  const client = await openAppServer({ codexBin, codexHome });
  try {
    const { startup, threadId } = await startFreshTaskAndWaitForPluto(client, repoRoot);
    assert.equal(
      startup.status,
      "failed",
      "A clean isolated credential store must fail Pluto startup before login",
    );
    assert.match(
      startup.error ?? "",
      /not logged in/iu,
      `A clean install must fail specifically because Pluto is not logged in; got: ${startup.error ?? "no startup error"}`,
    );
    const host = await getPlutoHostStatus(client, threadId);
    assert.equal(
      host.authStatus,
      "notLoggedIn",
      "A clean install must report notLoggedIn in addition to the terminal startup error",
    );
    assert.deepEqual(host.tools, {}, "Unauthenticated Pluto must not advertise usable tools");
  } finally {
    await client.close();
  }

  console.log(
    `Clean install passed on Codex ${codexVersion}: version ${contract.plugin.version}, ON_INSTALL auth policy, parsed skill dependency, fresh-task missing-authentication state, and no tools before login.`,
  );
}

async function liveMode({ accessToken, codexBin, codexHome }) {
  assert.ok(
    accessToken,
    "PLUTO_MCP_ACCESS_TOKEN is required for direct remote inventory and is never printed",
  );
  const codexVersion = await assertSupportedCodex(codexBin, codexHome);
  const remoteTools = await listAllRemoteTools({ accessToken });
  assert.ok(remoteTools.length > 0, "The authenticated Pluto server advertised no tools");

  const first = await runOneHealthyBoot({
    codexBin,
    codexHome,
    remoteTools,
  });
  const second = await runOneHealthyBoot({
    codexBin,
    codexHome,
    remoteTools,
  });

  assert.deepEqual(
    second.comparison.toolNames,
    first.comparison.toolNames,
    "Pluto tool inventory changed across an app-server restart",
  );
  console.log(
    `Live integration passed on Codex ${codexVersion}: ${remoteTools.length} remote-advertised tool(s) matched Codex's host-status inventory and metadata after fresh-task startup and an app-server restart using the same isolated credential store.`,
  );
  console.log(`Tool names: ${first.comparison.toolNames.join(", ")}`);
}

async function upgradeMode(
  { accessToken, codexBin, codexHome, expectedVersion, marketplace },
  contract,
) {
  assert.ok(
    accessToken,
    "PLUTO_MCP_ACCESS_TOKEN is required so the post-upgrade tool inventory is verified",
  );
  assert.equal(
    expectedVersion,
    contract.plugin.version,
    "--expected-version must match the source plugin manifest before upgrade",
  );
  const expectedSemver = parseSemver(expectedVersion, "Expected Pluto version");
  await assertSupportedCodex(codexBin, codexHome);

  const beforeList = await runCodexJson({
    args: ["plugin", "list", "--json"],
    codexBin,
    codexHome,
    configOverrides: [fileCredentialStoreOverride],
    cwd: repoRoot,
  });
  const before = findInstalledPluto(beforeList);
  assert.ok(
    compareVersions(
      parseSemver(before.version, "Installed Pluto version"),
      expectedSemver,
    ) < 0,
    `Upgrade mode needs an installed Pluto version older than ${expectedVersion}; found ${before.version}`,
  );

  const upgradedMarketplace = await runCodexJson({
    args: ["plugin", "marketplace", "upgrade", marketplace, "--json"],
    codexBin,
    codexHome,
    configOverrides: [fileCredentialStoreOverride],
    cwd: repoRoot,
    timeoutMs: 90_000,
  });
  assert.deepEqual(upgradedMarketplace.errors ?? [], [], "Marketplace upgrade failed");
  assert.ok(
    (upgradedMarketplace.selectedMarketplaces ?? []).includes(marketplace),
    `Marketplace upgrade did not select ${marketplace}`,
  );

  const installed = await runCodexJson({
    args: ["plugin", "add", `pluto@${marketplace}`, "--json"],
    codexBin,
    codexHome,
    configOverrides: [fileCredentialStoreOverride],
    cwd: repoRoot,
  });
  assert.equal(installed.version, expectedVersion);

  const afterList = await runCodexJson({
    args: ["plugin", "list", "--json"],
    codexBin,
    codexHome,
    configOverrides: [fileCredentialStoreOverride],
    cwd: repoRoot,
  });
  assert.equal(findInstalledPluto(afterList).version, expectedVersion);

  const remoteTools = await listAllRemoteTools({ accessToken });
  await runOneHealthyBoot({ codexBin, codexHome, remoteTools });
  console.log(
    `Marketplace and plugin upgrade passed: ${before.version} -> ${expectedVersion}, followed by healthy fresh-task startup and a matching host-status inventory.`,
  );
}

async function reconnectMode({ codexBin, codexHome }) {
  await assertSupportedCodex(codexBin, codexHome);
  const client = await openAppServer({ codexBin, codexHome });
  try {
    const { startup, threadId } = await startFreshTaskAndWaitForPluto(client, repoRoot);
    assert.equal(startup.status, "failed");
    assert.equal(
      startup.failureReason,
      "reauthenticationRequired",
      "Invalid isolated OAuth credentials must produce an actionable reconnect state",
    );
    const host = await getPlutoHostStatus(client, threadId);
    assert.deepEqual(host.tools, {}, "Invalid credentials must not leave stale Pluto tools");
  } finally {
    await client.close();
  }
  console.log(
    "Invalid isolated OAuth credentials produced reauthenticationRequired and no usable tools.",
  );
}

async function main() {
  const { mode, options } = parseArguments(process.argv.slice(2));
  const contract = await readSourceContract(repoRoot);
  assertSourceContract(contract);

  const codexBin = options["codex-bin"] ?? "codex";
  const marketplace = options.marketplace ?? "talentpluto";
  const expectedVersion = options["expected-version"] ?? contract.plugin.version;
  const marketplaceSource = options["marketplace-source"] ?? repoRoot;
  const accessToken = process.env.PLUTO_MCP_ACCESS_TOKEN;

  if (mode === "source") {
    await sourceMode(contract);
    return;
  }

  if (mode === "clean-install") {
    const codexHome = await prepareCleanCodexHome(options["codex-home"]);
    await cleanInstallMode({ codexBin, codexHome, marketplaceSource }, contract);
    return;
  }
  const codexHome = await assertIsolatedCodexHome(options["codex-home"], {
    requireMarker: true,
  });
  if (mode === "live") {
    await liveMode({ accessToken, codexBin, codexHome });
    return;
  }
  if (mode === "upgrade") {
    await upgradeMode(
      { accessToken, codexBin, codexHome, expectedVersion, marketplace },
      contract,
    );
    return;
  }
  if (mode === "reconnect") {
    await reconnectMode({ codexBin, codexHome });
    return;
  }

  throw new Error(`Unsupported mode ${mode}\n\n${usage()}`);
}

main().catch((error) => {
  const secret = process.env.PLUTO_MCP_ACCESS_TOKEN;
  const message = secret
    ? String(error?.stack ?? error).split(secret).join("[REDACTED]")
    : String(error?.stack ?? error);
  console.error(message);
  process.exitCode = 1;
});
