import { describe, expect, it } from "vitest";
import { applyCompanyPrefix, resolveCompanyRouteSync } from "./company-routes";

describe("resolveCompanyRouteSync", () => {
  it("redirects archived company routes to an active fallback company", () => {
    const resolution = resolveCompanyRouteSync({
      companies: [
        { id: "archived-company", issuePrefix: "OLD", status: "archived" },
        { id: "active-company", issuePrefix: "NEW", status: "active" },
      ],
      companyPrefix: "OLD",
      pathname: "/OLD/company/settings",
      search: "?tab=danger",
      selectedCompanyId: "active-company",
    });

    expect(resolution).toEqual({
      kind: "redirect",
      to: "/NEW/company/settings?tab=danger",
    });
  });

  it("syncs selection when the route points at another active company", () => {
    const resolution = resolveCompanyRouteSync({
      companies: [
        { id: "company-a", issuePrefix: "AAA", status: "active" },
        { id: "company-b", issuePrefix: "BBB", status: "active" },
      ],
      companyPrefix: "BBB",
      pathname: "/BBB/dashboard",
      selectedCompanyId: "company-a",
    });

    expect(resolution).toEqual({
      kind: "set_selected",
      companyId: "company-b",
    });
  });

  it("redirects to global onboarding when the archived company is the only available company", () => {
    const resolution = resolveCompanyRouteSync({
      companies: [{ id: "archived-company", issuePrefix: "OLD", status: "archived" }],
      companyPrefix: "OLD",
      pathname: "/OLD/companies",
      selectedCompanyId: "archived-company",
    });

    expect(resolution).toEqual({
      kind: "redirect",
      to: "/onboarding",
    });
  });

  it("treats onboarding as a global path", () => {
    expect(applyCompanyPrefix("/onboarding", "OLD")).toBe("/onboarding");
  });
});
