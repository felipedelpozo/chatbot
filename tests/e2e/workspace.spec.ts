import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

async function openAccountMenu(page: Page, withKeyboard = false) {
  const trigger = page.getByRole("button", { name: /Open account menu for/ });
  if (withKeyboard) {
    await trigger.focus();
    await trigger.press("Enter");
  } else {
    await trigger.click();
  }
  const accountMenu = page.getByRole("dialog", {
    name: /Open account menu for/,
  });
  await expect(accountMenu).toBeVisible();
  return accountMenu;
}

async function openProviderSettings(page: Page, withKeyboard = false) {
  const accountMenu = await openAccountMenu(page, withKeyboard);
  const settings = accountMenu.getByRole("button", { name: "Settings" });
  if (withKeyboard) {
    await settings.focus();
    await settings.press("Enter");
  } else {
    await settings.click();
  }
}

test("shows only connected provider models and protects the workspace", async ({
  browser,
  page,
}) => {
  const email = `e2e-${crypto.randomUUID()}@example.test`;

  await page.goto("/sign-up");
  await page.getByRole("textbox", { name: "Name" }).fill("E2E Builder");
  await page.getByRole("textbox", { name: "Email" }).fill(email);
  await page.getByLabel(/Password/).fill("correct-horse-battery-staple");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL("/");

  await page.getByRole("button", { name: "Create project" }).click();
  const createProjectDialog = page.getByRole("dialog", {
    name: "Create project",
  });
  await expect(createProjectDialog).toBeVisible();
  await createProjectDialog
    .getByRole("textbox", { name: "Project name" })
    .fill("E2E release");
  await createProjectDialog
    .getByRole("button", { name: "Create project" })
    .click();
  await expect(page).toHaveURL(/\/projects\/.+\/chats\/.+/);
  await expect(page.getByText("Agent workspace · E2E release")).toBeVisible();
  await expect(page.getByText("Connected", { exact: true })).toHaveCount(0);
  await expect(
    page.getByText("Configure a provider account to use external AI models."),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Configure a provider account" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Connect a provider" }),
  ).toBeDisabled();
  await expect(page.getByText("Demo · Balanced", { exact: true })).toHaveCount(0);

  if (process.env.CAPTURE_DESIGN_QA === "1") {
    await page.setViewportSize({ width: 1187, height: 720 });
    const header = page.locator("main > header");
    await header
      .getByRole("button", { name: "Toggle sidebar" })
      .click();
    await page.waitForTimeout(450);
    await page.screenshot({
      path: "design-qa/no-provider-model-state.png",
      fullPage: false,
    });
    await header.screenshot({ path: "design-qa/header-unconfigured.png" });
    await header
      .getByRole("button", { name: "Toggle sidebar" })
      .click();
    await page.waitForTimeout(450);
  }

  await expect(page.getByRole("button", { name: "Settings" })).toHaveCount(0);
  await openAccountMenu(page, true);
  await page.locator("[data-morph-popover-portal]").evaluate(async (portal) => {
    await Promise.all(
      portal
        .getAnimations({ subtree: true })
        .map((animation) => animation.finished.catch(() => undefined)),
    );
  });
  await page.waitForTimeout(300);
  const accountMenuAccessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  expect(
    accountMenuAccessibility.violations.filter(
      (violation) => violation.impact === "critical" || violation.impact === "serious",
    ),
  ).toEqual([]);
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Configure a provider account" })
    .click();
  const providerSettings = page.getByRole("dialog", { name: "Provider settings" });
  const openAISettings = providerSettings.getByRole("region", { name: "OpenAI" });
  await expect(openAISettings).toContainText("Not configured");

  const invalidCredentialStatuses = await page.evaluate(async () => {
    const requests = [
      ["/api/providers/openai", ""],
      ["/api/providers/openai", "too-short"],
      ["/api/providers/openai", "x".repeat(4097)],
      ["/api/providers/unsupported", "synthetic-provider-key-1234"],
    ] as const;
    return Promise.all(
      requests.map(async ([url, apiKey]) =>
        fetch(url, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apiKey }),
        }).then((response) => response.status),
      ),
    );
  });
  expect(invalidCredentialStatuses).toEqual([422, 422, 422, 422]);

  const firstCredential = "e2e-synthetic-openai-key-1234";
  await openAISettings.getByLabel("OpenAI API key").fill(firstCredential);
  await openAISettings.getByRole("button", { name: "Save" }).click();
  await expect(providerSettings.getByRole("status")).toHaveText(
    "OpenAI credential saved.",
  );
  await expect(openAISettings).toContainText("••••1234");

  const statusPayload = await page.evaluate(async () =>
    fetch("/api/providers").then((response) => response.text()),
  );
  expect(statusPayload).not.toContain(firstCredential);

  await openAISettings
    .getByLabel("OpenAI API key")
    .fill("e2e-synthetic-openai-key-5678");
  await openAISettings.getByRole("button", { name: "Replace" }).click();
  await expect(openAISettings).toContainText("••••5678");

  const providerSettingsAccessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  expect(
    providerSettingsAccessibility.violations.filter(
      (violation) => violation.impact === "critical" || violation.impact === "serious",
    ),
  ).toEqual([]);

  await providerSettings
    .getByRole("button", { name: "Close provider settings" })
    .click();
  await expect(page.getByText("Provider ready", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Configure a provider account" }),
  ).toHaveCount(0);

  const isolatedContext = await browser.newContext();
  const isolatedPage = await isolatedContext.newPage();
  const isolatedEmail = `e2e-isolated-${crypto.randomUUID()}@example.test`;
  await isolatedPage.goto("/sign-up");
  await isolatedPage.getByRole("textbox", { name: "Name" }).fill("Isolated User");
  await isolatedPage.getByRole("textbox", { name: "Email" }).fill(isolatedEmail);
  await isolatedPage.getByLabel(/Password/).fill("correct-horse-battery-staple");
  await isolatedPage.getByRole("button", { name: "Create account" }).click();
  await expect(isolatedPage).toHaveURL("/");
  await openProviderSettings(isolatedPage, true);
  await expect(
    isolatedPage
      .getByRole("dialog", { name: "Provider settings" })
      .getByRole("region", { name: "OpenAI" }),
  ).toContainText("Not configured");
  await isolatedContext.close();

  await page.getByRole("button", { name: "GPT-5.6" }).click();
  const modelList = page.getByRole("listbox");
  await expect(modelList.getByRole("option")).toHaveCount(3);
  await expect(modelList.getByText("GPT-5.6", { exact: true })).toBeVisible();
  await expect(
    modelList.getByText("GPT-5.6 Terra", { exact: true }),
  ).toBeVisible();
  await expect(
    modelList.getByText("GPT-5.6 Luna", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Flagship model for complex reasoning and coding."),
  ).toBeVisible();
  await expect(page.getByText("Local", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Anthropic", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Google", { exact: true })).toHaveCount(0);
  await expect(modelList.getByRole("option").first()).toBeEnabled();

  if (process.env.CAPTURE_DESIGN_QA === "1") {
    await page.waitForTimeout(500);
    await page.screenshot({
      path: "design-qa/connected-provider-models.png",
      fullPage: false,
    });
    const modelTrigger = page.getByRole("button", { name: "GPT-5.6" });
    const [triggerBox, listBox] = await Promise.all([
      modelTrigger.boundingBox(),
      modelList.boundingBox(),
    ]);
    if (!triggerBox || !listBox) throw new Error("Model selector capture bounds missing.");
    const left = Math.min(triggerBox.x, listBox.x) - 8;
    const top = Math.min(triggerBox.y, listBox.y) - 8;
    const right = Math.max(triggerBox.x + triggerBox.width, listBox.x + listBox.width) + 8;
    const bottom = Math.max(triggerBox.y + triggerBox.height, listBox.y + listBox.height) + 8;
    await page.screenshot({
      path: "design-qa/connected-provider-model-selector.png",
      clip: { x: left, y: top, width: right - left, height: bottom - top },
    });
  }
  await page.keyboard.press("Escape");

  await openProviderSettings(page);
  const reopenedSettings = page.getByRole("dialog", { name: "Provider settings" });
  await reopenedSettings
    .getByRole("button", { name: "Remove OpenAI credential" })
    .click();
  const removeCredentialDialog = page.getByRole("alertdialog", {
    name: "Remove OpenAI credential?",
  });
  await removeCredentialDialog.getByRole("button", { name: "Remove" }).click();
  await expect(reopenedSettings.getByRole("status")).toHaveText(
    "OpenAI credential removed.",
  );
  await reopenedSettings
    .getByRole("button", { name: "Close provider settings" })
    .click();
  await expect(
    page.getByRole("button", { name: "Configure a provider account" }),
  ).toBeVisible();
  await expect(page.getByText("Provider ready", { exact: true })).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Connect a provider" }),
  ).toBeDisabled();

  await page.getByRole("button", { name: "Actions for E2E release" }).click();
  await page.getByRole("button", { name: "Rename" }).click();
  await page.getByRole("textbox", { name: "Rename E2E release" }).fill("Launch ops");
  const projectRename = page.waitForResponse(
    (response) =>
      response.request().method() === "PATCH" &&
      response.url().includes("/api/projects/"),
  );
  await page.keyboard.press("Enter");
  expect((await projectRename).ok()).toBe(true);
  await expect(
    page.getByRole("button", { name: "Actions for Launch ops" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "New task" }).click();
  await expect(page.getByRole("treeitem", { selected: true })).toContainText(
    "New conversation",
  );
  await page
    .getByRole("treeitem", { selected: true })
    .getByRole("button", { name: "Actions for New conversation" })
    .click();
  await page.getByRole("button", { name: "Rename" }).click();
  await page
    .getByRole("textbox", { name: "Rename New conversation" })
    .fill("Release plan");
  const chatRename = page.waitForResponse(
    (response) =>
      response.request().method() === "PATCH" &&
      response.url().includes("/api/chats/"),
  );
  await page.keyboard.press("Enter");
  expect((await chatRename).ok()).toBe(true);
  await expect(page.getByRole("treeitem", { selected: true })).toContainText(
    "Release plan",
  );

  const chatId = new URL(page.url()).pathname.split("/").at(-1)!;
  const unknownModelStatus = await page.evaluate(async (id) => {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chatId: id,
        model: "unknown:injected",
        messages: [
          {
            id: "unknown-model-test",
            role: "user",
            parts: [{ type: "text", text: "Do not persist this." }],
          },
        ],
      }),
    });
    return response.status;
  }, chatId);
  expect(unknownModelStatus).toBe(422);

  await page.reload();
  await expect(page.getByRole("textbox", { name: "Prompt" })).toBeDisabled();
  await expect(page.getByText("Demo · Balanced", { exact: true })).toHaveCount(0);

  const accessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  expect(
    accessibility.violations.filter(
      (violation) => violation.impact === "critical" || violation.impact === "serious",
    ),
  ).toEqual([]);

  const deletedChatUrl = page.url();
  await page
    .getByRole("treeitem", { selected: true })
    .getByRole("button", { name: "Actions for Release plan" })
    .click();
  await page.getByRole("button", { name: "Delete" }).click();
  const deleteDialog = page.getByRole("alertdialog", { name: "Delete chat?" });
  await expect(deleteDialog).toContainText(
    "“Release plan” and all of its messages will be permanently deleted.",
  );
  await deleteDialog.getByRole("button", { name: "Delete" }).click();
  await expect(page).not.toHaveURL(deletedChatUrl);
  await expect(page.getByText("Release plan", { exact: true })).toHaveCount(0);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Toggle sidebar" }).click();
  await expect(page.getByRole("dialog", { name: "Workspace navigation" })).toBeVisible();

  await openProviderSettings(page);
  const mobileProviderSettings = page.getByRole("dialog", {
    name: "Provider settings",
  });
  await expect(mobileProviderSettings).toBeVisible();
  const mobileDialogBox = await mobileProviderSettings.boundingBox();
  expect(mobileDialogBox).not.toBeNull();
  expect(mobileDialogBox!.x).toBeGreaterThanOrEqual(0);
  expect(mobileDialogBox!.width).toBeLessThanOrEqual(390);
  expect(mobileDialogBox!.height).toBeLessThanOrEqual(844);
  await mobileProviderSettings
    .getByRole("button", { name: "Close provider settings" })
    .click();

  const accountMenu = await openAccountMenu(page);
  const logOut = accountMenu.getByRole("button", { name: "Log out" });
  await logOut.focus();
  await logOut.press("Enter");
  await expect(page).toHaveURL(/\/sign-in$/);

  await page.goto("/");
  await expect(page).toHaveURL(/\/sign-in\?returnTo=%2F$/);
});
