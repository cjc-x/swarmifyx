import { existsSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { formatDatabaseBackupResult, runDatabaseBackup } from "./backup-lib.js";

type PartialConfig = {
  database?: {
    mode?: "embedded-postgres" | "postgres";
    connectionString?: string;
    embeddedPostgresPort?: number;
    backup?: {
      dir?: string;
      retentionDays?: number;
    };
  };
};

function expandHomePrefix(value: string): string {
  if (value === "~") return os.homedir();
  if (value.startsWith("~/")) return path.resolve(os.homedir(), value.slice(2));
  return value;
}

function resolveSwarmifyxHomeDir(): string {
  const envHome = process.env.SWARMIFYX_HOME?.trim();
  if (envHome) return path.resolve(expandHomePrefix(envHome));
  return path.resolve(os.homedir(), ".swarmifyx");
}

function resolveSwarmifyxInstanceId(): string {
  const raw = process.env.SWARMIFYX_INSTANCE_ID?.trim() || "default";
  if (!/^[a-zA-Z0-9_-]+$/.test(raw)) {
    throw new Error(`Invalid SWARMIFYX_INSTANCE_ID '${raw}'.`);
  }
  return raw;
}

function resolveDefaultConfigPath(): string {
  return path.resolve(resolveSwarmifyxHomeDir(), "instances", resolveSwarmifyxInstanceId(), "config.json");
}

function readConfig(configPath: string): PartialConfig | null {
  if (!existsSync(configPath)) return null;
  let parsed: unknown;
  try {
  } catch {
    return null;
  }

  if (typeof parsed !== "object" || !parsed || Array.isArray(parsed)) {
    return null;
  }
  const config = parsed as Record<string, unknown>;
  const database =
    typeof config.database === "object" &&
      config.database !== null &&
      !Array.isArray(config.database)
      ? (config.database as Record<string, unknown>)
      : undefined;
  const backup =
    typeof database?.backup === "object" &&
      database.backup !== null &&
      !Array.isArray(database.backup)
      ? (database.backup as Record<string, unknown>)
      : undefined;
  const mode =
    database?.mode === "embedded-postgres" || database?.mode === "postgres"
      ? database.mode
      : undefined;
  if (database?.mode !== undefined && mode === undefined) {
    throw new Error(`Invalid config at ${configPath}: database.mode must be "embedded-postgres" or "postgres"`);
  }
  return {
    database: database
      ? {
        mode,
        connectionString: typeof database.connectionString === "string" ? database.connectionString : undefined,
        embeddedPostgresPort:
          typeof database.embeddedPostgresPort === "number" ? database.embeddedPostgresPort : undefined,
        backup: backup
          ? {
            dir: typeof backup.dir === "string" ? backup.dir : undefined,
            retentionDays:
              typeof backup.retentionDays === "number"
                ? backup.retentionDays
                : undefined,
          }
          : undefined,
      }
      : undefined,
  };
}

function asPositiveInt(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const rounded = Math.trunc(value);
  return rounded > 0 ? rounded : null;
}

function resolveEmbeddedPort(config: PartialConfig | null): number {
  return asPositiveInt(config?.database?.embeddedPostgresPort) ?? 54329;
}

function resolveConnectionString(config: PartialConfig | null): string {
  const envUrl = process.env.DATABASE_URL?.trim();
  if (envUrl) return envUrl;

  if (config?.database?.mode === "postgres" && typeof config.database.connectionString === "string") {
    const trimmed = config.database.connectionString.trim();
    if (trimmed) return trimmed;
  }

  const port = resolveEmbeddedPort(config);
  return `postgres://swarmifyx:swarmifyx@127.0.0.1:${port}/swarmifyx`;
}

function resolveDefaultBackupDir(): string {
  return path.resolve(resolveSwarmifyxHomeDir(), "instances", resolveSwarmifyxInstanceId(), "data", "backups");
}

function resolveBackupDir(config: PartialConfig | null): string {
  const raw = config?.database?.backup?.dir;
  if (typeof raw === "string" && raw.trim().length > 0) {
    return path.resolve(expandHomePrefix(raw.trim()));
  }
  return resolveDefaultBackupDir();
}

function resolveRetentionDays(config: PartialConfig | null): number {
  return asPositiveInt(config?.database?.backup?.retentionDays) ?? 30;
}

async function main() {
  const configPath = resolveDefaultConfigPath();
  const config = readConfig(configPath);
  const connectionString = resolveConnectionString(config);
  const backupDir = resolveBackupDir(config);
  const retentionDays = resolveRetentionDays(config);

  console.log(`Config path: ${configPath}`);
  console.log(`Backing up database to: ${backupDir}`);
  console.log(`Retention window: ${retentionDays} day(s)`);

  try {
    const result = await runDatabaseBackup({
      connectionString,
      backupDir,
      retentionDays,
      filenamePrefix: "swarmifyx",
    });

    console.log(`Backup saved: ${formatDatabaseBackupResult(result)}`);
  } catch (err) {
    console.error("Backup failed.");
    if (err instanceof Error) {
      console.error(err.message);
    } else {
      console.error(String(err));
    }
    process.exit(1);
  }
}

await main();
