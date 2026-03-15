import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  resolveDynamicForbiddenTokens,
  resolveForbiddenTokens,
  runForbiddenTokenCheck,
} from "../../../scripts/check-forbidden-tokens-lib.mjs";
import { describe, expect, it, vi } from "vitest";

describe("forbidden token check", () => {
  it("derives username tokens without relying on whoami", () => {
    const tokens = resolveDynamicForbiddenTokens(
      { USER: "swarmifyx", LOGNAME: "swarmifyx", USERNAME: "pc" },
      {
        userInfo: () => ({ username: "swarmifyx" }),
      },
    );

    expect(tokens).toEqual(["swarmifyx", "pc"]);
  });

  it("falls back cleanly when user resolution fails", () => {
    const tokens = resolveDynamicForbiddenTokens(
      {},
      {
        userInfo: () => {
          throw new Error("missing user");
        },
      },
    );

    expect(tokens).toEqual([]);
  });

  it("merges dynamic and file-based forbidden tokens", async () => {
    const tokensFile = path.join(os.tmpdir(), `forbidden-tokens-${Date.now()}.txt`);
    fs.writeFileSync(tokensFile, "# comment\nswarmifyx\ncustom-token\n");

    try {
      const tokens = resolveForbiddenTokens(tokensFile, { USER: "swarmifyx" }, {
        userInfo: () => ({ username: "swarmifyx" }),
      });

      expect(tokens).toEqual(["swarmifyx", "custom-token"]);
    } finally {
      fs.unlinkSync(tokensFile);
    }
  });

  it("reports matches without leaking which token was searched", () => {
    const exec = vi
      .fn()
      .mockReturnValueOnce("server/file.ts:1:found\n")
      .mockImplementation(() => {
        throw new Error("not found");
      });
    const log = vi.fn();
    const error = vi.fn();

    const exitCode = runForbiddenTokenCheck({
      repoRoot: "/repo",
      tokens: ["swarmifyx", "custom-token"],
      exec,
      log,
      error,
    });

    expect(exitCode).toBe(1);
    expect(exec).toHaveBeenCalledTimes(2);
    expect(error).toHaveBeenCalledWith("ERROR: Forbidden tokens found in tracked files:\n");
    expect(error).toHaveBeenCalledWith("  server/file.ts:1:found");
    expect(error).toHaveBeenCalledWith("\nBuild blocked. Remove the forbidden token(s) before publishing.");
  });
});
