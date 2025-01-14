import { test, expect } from "@playwright/test";

test("should go to homepage", async ({ page }) => {
  await page.goto(
    "/infrastructure.near/widget/near-prpsls-bos.components.pages.app"
  );

  const dashboardHeader = await page.getByText("Home Page");
  await dashboardHeader.waitFor({ state: "visible" });
  expect(await dashboardHeader.isVisible()).toBeTruthy();
});
