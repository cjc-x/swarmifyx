import fs from "node:fs";
import { papertapeConfigSchema, type PapertapeConfig } from "@papertape/shared";
import { resolvePapertapeConfigPath } from "./paths.js";

export function readConfigFile(): PapertapeConfig | null {
  const configPath = resolvePapertapeConfigPath();

  if (!fs.existsSync(configPath)) return null;

  try {
    const raw = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    return papertapeConfigSchema.parse(raw);
  } catch {
    return null;
  }
}
