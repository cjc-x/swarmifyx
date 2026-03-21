import fs from "node:fs";
import { abacusConfigSchema, type AbacusConfig } from "@abacus-lab/shared";
import { resolveAbacusConfigPath } from "./paths.js";

export function readConfigFile(): AbacusConfig | null {
  const configPath = resolveAbacusConfigPath();

  if (!fs.existsSync(configPath)) return null;

  try {
    const raw = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    return abacusConfigSchema.parse(raw);
  } catch {
    return null;
  }
}
