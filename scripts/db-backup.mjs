#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runPnpm } from "./lib/dev-script-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

runPnpm(["swarmifyx", "db:backup", ...process.argv.slice(2)], { cwd: repoRoot });
