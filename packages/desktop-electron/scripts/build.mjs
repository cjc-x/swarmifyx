#!/usr/bin/env node

import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageDir = path.resolve(__dirname, "..");
const distDir = path.resolve(packageDir, "dist");
const require = createRequire(import.meta.url);
const JavaScriptObfuscator = require("javascript-obfuscator");

function parseProfile(argv) {
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--profile") {
      return argv[index + 1] ?? "dev";
    }
    if (arg.startsWith("--profile=")) {
      return arg.slice("--profile=".length);
    }
  }

  return process.env.ABACUS_DESKTOP_BUILD_PROFILE?.trim() || "dev";
}

function getEntryPoints() {
  return {
    main: path.resolve(packageDir, "src", "main.ts"),
    preload: path.resolve(packageDir, "src", "preload.ts"),
    runtime: path.resolve(packageDir, "src", "runtime.ts"),
    "server-worker": path.resolve(packageDir, "src", "server-worker.ts"),
  };
}

function getOutputFiles() {
  return ["main.js", "preload.js", "runtime.js", "server-worker.js"].map((fileName) =>
    path.resolve(distDir, fileName),
  );
}

function obfuscateFile(filePath) {
  const source = readFileSync(filePath, "utf8");
  const result = JavaScriptObfuscator.obfuscate(source, {
    compact: true,
    controlFlowFlattening: false,
    deadCodeInjection: false,
    debugProtection: false,
    disableConsoleOutput: false,
    identifierNamesGenerator: "hexadecimal",
    ignoreImports: true,
    numbersToExpressions: true,
    renameGlobals: false,
    renameProperties: false,
    selfDefending: false,
    sourceMap: false,
    sourceType: "module",
    splitStrings: false,
    stringArray: true,
    stringArrayEncoding: ["base64"],
    stringArrayThreshold: 1,
    target: "node",
    transformObjectKeys: false,
    unicodeEscapeSequence: false,
  });

  writeFileSync(filePath, result.getObfuscatedCode());
}

async function run() {
  const profile = parseProfile(process.argv.slice(2));
  const isRelease = profile === "release";

  if (!["dev", "release"].includes(profile)) {
    throw new Error(`Unsupported desktop build profile: ${profile}`);
  }

  rmSync(distDir, { recursive: true, force: true });
  mkdirSync(distDir, { recursive: true });

  await build({
    absWorkingDir: packageDir,
    bundle: true,
    entryPoints: getEntryPoints(),
    entryNames: "[name]",
    external: ["electron"],
    format: "esm",
    legalComments: "none",
    logLevel: "info",
    minify: isRelease,
    outdir: distDir,
    platform: "node",
    sourcemap: isRelease ? false : "external",
    splitting: false,
    target: "node20",
    treeShaking: true,
  });

  if (!isRelease) {
    return;
  }

  for (const filePath of getOutputFiles()) {
    obfuscateFile(filePath);
  }
}

void run().catch((error) => {
  console.error("[desktop-build] Failed:", error);
  process.exitCode = 1;
});
