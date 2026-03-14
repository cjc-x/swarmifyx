import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  describeLocalInstancePaths,
  expandHomePrefix,
  resolveSwarmifyxHomeDir,
  resolveSwarmifyxInstanceId,
} from "../config/home.js";

const ORIGINAL_ENV = { ...process.env };

describe("home path resolution", () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.restoreAllMocks();
  });

  it("defaults to ~/.swarmifyx and default instance", () => {
    delete process.env.SWARMIFYX_HOME;
    delete process.env.SWARMIFYX_INSTANCE_ID;
    const fakeHome = fs.mkdtempSync(path.join(os.tmpdir(), "swarmifyx-home-"));
    vi.spyOn(os, "homedir").mockReturnValue(fakeHome);

    const paths = describeLocalInstancePaths();
    expect(paths.homeDir).toBe(path.resolve(fakeHome, ".swarmifyx"));
    expect(paths.instanceId).toBe("default");
    expect(paths.configPath).toBe(path.resolve(fakeHome, ".swarmifyx", "instances", "default", "config.json"));
  });

  it("supports SWARMIFYX_HOME and explicit instance ids", () => {
    process.env.SWARMIFYX_HOME = "~/swarmifyx-home";

    const home = resolveSwarmifyxHomeDir();
    expect(home).toBe(path.resolve(os.homedir(), "swarmifyx-home"));
    expect(resolveSwarmifyxInstanceId("dev_1")).toBe("dev_1");
  });

  it("rejects invalid instance ids", () => {
    expect(() => resolveSwarmifyxInstanceId("bad/id")).toThrow(/Invalid instance id/);
  });

  it("expands ~ prefixes", () => {
    expect(expandHomePrefix("~")).toBe(os.homedir());
    expect(expandHomePrefix("~/x/y")).toBe(path.resolve(os.homedir(), "x/y"));
  });
});
