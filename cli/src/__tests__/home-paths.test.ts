import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  describeLocalInstancePaths,
  expandHomePrefix,
  resolvePaperclipHomeDir,
  resolvePaperclipInstanceId,
} from "../config/home.js";

const ORIGINAL_ENV = { ...process.env };

describe("home path resolution", () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.restoreAllMocks();
  });

  it("defaults to ~/.swarmifyx and default instance", () => {
    delete process.env.PAPERCLIP_HOME;
    delete process.env.PAPERCLIP_INSTANCE_ID;
    const fakeHome = fs.mkdtempSync(path.join(os.tmpdir(), "swarmifyx-home-"));
    vi.spyOn(os, "homedir").mockReturnValue(fakeHome);

    const paths = describeLocalInstancePaths();
    expect(paths.homeDir).toBe(path.resolve(fakeHome, ".swarmifyx"));
    expect(paths.instanceId).toBe("default");
    expect(paths.configPath).toBe(path.resolve(fakeHome, ".swarmifyx", "instances", "default", "config.json"));
  });

  it("falls back to ~/.paperclip when the new home does not exist yet", () => {
    delete process.env.PAPERCLIP_HOME;
    delete process.env.PAPERCLIP_INSTANCE_ID;
    const fakeHome = fs.mkdtempSync(path.join(os.tmpdir(), "swarmifyx-home-"));
    fs.mkdirSync(path.join(fakeHome, ".paperclip"), { recursive: true });
    vi.spyOn(os, "homedir").mockReturnValue(fakeHome);

    expect(resolvePaperclipHomeDir()).toBe(path.resolve(fakeHome, ".paperclip"));
  });

  it("supports PAPERCLIP_HOME and explicit instance ids", () => {
    process.env.PAPERCLIP_HOME = "~/paperclip-home";

    const home = resolvePaperclipHomeDir();
    expect(home).toBe(path.resolve(os.homedir(), "paperclip-home"));
    expect(resolvePaperclipInstanceId("dev_1")).toBe("dev_1");
  });

  it("rejects invalid instance ids", () => {
    expect(() => resolvePaperclipInstanceId("bad/id")).toThrow(/Invalid instance id/);
  });

  it("expands ~ prefixes", () => {
    expect(expandHomePrefix("~")).toBe(os.homedir());
    expect(expandHomePrefix("~/x/y")).toBe(path.resolve(os.homedir(), "x/y"));
  });
});
