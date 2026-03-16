import { test, expect, type Page } from "@playwright/test";

/**
 * E2E: Onboarding wizard flow (skip_llm mode).
 *
 * Walks through the 4-step OnboardingWizard:
 *   Step 1 — Name your company
 *   Step 2 — Create your first agent (adapter selection + config)
 *   Step 3 — Give it something to do (task draft)
 *   Step 4 — Ready to launch (summary + create/open issue)
 *
 * By default this runs in skip_llm mode: we do NOT assert that an LLM
 * heartbeat fires. Set SWARMIFYX_E2E_SKIP_LLM=false to enable LLM-dependent
 * assertions (requires a valid ANTHROPIC_API_KEY).
 */

const SKIP_LLM = process.env.SWARMIFYX_E2E_SKIP_LLM !== "false";

const COMPANY_NAME = `E2E-Test-${Date.now()}`;
const AGENT_NAME = "CEO";
const TASK_TITLE = "E2E test task";
const NEXT_BUTTON = /^(Next|下一步)$/;
const LANGUAGE_BUTTON = /^(Language|语言)$/;
const ADD_COMPANY_BUTTON = /^(Add company|添加公司)$/;
const START_ONBOARDING_BUTTON = /^(Start Onboarding|开始引导)$/;
const WORKDIR_PLACEHOLDER = "/path/to/project";
const TASK_TITLE_PLACEHOLDER = /^(e\.g\. Research competitor pricing|例如：调研竞品定价)$/;
const TASK_DESCRIPTION_PLACEHOLDER =
  /^(Add more detail about what the agent should do\.\.\.|补充更多关于代理要做什么的细节\.\.\.)$/;

async function openOnboarding(page: Page) {
  await page.goto("/");

  const wizardHeading = page.locator("h3", { hasText: /Name your company|为你的公司命名/ });
  const newCompanyBtn = page.getByRole("button", { name: /New Company|新建公司/ });
  const addCompanyBtn = page.getByRole("button", { name: ADD_COMPANY_BUTTON });
  const startOnboardingBtn = page.getByRole("button", { name: START_ONBOARDING_BUTTON });
  const createAnotherCompanyHeading = page.locator("h1", {
    hasText: /Create another company|创建另一家公司/,
  });

  await Promise.any([
    wizardHeading.waitFor({ state: "visible", timeout: 15_000 }),
    newCompanyBtn.waitFor({ state: "visible", timeout: 15_000 }),
    addCompanyBtn.waitFor({ state: "visible", timeout: 15_000 }),
    startOnboardingBtn.waitFor({ state: "visible", timeout: 15_000 }),
    createAnotherCompanyHeading.waitFor({ state: "visible", timeout: 15_000 }),
  ]);

  if (await wizardHeading.isVisible()) {
    return { wizardHeading };
  }

  if (await newCompanyBtn.isVisible()) {
    await newCompanyBtn.click();
  }
  if (!(await wizardHeading.isVisible()) && (await addCompanyBtn.isVisible())) {
    await addCompanyBtn.click();
  }
  if (!(await wizardHeading.isVisible()) && (await startOnboardingBtn.isVisible())) {
    await startOnboardingBtn.click();
  }

  await expect(wizardHeading).toBeVisible({ timeout: 15_000 });

  return { wizardHeading };
}

async function configureCodexAgent(page: Page) {
  await page.getByRole("button", { name: /Codex/ }).click();

  const workdirInput = page.locator(`input[placeholder="${WORKDIR_PLACEHOLDER}"]`);
  await workdirInput.fill(process.cwd());
}

function onboardingLanguageButton(page: Page) {
  return page.getByRole("button", { name: LANGUAGE_BUTTON }).last();
}

function taskTitleInput(page: Page) {
  return page.getByPlaceholder(TASK_TITLE_PLACEHOLDER);
}

function taskDescriptionInput(page: Page) {
  return page.getByPlaceholder(TASK_DESCRIPTION_PLACEHOLDER);
}

test.describe("Onboarding wizard", () => {
  test("completes full wizard flow", async ({ page }) => {
    test.setTimeout(180_000);

    const { wizardHeading } = await openOnboarding(page);

    await expect(wizardHeading).toBeVisible({ timeout: 5_000 });

    const companyNameInput = page.locator('input[placeholder="Acme Corp"]');
    await companyNameInput.fill(COMPANY_NAME);

    await page.getByRole("button", { name: NEXT_BUTTON }).click();

    await expect(
      page.locator("h3", { hasText: "Create your first agent" }),
    ).toBeVisible({ timeout: 10_000 });

    const agentNameInput = page.locator('input[placeholder="CEO"]');
    await expect(agentNameInput).toHaveValue(AGENT_NAME);

    await expect(page.getByRole("button", { name: /Codex/ })).toBeVisible();
    await configureCodexAgent(page);

    await page.getByRole("button", { name: NEXT_BUTTON }).click();

    await expect(
      page.locator("h3", { hasText: "Give it something to do" }),
    ).toBeVisible({ timeout: 60_000 });

    const titleInput = taskTitleInput(page);
    await expect(titleInput).toBeVisible({ timeout: 10_000 });
    await titleInput.clear();
    await titleInput.fill(TASK_TITLE);

    await page.getByRole("button", { name: NEXT_BUTTON }).click();

    await expect(
      page.locator("h3", { hasText: "Ready to launch" }),
    ).toBeVisible({ timeout: 10_000 });

    await expect(page.locator(`text=${COMPANY_NAME}`)).toBeVisible();
    await expect(page.locator(`text=${AGENT_NAME}`)).toBeVisible();
    await expect(page.locator(`text=${TASK_TITLE}`)).toBeVisible();

    await page.getByRole("button", { name: "Create & Open Issue" }).click();

    await expect(page).toHaveURL(/\/issues\//, { timeout: 10_000 });

    const baseUrl = page.url().split("/").slice(0, 3).join("/");

    const companiesRes = await page.request.get(`${baseUrl}/api/companies`);
    expect(companiesRes.ok()).toBe(true);
    const companies = await companiesRes.json();
    const company = companies.find((c: { name: string }) => c.name === COMPANY_NAME);
    expect(company).toBeTruthy();

    const agentsRes = await page.request.get(`${baseUrl}/api/companies/${company.id}/agents`);
    expect(agentsRes.ok()).toBe(true);
    const agents = await agentsRes.json();
    const ceoAgent = agents.find((a: { name: string }) => a.name === AGENT_NAME);
    expect(ceoAgent).toBeTruthy();
    expect(ceoAgent.role).toBe("ceo");
    expect(ceoAgent.adapterType).toBe("codex_local");

    const issuesRes = await page.request.get(`${baseUrl}/api/companies/${company.id}/issues`);
    expect(issuesRes.ok()).toBe(true);
    const issues = await issuesRes.json();
    const task = issues.find((i: { title: string }) => i.title === TASK_TITLE);
    expect(task).toBeTruthy();
    expect(task.assigneeAgentId).toBe(ceoAgent.id);

    if (!SKIP_LLM) {
      await expect(async () => {
        const res = await page.request.get(`${baseUrl}/api/issues/${task.id}`);
        const issue = await res.json();
        expect(["in_progress", "done"]).toContain(issue.status);
      }).toPass({ timeout: 120_000, intervals: [5_000] });
    }
  });

  test("switches onboarding language, persists it, and keeps edited defaults intact", async ({ page }) => {
    test.setTimeout(180_000);

    await openOnboarding(page);

    await onboardingLanguageButton(page).click();
    await page.getByRole("button", { name: "简体中文" }).click();
    await expect(page.locator("h3", { hasText: "为你的公司命名" })).toBeVisible();

    await page.reload();
    await expect(page.getByRole("button", { name: /^(语言|Language)$/ }).first()).toBeVisible({
      timeout: 15_000,
    });

    await openOnboarding(page);
    await expect(page.locator("h3", { hasText: "为你的公司命名" })).toBeVisible({ timeout: 15_000 });

    await page.locator('input[placeholder="Acme 公司"]').fill(`${COMPANY_NAME}-zh`);
    await page.getByRole("button", { name: NEXT_BUTTON }).click();

    await expect(page.locator("h3", { hasText: "创建你的第一个代理" })).toBeVisible({ timeout: 10_000 });
    await configureCodexAgent(page);
    await page.getByRole("button", { name: NEXT_BUTTON }).click();

    const titleInput = taskTitleInput(page);
    const descriptionInput = taskDescriptionInput(page);
    await expect(page.locator("h3", { hasText: "给它一个任务" })).toBeVisible({ timeout: 60_000 });
    await expect(titleInput).toHaveValue("创建你的 CEO HEARTBEAT.md", { timeout: 60_000 });
    await expect(descriptionInput).toContainText("https://github.com/cjc-x/companies/blob/main/default/ceo/AGENTS.md");

    await onboardingLanguageButton(page).click();
    await page.getByRole("button", { name: "English" }).click();
    await expect(titleInput).toHaveValue("Create your CEO HEARTBEAT.md");

    await titleInput.fill("custom onboarding task");

    await onboardingLanguageButton(page).click();
    await page.getByRole("button", { name: "简体中文" }).click();
    await expect(titleInput).toHaveValue("custom onboarding task");
  });
});
