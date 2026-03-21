import fs from "node:fs";
import path from "node:path";

export type DesktopMode = "development" | "packaged";

export type DesktopRuntimeInput = {
  appRoot: string;
  repoRoot: string;
  userDataDir: string;
  mode: DesktopMode;
};

export function resolveDesktopAppRoot(fromFile: string): string {
  return path.resolve(path.dirname(fromFile), "..");
}

export function resolveDesktopRepoRoot(appRoot: string): string {
  return path.resolve(appRoot, "../..");
}

export function resolvePackagedRuntimeRoot(appRoot: string): string {
  return path.resolve(appRoot, "..", "app-runtime");
}

function resolvePackagedServerEntrypoint(runtimeRoot: string): string {
  const candidates = [
    path.resolve(runtimeRoot, "node_modules", "@abacus-lab", "server", "dist", "index.js"),
    path.resolve(runtimeRoot, "node_modules", "@abacus", "server", "dist", "index.js"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return candidates[0];
}

export function resolveServerEntrypoint(input: DesktopRuntimeInput): string {
  return input.mode === "development"
    ? path.resolve(input.repoRoot, "server", "src", "index.ts")
    : resolvePackagedServerEntrypoint(resolvePackagedRuntimeRoot(input.appRoot));
}

export function buildWorkerEnvironment(input: DesktopRuntimeInput): NodeJS.ProcessEnv {
  return {
    ...process.env,
    ABACUS_DESKTOP_MODE: input.mode,
    ABACUS_DESKTOP_SERVER_ENTRY: resolveServerEntrypoint(input),
    ABACUS_HOME: process.env.ABACUS_HOME?.trim() || input.userDataDir,
    ABACUS_INSTANCE_ID: process.env.ABACUS_INSTANCE_ID?.trim() || "default",
    HOST: "127.0.0.1",
    PORT: process.env.PORT?.trim() || "3100",
    ABACUS_OPEN_ON_LISTEN: "false",
    ...(input.mode === "development"
      ? {
          ABACUS_UI_DEV_MIDDLEWARE: "true",
        }
      : {}),
  };
}

export function shouldOpenExternalNavigation(
  targetUrl: string,
  currentAppUrl: string | null,
): boolean {
  let target: URL;
  try {
    target = new URL(targetUrl);
  } catch {
    return false;
  }

  if (target.protocol === "data:") {
    return false;
  }

  if (!currentAppUrl) {
    return target.protocol === "http:" || target.protocol === "https:" || target.protocol === "mailto:";
  }

  try {
    const appUrl = new URL(currentAppUrl);
    if (target.origin === appUrl.origin) {
      return false;
    }
  } catch {
    // Fall back to conservative external-link handling below.
  }

  return target.protocol === "http:" || target.protocol === "https:" || target.protocol === "mailto:";
}

export function formatChildExit(code: number | null, signal: NodeJS.Signals | null): string {
  if (signal) return `signal ${signal}`;
  if (code === null) return "unknown exit";
  return `exit code ${code}`;
}
