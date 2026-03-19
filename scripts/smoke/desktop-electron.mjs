#!/usr/bin/env node

import {
  createWriteStream,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { spawn, spawnSync } from "node:child_process";
import net from "node:net";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";
import { runPnpm } from "../lib/dev-script-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const desktopPackageDir = path.resolve(repoRoot, "packages", "desktop-electron");
const require = createRequire(path.resolve(desktopPackageDir, "package.json"));

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      options[key] = "true";
      continue;
    }
    options[key] = next;
    index += 1;
  }
  return options;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForPort(port, timeoutMs) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const opened = await new Promise((resolve) => {
      const socket = net.createConnection({ host: "127.0.0.1", port });
      socket.once("connect", () => {
        socket.destroy();
        resolve(true);
      });
      socket.once("error", () => {
        socket.destroy();
        resolve(false);
      });
    });
    if (opened) return;
    await sleep(500);
  }
  throw new Error(`Timed out waiting for TCP port ${port}.`);
}

async function waitForHealth(baseUrl, timeoutMs) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) {
        return;
      }
    } catch {
      // Keep polling until the timeout elapses.
    }
    await sleep(500);
  }
  throw new Error(`Timed out waiting for ${baseUrl}/api/health.`);
}

async function waitForProcessExit(child, timeoutMs) {
  if (child.exitCode !== null) return;

  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timed out waiting for process ${child.pid} to exit.`));
    }, timeoutMs);

    child.once("exit", () => {
      clearTimeout(timer);
      resolve();
    });
  });
}

function isProcessRunning(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function resolveAgentBrowserInvocation() {
  const override = process.env.AGENT_BROWSER_BIN?.trim();
  if (override) {
    return { command: override, prefix: [] };
  }

  if (process.platform === "win32") {
    const candidate = path.resolve(
      process.env.APPDATA ?? "",
      "npm",
      "node_modules",
      "agent-browser",
      "bin",
      "agent-browser-win32-x64.exe",
    );
    if (existsSync(candidate)) {
      return { command: candidate, prefix: [] };
    }
  }

  return {
    command: process.platform === "win32" ? "npx.cmd" : "npx",
    prefix: ["--yes", "agent-browser"],
  };
}

function resolveElectronBinary() {
  if (process.platform === "win32") {
    return require("electron");
  }

  return path.resolve(desktopPackageDir, "node_modules", ".bin", "electron");
}

function runAgentBrowser(invocation, args, options = {}) {
  const result = spawnSync(invocation.command, [...invocation.prefix, ...args], {
    cwd: repoRoot,
    env: process.env,
    encoding: "utf8",
    windowsHide: true,
    timeout: options.timeoutMs ?? 60_000,
    maxBuffer: options.maxBuffer ?? 10 * 1024 * 1024,
  });

  if (options.allowFailure) {
    return result;
  }

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(
      `agent-browser ${args.join(" ")} failed with code ${result.status}\n${result.stderr || result.stdout}`,
    );
  }

  return result;
}

async function readCurrentPageUrl(cdpPort) {
  try {
    const response = await fetch(`http://127.0.0.1:${cdpPort}/json/list`);
    if (!response.ok) {
      return null;
    }

    const targets = await response.json();
    if (!Array.isArray(targets)) {
      return null;
    }

    const page = targets.find((target) => target?.type === "page" && typeof target.url === "string");
    return page?.url ?? null;
  } catch {
    return null;
  }
}

function killProcessTree(pid) {
  if (!pid) return;

  if (process.platform === "win32") {
    spawnSync("taskkill", ["/PID", String(pid), "/T", "/F"], {
      windowsHide: true,
      timeout: 15_000,
    });
    return;
  }

  try {
    process.kill(pid, "SIGKILL");
  } catch {
    // Ignore already-exited processes.
  }
}

function cleanupExistingDesktopProcesses(mainScript, packagedAppPath) {
  if (process.platform !== "win32") return;

  const escapedMainScript = mainScript.replace(/'/g, "''");
  const escapedWorkerScript = path
    .resolve(desktopPackageDir, "dist", "server-worker.js")
    .replace(/'/g, "''");
  const escapedPackagedAppPath = packagedAppPath.replace(/'/g, "''");

  spawnSync(
    "powershell",
    [
      "-NoProfile",
      "-Command",
      `
$targets = Get-CimInstance Win32_Process | Where-Object {
  ($_.Name -eq 'electron.exe' -and (
    $_.CommandLine.Contains('${escapedMainScript}') -or
    $_.CommandLine.Contains('${escapedWorkerScript}')
  )) -or
  ($_.ExecutablePath -eq '${escapedPackagedAppPath}')
}
foreach ($target in $targets) {
  Stop-Process -Id $target.ProcessId -Force -ErrorAction SilentlyContinue
}
      `,
    ],
    {
      windowsHide: true,
      timeout: 20_000,
    },
  );
}

async function waitForBrowserUrl(invocation, cdpPort, baseUrl, timeoutMs) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const result = runAgentBrowser(
      invocation,
      ["--cdp", String(cdpPort), "get", "url"],
      { allowFailure: true },
    );
    const url = result.stdout.trim() || (await readCurrentPageUrl(cdpPort)) || "";
    if (url.startsWith(baseUrl)) {
      return url;
    }
    await sleep(750);
  }
  throw new Error(`Timed out waiting for Electron to load ${baseUrl}.`);
}

function assertSmokeSnapshot(snapshotText) {
  const expected = [
    "Name your company",
    "Start Onboarding",
    "New Company",
    "Dashboard",
    "创建你的第一家公司",
    "开始引导",
    "为你的公司命名",
    "仪表盘",
  ];

  if (expected.some((value) => snapshotText.includes(value))) {
    return;
  }

  throw new Error(
    `Desktop smoke landed on an unexpected screen.\nExpected one of: ${expected.join(", ")}\n\n${snapshotText}`,
  );
}

async function closeDesktopApp(invocation, cdpPort, child) {
  runAgentBrowser(invocation, ["--cdp", String(cdpPort), "close"], { allowFailure: true });

  try {
    await waitForProcessExit(child, 8_000);
    return;
  } catch {
    // Fall through to a native window close on Windows.
  }

  if (process.platform === "win32" && child.pid) {
    spawnSync(
      "powershell",
      [
        "-NoProfile",
        "-Command",
        `$p = Get-Process -Id ${child.pid} -ErrorAction SilentlyContinue; if ($p) { $null = $p.CloseMainWindow(); Start-Sleep -Milliseconds 1500 }`,
      ],
      { windowsHide: true },
    );

    try {
      await waitForProcessExit(child, 10_000);
      return;
    } catch {
      // Fall through to the hard stop below.
    }
  }

  if (child.pid && child.exitCode === null) {
    killProcessTree(child.pid);
    await waitForProcessExit(child, 5_000);
  }
}

async function verifyPostgresStopped(homeDir) {
  const pidFile = path.resolve(homeDir, "instances", "default", "db", "postmaster.pid");
  if (!existsSync(pidFile)) {
    return;
  }

  const pidText = readFileSync(pidFile, "utf8").split(/\r?\n/, 1)[0]?.trim();
  const pid = Number(pidText);
  if (!Number.isInteger(pid) || pid <= 0) {
    return;
  }

  await sleep(1_500);
  if (isProcessRunning(pid)) {
    throw new Error(`Embedded PostgreSQL still appears to be running after shutdown (pid ${pid}).`);
  }
}

async function verifyServerStopped(baseUrl) {
  await sleep(1_000);
  try {
    const response = await fetch(`${baseUrl}/api/health`);
    if (response.ok) {
      throw new Error(`Desktop server still responds after shutdown: ${baseUrl}/api/health`);
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("still responds")) {
      throw error;
    }
  }
}

const options = parseArgs(process.argv.slice(2));
const mode = options.mode === "packaged" ? "packaged" : "dev";
const appPort = Number(options.port ?? "3210");
const cdpPort = Number(options["cdp-port"] ?? "9333");
const runId = new Date().toISOString().replace(/[:.]/g, "-");
const outputDir = path.resolve(
  options["output-dir"] ?? path.resolve(repoRoot, "test-results", "desktop-smoke", runId),
);
const homeDir = path.resolve(outputDir, "home");
const baseUrl = `http://127.0.0.1:${appPort}`;
const packagedAppPath = path.resolve(
  options.app ?? path.resolve(desktopPackageDir, "release", "win-unpacked", "Chopsticks.exe"),
);
const mainScript = path.resolve(desktopPackageDir, "dist", "main.js");
const agentBrowser = resolveAgentBrowserInvocation();
const electronBinary = resolveElectronBinary();

mkdirSync(outputDir, { recursive: true });
mkdirSync(homeDir, { recursive: true });

const stdoutLog = createWriteStream(path.resolve(outputDir, "app.stdout.log"));
const stderrLog = createWriteStream(path.resolve(outputDir, "app.stderr.log"));

console.log(`[desktop-smoke] Output: ${outputDir}`);

let child;
try {
  cleanupExistingDesktopProcesses(mainScript, packagedAppPath);

  if (mode === "dev") {
    console.log("[desktop-smoke] Building desktop shell...");
    runPnpm(["--dir", repoRoot, "--filter", "@chopsticks/desktop-electron", "build"], {
      cwd: repoRoot,
    });

    child = spawn(electronBinary, [`--remote-debugging-port=${cdpPort}`, mainScript], {
      cwd: desktopPackageDir,
      env: {
        ...process.env,
        CHOPSTICKS_DESKTOP_DEV: "true",
        CHOPSTICKS_HOME: homeDir,
        PORT: String(appPort),
      },
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
  } else {
    if (!existsSync(packagedAppPath)) {
      throw new Error(`Packaged app not found: ${packagedAppPath}`);
    }

    child = spawn(packagedAppPath, [`--remote-debugging-port=${cdpPort}`], {
      cwd: path.dirname(packagedAppPath),
      env: {
        ...process.env,
        CHOPSTICKS_HOME: homeDir,
        PORT: String(appPort),
      },
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
  }

  child.stdout?.pipe(stdoutLog);
  child.stderr?.pipe(stderrLog);

  console.log("[desktop-smoke] Waiting for Electron remote debugging...");
  await waitForPort(cdpPort, 60_000);

  console.log("[desktop-smoke] Waiting for Chopsticks server...");
  await waitForHealth(baseUrl, 90_000);
  await waitForBrowserUrl(agentBrowser, cdpPort, baseUrl, 45_000);

  const tabList = runAgentBrowser(agentBrowser, ["--cdp", String(cdpPort), "tab"]);
  writeFileSync(path.resolve(outputDir, "tabs.txt"), tabList.stdout);

  const screenshotPath = path.resolve(outputDir, "desktop.png");
  runAgentBrowser(agentBrowser, ["--cdp", String(cdpPort), "screenshot", screenshotPath]);

  const snapshot = runAgentBrowser(agentBrowser, ["--cdp", String(cdpPort), "snapshot"]);
  writeFileSync(path.resolve(outputDir, "snapshot.txt"), snapshot.stdout);
  assertSmokeSnapshot(snapshot.stdout);

  console.log("[desktop-smoke] Closing app...");
  await closeDesktopApp(agentBrowser, cdpPort, child);
  await verifyServerStopped(baseUrl);
  await verifyPostgresStopped(homeDir);

  console.log("[desktop-smoke] Smoke passed.");
} finally {
  stdoutLog.end();
  stderrLog.end();

  if (child?.exitCode === null && child.pid) {
    killProcessTree(child.pid);
  }

  if (process.env.CHOPSTICKS_DESKTOP_SMOKE_KEEP_OUTPUT !== "true" && process.env.CI !== "true") {
    // Keep output by default in CI; local runs can opt in via CHOPSTICKS_DESKTOP_SMOKE_KEEP_OUTPUT=true.
    // Otherwise leave artifacts in place for inspection.
  }

  if (process.env.CHOPSTICKS_DESKTOP_SMOKE_CLEAN_HOME === "true") {
    rmSync(homeDir, { recursive: true, force: true });
  }
}
