import { afterEach, describe, expect, it } from "vitest";
import { setActiveLocale } from "../lib/i18n";
import { approvalLabel } from "./ApprovalPayload";

describe("approvalLabel", () => {
  afterEach(() => {
    setActiveLocale("en-US");
  });

  it("recomputes localized labels when the active locale changes", () => {
    setActiveLocale("en-US");
    expect(approvalLabel("hire_agent", { name: "Designer" })).toBe("Hire Agent: Designer");
    expect(approvalLabel("budget_override_required")).toBe("Budget Override");

    setActiveLocale("zh-CN");
    expect(approvalLabel("hire_agent", { name: "Designer" })).toBe("招聘代理：Designer");
    expect(approvalLabel("budget_override_required")).toBe("预算覆盖");
  });
});
