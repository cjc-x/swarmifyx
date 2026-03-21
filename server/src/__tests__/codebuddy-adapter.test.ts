import { describe, expect, it } from "vitest";
import {
  isCodeBuddyUnknownSessionError,
  parseCodeBuddyJsonl,
  sessionCodec as codeBuddySessionCodec,
} from "@abacus-lab/adapter-codebuddy-local/server";

describe("codebuddy adapter", () => {
  it("parses successful stream-json output", () => {
    const parsed = parseCodeBuddyJsonl([
      "{\"type\":\"system\",\"subtype\":\"init\",\"session_id\":\"session-123\",\"model\":\"glm-5.0\"}",
      "{\"type\":\"assistant\",\"message\":{\"content\":[{\"type\":\"text\",\"text\":\"hello\"}]}}",
      "{\"type\":\"result\",\"subtype\":\"success\",\"result\":\"hello\",\"usage\":{\"input_tokens\":10,\"output_tokens\":1},\"total_cost_usd\":0}",
    ].join("\n"));

    expect(parsed).toEqual({
      sessionId: "session-123",
      summary: "hello",
      usage: {
        inputTokens: 10,
        cachedInputTokens: 0,
        outputTokens: 1,
      },
      costUsd: null,
      errorMessage: null,
    });
  });

  it("normalizes session params with cwd", () => {
    const parsed = codeBuddySessionCodec.deserialize({
      session_id: "codebuddy-session-1",
      cwd: "/tmp/codebuddy",
    });
    expect(parsed).toEqual({
      sessionId: "codebuddy-session-1",
      cwd: "/tmp/codebuddy",
    });

    const serialized = codeBuddySessionCodec.serialize(parsed);
    expect(serialized).toEqual({
      sessionId: "codebuddy-session-1",
      cwd: "/tmp/codebuddy",
    });
    expect(codeBuddySessionCodec.getDisplayId?.(serialized ?? null)).toBe("codebuddy-session-1");
  });

  it("detects missing resume sessions even when the CLI exits zero", () => {
    expect(
      isCodeBuddyUnknownSessionError(
        "{\"type\":\"error\",\"error\":\"No conversation found with session ID: session-does-not-exist\"}",
        "",
      ),
    ).toBe(true);
    expect(
      isCodeBuddyUnknownSessionError(
        "{\"type\":\"result\",\"subtype\":\"success\",\"result\":\"ok\"}",
        "",
      ),
    ).toBe(false);
  });

  it("extracts result errors from CodeBuddy error arrays", () => {
    const parsed = parseCodeBuddyJsonl([
      "{\"type\":\"system\",\"subtype\":\"init\",\"session_id\":\"session-123\",\"model\":\"glm-5.0\"}",
      "{\"type\":\"result\",\"subtype\":\"error_during_execution\",\"is_error\":true,\"result\":{},\"errors\":[\"aborted\"],\"usage\":{\"input_tokens\":10,\"output_tokens\":1},\"total_cost_usd\":0}",
    ].join("\n"));

    expect(parsed).toEqual({
      sessionId: "session-123",
      summary: "",
      usage: {
        inputTokens: 10,
        cachedInputTokens: 0,
        outputTokens: 1,
      },
      costUsd: null,
      errorMessage: "aborted",
    });
  });
});
