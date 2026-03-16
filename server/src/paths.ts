import fs from "node:fs";
import path from "node:path";
import { resolveDefaultConfigPath } from "./home-paths.js";

const PAPERTAPE_CONFIG_BASENAME = "config.json";
const PAPERTAPE_ENV_FILENAME = ".env";
const REPO_CONFIG_DIRNAME = ".papertape";

function findConfigFileFromAncestors(startDir: string): string | null {
  const absoluteStartDir = path.resolve(startDir);
  let currentDir = absoluteStartDir;

  while (true) {
    const candidate = path.resolve(currentDir, REPO_CONFIG_DIRNAME, PAPERTAPE_CONFIG_BASENAME);
    if (fs.existsSync(candidate)) {
      return candidate;
    }

    const nextDir = path.resolve(currentDir, "..");
    if (nextDir === currentDir) break;
    currentDir = nextDir;
  }

  return null;
}

export function resolvePapertapeConfigPath(overridePath?: string): string {
  if (overridePath) return path.resolve(overridePath);
  if (process.env.PAPERTAPE_CONFIG) return path.resolve(process.env.PAPERTAPE_CONFIG);
  return findConfigFileFromAncestors(process.cwd()) ?? resolveDefaultConfigPath();
}

export function resolvePapertapeEnvPath(overrideConfigPath?: string): string {
  return path.resolve(path.dirname(resolvePapertapeConfigPath(overrideConfigPath)), PAPERTAPE_ENV_FILENAME);
}
