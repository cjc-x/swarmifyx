// @vitest-environment jsdom

import { afterEach, describe, expect, it } from "vitest";
import {
  applyDocumentLocale,
  getActiveLocale,
  persistLocale,
  resolvePreferredLocale,
  setActiveLocale,
  translateText,
} from "./i18n";

const DEFAULT_TASK_DESCRIPTION = `Setup yourself as the CEO. Use the ceo persona found here: 

https://github.com/chopsticksai/companies/blob/main/default/ceo/AGENTS.md

Ensure you have a folder agents/ceo and then download this AGENTS.md as well as the sibling HEARTBEAT.md, SOUL.md, and TOOLS.md. and set that AGENTS.md as the path to your agents instruction file

And after you've finished that, hire yourself a Founding Engineer agent`;

describe("i18n", () => {
  afterEach(() => {
    window.localStorage.clear();
    setActiveLocale("en-US");
    applyDocumentLocale("en-US");
    Object.defineProperty(window.navigator, "language", {
      value: "en-US",
      configurable: true,
    });
  });

  it("prefers a stored locale over navigator language", () => {
    Object.defineProperty(window.navigator, "language", {
      value: "en-US",
      configurable: true,
    });
    persistLocale("zh-CN");

    expect(resolvePreferredLocale()).toBe("zh-CN");
  });

  it("falls back to navigator language when storage is empty", () => {
    Object.defineProperty(window.navigator, "language", {
      value: "zh-CN",
      configurable: true,
    });

    expect(resolvePreferredLocale()).toBe("zh-CN");
  });

  it("falls back to en-US for unsupported navigator languages", () => {
    Object.defineProperty(window.navigator, "language", {
      value: "fr-FR",
      configurable: true,
    });

    expect(resolvePreferredLocale()).toBe("en-US");
  });

  it("translates the updated onboarding copy and applies document language", () => {
    setActiveLocale("zh-CN");
    applyDocumentLocale("zh-CN");

    expect(getActiveLocale()).toBe("zh-CN");
    expect(document.documentElement.lang).toBe("zh-CN");
    expect(translateText("Create & Open Issue")).toBe("创建并打开任务");
    expect(
      translateText(
        "Everything is set up. Launching now will create the starter task, wake the agent, and open the issue.",
      ),
    ).toBe("一切都已准备就绪。现在启动会创建起始任务、唤醒代理，并打开该任务。");
    expect(translateText(DEFAULT_TASK_DESCRIPTION)).toContain("先把自己设定为 CEO");
    expect(translateText(DEFAULT_TASK_DESCRIPTION)).toContain(
      "https://github.com/chopsticksai/companies/blob/main/default/ceo/AGENTS.md",
    );
  });
});
