import { fork, type ChildProcess } from "node:child_process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { app, BrowserWindow, ipcMain, shell } from "electron";
import {
  buildWorkerEnvironment,
  formatChildExit,
  resolveDesktopAppRoot,
  resolvePackagedRuntimeRoot,
  resolveDesktopRepoRoot,
  shouldOpenExternalNavigation,
  type DesktopMode,
} from "./runtime.js";

type WorkerReadyMessage = {
  type: "ready";
  payload: {
    apiUrl: string;
  };
};

type WorkerFatalMessage = {
  type: "fatal";
  error: string;
};

type WorkerMessage = WorkerReadyMessage | WorkerFatalMessage;

const __filename = fileURLToPath(import.meta.url);
const desktopAppRoot = resolveDesktopAppRoot(__filename);
const repoRoot = resolveDesktopRepoRoot(desktopAppRoot);
const workerScript = path.resolve(desktopAppRoot, "dist", "server-worker.js");
const tsxLoaderImport = pathToFileURL(
  path.resolve(desktopAppRoot, "node_modules", "tsx", "dist", "loader.mjs"),
).href;
const desktopMode: DesktopMode =
  process.env.CHOPSTICKS_DESKTOP_DEV === "true" ? "development" : "packaged";
const startupTimeoutMs = 60_000;

let mainWindow: BrowserWindow | null = null;
let workerProcess: ChildProcess | null = null;
let currentAppUrl: string | null = null;
let startupTimer: NodeJS.Timeout | null = null;
let appIsQuitting = false;
let shutdownPromise: Promise<void> | null = null;
const expectedExitPids = new Set<number>();

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function createHtmlDataUrl(title: string, body: string, buttonLabel?: string): string {
  const action = buttonLabel
    ? `<button id="retry">${escapeHtml(buttonLabel)}</button>
<script>
  const btn = document.getElementById("retry");
  btn?.addEventListener("click", () => window.desktopShell?.retryStart?.());
</script>`
    : "";

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <style>
      :root {
        color-scheme: light;
        font-family: "Segoe UI", sans-serif;
      }
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background:
          radial-gradient(circle at top left, rgba(34, 98, 255, 0.10), transparent 32%),
          linear-gradient(180deg, #f4f7fb 0%, #e7edf6 100%);
        color: #152033;
      }
      main {
        width: min(640px, calc(100vw - 48px));
        padding: 36px;
        border-radius: 24px;
        background: rgba(255, 255, 255, 0.94);
        box-shadow: 0 20px 60px rgba(21, 32, 51, 0.12);
      }
      .eyebrow {
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: #2262ff;
        margin: 0 0 10px;
      }
      h1 {
        margin: 0 0 12px;
        font-size: 26px;
      }
      p {
        margin: 0;
        line-height: 1.6;
        white-space: pre-wrap;
      }
      button {
        margin-top: 24px;
        border: 0;
        border-radius: 999px;
        padding: 12px 18px;
        background: #152033;
        color: #fff;
        cursor: pointer;
        font: inherit;
      }
    </style>
  </head>
  <body>
    <main>
      <p class="eyebrow">Chopsticks Desktop</p>
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(body)}</p>
      ${action}
    </main>
  </body>
</html>`;

  return `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
}

function ensureWindow(): BrowserWindow {
  if (mainWindow) return mainWindow;

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1100,
    minHeight: 720,
    show: false,
    title: "Chopsticks",
    backgroundColor: "#e7edf6",
    webPreferences: {
      preload: path.resolve(desktopAppRoot, "dist", "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (shouldOpenExternalNavigation(url, currentAppUrl)) {
      void shell.openExternal(url);
      return { action: "deny" };
    }

    return { action: "allow" };
  });

  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (!shouldOpenExternalNavigation(url, currentAppUrl)) return;
    event.preventDefault();
    void shell.openExternal(url);
  });

  return mainWindow;
}

async function loadLoadingPage(detail: string): Promise<void> {
  await ensureWindow().loadURL(createHtmlDataUrl("Starting Chopsticks", detail));
}

async function loadErrorPage(title: string, detail: string): Promise<void> {
  await ensureWindow().loadURL(createHtmlDataUrl(title, detail, "Retry"));
}

function clearStartupTimer(): void {
  if (!startupTimer) return;
  clearTimeout(startupTimer);
  startupTimer = null;
}

async function stopWorkerProcess(): Promise<void> {
  const child = workerProcess;
  if (!child) return;

  workerProcess = null;
  clearStartupTimer();
  currentAppUrl = null;

  if (child.pid) {
    expectedExitPids.add(child.pid);
  }

  child.kill("SIGTERM");

  await new Promise<void>((resolve) => {
    const killTimer = setTimeout(() => {
      try {
        child.kill("SIGKILL");
      } catch {
        // Ignore follow-up kill failures.
      }
    }, 5_000);

    child.once("exit", () => {
      clearTimeout(killTimer);
      resolve();
    });
  });
}

function attachWorkerLogging(child: ChildProcess): void {
  child.stdout?.on("data", (chunk) => {
    process.stdout.write(`[desktop-worker] ${String(chunk)}`);
  });

  child.stderr?.on("data", (chunk) => {
    process.stderr.write(`[desktop-worker] ${String(chunk)}`);
  });
}

async function startWorkerProcess(reason: string): Promise<void> {
  await stopWorkerProcess();
  await loadLoadingPage(`Booting local control plane...\nReason: ${reason}`);

  const env = buildWorkerEnvironment({
    appRoot: desktopAppRoot,
    repoRoot,
    userDataDir: app.getPath("userData"),
    mode: desktopMode,
  });

  const child = fork(workerScript, [], {
    cwd: desktopMode === "development" ? repoRoot : resolvePackagedRuntimeRoot(desktopAppRoot),
    env: {
      ...env,
      ELECTRON_RUN_AS_NODE: "1",
    },
    execPath: process.execPath,
    execArgv: desktopMode === "development" ? ["--import", tsxLoaderImport] : [],
    stdio: ["ignore", "pipe", "pipe", "ipc"],
  });

  workerProcess = child;
  attachWorkerLogging(child);

  startupTimer = setTimeout(() => {
    void loadErrorPage(
      "Chopsticks failed to start",
      "The local desktop runtime timed out while booting the control plane. Retry to start it again.",
    );
    void stopWorkerProcess();
  }, startupTimeoutMs);

  child.on("message", (message: WorkerMessage) => {
    if (workerProcess !== child) return;

    if (message?.type === "ready") {
      clearStartupTimer();
      currentAppUrl = message.payload.apiUrl.replace(/\/api$/, "");
      void ensureWindow().loadURL(currentAppUrl);
      return;
    }

    if (message?.type === "fatal") {
      clearStartupTimer();
      void loadErrorPage("Chopsticks crashed during startup", message.error);
    }
  });

  child.once("error", (error) => {
    if (workerProcess !== child) return;
    clearStartupTimer();
    void loadErrorPage("Worker process failed", error.message);
  });

  child.once("exit", (code, signal) => {
    clearStartupTimer();
    const wasExpected = child.pid ? expectedExitPids.delete(child.pid) : false;
    if (workerProcess === child) {
      workerProcess = null;
    }
    if (appIsQuitting || wasExpected) return;

    void loadErrorPage(
      "Chopsticks stopped unexpectedly",
      `The local control plane exited with ${formatChildExit(code, signal)}.`,
    );
  });
}

function focusExistingWindow(): void {
  const win = ensureWindow();
  if (win.isMinimized()) {
    win.restore();
  }
  win.focus();
}

async function terminateApplication(signal: NodeJS.Signals): Promise<void> {
  appIsQuitting = true;
  await stopWorkerProcess();
  app.exit(signal === "SIGINT" ? 130 : 143);
}

app.setName("Chopsticks");
app.setAppUserModelId("ai.chopsticks.desktop");

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => {
    focusExistingWindow();
  });

  app.on("window-all-closed", () => {
    app.quit();
  });

  app.on("before-quit", (event) => {
    if (shutdownPromise || !workerProcess) {
      appIsQuitting = true;
      return;
    }

    event.preventDefault();
    appIsQuitting = true;
    shutdownPromise = stopWorkerProcess().finally(() => {
      shutdownPromise = null;
      app.quit();
    });
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      void startWorkerProcess("activate");
      return;
    }
    focusExistingWindow();
  });

  ipcMain.handle("desktop-shell:retry-start", async () => {
    await startWorkerProcess("manual-retry");
  });

  process.once("SIGINT", () => {
    void terminateApplication("SIGINT");
  });

  process.once("SIGTERM", () => {
    void terminateApplication("SIGTERM");
  });

  void app
    .whenReady()
    .then(async () => {
      ensureWindow();
      await startWorkerProcess("initial-start");
    })
    .catch(async (error) => {
      await loadErrorPage("Desktop shell failed", error.message);
    });
}
