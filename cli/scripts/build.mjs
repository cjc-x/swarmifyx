#!/usr/bin/env node
import { rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import esbuild from "esbuild";
import config from "../esbuild.config.mjs";
import { bestEffortChmod } from "../../scripts/lib/dev-script-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cliDir = path.resolve(__dirname, "..");
const distDir = path.resolve(cliDir, "dist");
const bundleEntrypoint = path.resolve(distDir, "index.js");

rmSync(distDir, { recursive: true, force: true });
await esbuild.build(config);
bestEffortChmod(bundleEntrypoint, 0o755);
