#!/usr/bin/env node
import { cpSync, existsSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runPnpm } from "./lib/dev-script-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const uiDist = path.resolve(repoRoot, "ui", "dist");
const serverUiDist = path.resolve(repoRoot, "server", "ui-dist");
const uiIndexHtml = path.resolve(uiDist, "index.html");

console.log("  -> Building @abacus-lab/ui...");
runPnpm(["--dir", repoRoot, "--filter", "@abacus-lab/ui", "build"], { cwd: repoRoot });

if (!existsSync(uiIndexHtml)) {
  throw new Error(`UI build output missing at ${uiIndexHtml}`);
}

rmSync(serverUiDist, { recursive: true, force: true });
cpSync(uiDist, serverUiDist, { recursive: true, force: true });
console.log("  -> Copied ui/dist to server/ui-dist");
