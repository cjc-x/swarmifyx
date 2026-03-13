#!/usr/bin/env node
import { copyFileSync, existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runChecked, runNodeScript, runPnpm } from "./lib/dev-script-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const cliDir = path.resolve(repoRoot, "cli");
const distEntry = path.resolve(cliDir, "dist", "index.js");
const devManifest = path.resolve(cliDir, "package.json");
const publishBackupManifest = path.resolve(cliDir, "package.dev.json");
const publishReadme = path.resolve(cliDir, "README.md");
const rootReadme = path.resolve(repoRoot, "README.md");
const skipChecks = process.argv.includes("--skip-checks");

console.log("==> Building swarmifyx for npm");

if (!skipChecks) {
  console.log("  [1/6] Running forbidden token check...");
  runNodeScript(path.resolve(repoRoot, "scripts", "check-forbidden-tokens.mjs"), [], { cwd: repoRoot });
} else {
  console.log("  [1/6] Skipping forbidden token check (--skip-checks)");
}

console.log("  [2/6] Type-checking...");
runPnpm(["-r", "typecheck"], { cwd: repoRoot });

console.log("  [3/6] Bundling CLI with esbuild...");
runPnpm(["--dir", cliDir, "build"], { cwd: repoRoot });

if (!existsSync(distEntry)) {
  throw new Error(`CLI bundle is missing: ${distEntry}`);
}

console.log("  [4/6] Verifying bundled entrypoint syntax...");
runChecked(process.execPath, ["--check", distEntry], { cwd: repoRoot });

console.log("  [5/6] Generating publishable package.json...");
copyFileSync(devManifest, publishBackupManifest);
runNodeScript(path.resolve(repoRoot, "scripts", "generate-npm-package-json.mjs"), [], { cwd: repoRoot });
copyFileSync(rootReadme, publishReadme);

const bundleSize = statSync(distEntry).size;
console.log("  [6/6] Build verification...");
console.log("");
console.log("Build complete.");
console.log(`  Bundle: cli/dist/index.js (${bundleSize} bytes)`);
console.log("  Source map: cli/dist/index.js.map");
console.log("");
console.log("To preview:   cd cli && npm pack --dry-run");
console.log("To publish:   cd cli && npm publish --access public");
console.log("To restore:   mv cli/package.dev.json cli/package.json");
