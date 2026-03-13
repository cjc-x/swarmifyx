#!/usr/bin/env node
import { rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cliDir = path.resolve(__dirname, "..");

rmSync(path.resolve(cliDir, "dist"), { recursive: true, force: true });
