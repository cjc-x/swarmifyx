import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { resolveDatabaseTarget } from "./runtime-config.js";

const ORIGINAL_CWD = process.cwd();
const ORIGINAL_ENV = { ...process.env };

function writeJson(filePath: string, value: unknown) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

function writeText(filePath: string, value: string) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, value);
}

afterEach(() => {
  process.chdir(ORIGINAL_CWD);
  for (const key of Object.keys(process.env)) {
    if (!(key in ORIGINAL_ENV)) delete process.env[key];
  }
  for (const [key, value] of Object.entries(ORIGINAL_ENV)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("resolveDatabaseTarget", () => {
  it("uses DATABASE_URL from process env first", () => {
    process.env.DATABASE_URL = "postgres://env-user:env-pass@db.example.com:5432/papertape";

    const target = resolveDatabaseTarget();

    expect(target).toMatchObject({
      mode: "postgres",
      connectionString: "postgres://env-user:env-pass@db.example.com:5432/papertape",
      source: "DATABASE_URL",
    });
  });

  it("uses DATABASE_URL from repo-local .papertape/.env", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "papertape-db-runtime-"));
    const projectDir = path.join(tempDir, "repo");
    fs.mkdirSync(projectDir, { recursive: true });
    process.chdir(projectDir);
    delete process.env.PAPERTAPE_CONFIG;
    writeJson(path.join(projectDir, ".papertape", "config.json"), {
      database: { mode: "embedded-postgres", embeddedPostgresPort: 54329 },
    });
    writeText(
      path.join(projectDir, ".papertape", ".env"),
      'DATABASE_URL="postgres://file-user:file-pass@db.example.com:6543/papertape"\n',
    );

    const target = resolveDatabaseTarget();

    expect(target).toMatchObject({
      mode: "postgres",
      connectionString: "postgres://file-user:file-pass@db.example.com:6543/papertape",
      source: "papertape-env",
    });
  });

  it("uses config postgres connection string when configured", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "papertape-db-runtime-"));
    const configPath = path.join(tempDir, "instance", "config.json");
    process.env.PAPERTAPE_CONFIG = configPath;
    writeJson(configPath, {
      database: {
        mode: "postgres",
        connectionString: "postgres://cfg-user:cfg-pass@db.example.com:5432/papertape",
      },
    });

    const target = resolveDatabaseTarget();

    expect(target).toMatchObject({
      mode: "postgres",
      connectionString: "postgres://cfg-user:cfg-pass@db.example.com:5432/papertape",
      source: "config.database.connectionString",
    });
  });

  it("rejects unsupported database modes in config", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "papertape-db-runtime-"));
    const configPath = path.join(tempDir, "instance", "config.json");
    process.env.PAPERTAPE_CONFIG = configPath;
    writeJson(configPath, {
      database: {
        mode: "pglite",
      },
    });

    expect(() => resolveDatabaseTarget()).toThrow(/database\.mode must be "embedded-postgres" or "postgres"/);
  });

  it("falls back to embedded postgres settings from config", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "papertape-db-runtime-"));
    const configPath = path.join(tempDir, "instance", "config.json");
    process.env.PAPERTAPE_CONFIG = configPath;
    writeJson(configPath, {
      database: {
        mode: "embedded-postgres",
        embeddedPostgresDataDir: "~/papertape-test-db",
        embeddedPostgresPort: 55444,
      },
    });

    const target = resolveDatabaseTarget();

    expect(target).toMatchObject({
      mode: "embedded-postgres",
      dataDir: path.resolve(os.homedir(), "papertape-test-db"),
      port: 55444,
      source: "embedded-postgres@55444",
    });
  });
});
