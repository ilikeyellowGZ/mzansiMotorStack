import { chromium } from "playwright-core";

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:/Users/omoku/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe",
  });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const failures = [];
  const assert = (value, message) => { if (!value) failures.push(message); };
  const base = "http://127.0.0.1:5176";
  await page.goto(base + "/pricing");
  const launcher = page.getByRole("button", { name: "Open MotorStack Assistant" });
  assert(await launcher.isVisible(), "desktop launcher missing");
  assert(await page.getByText("Need a hand getting started?").isVisible(), "greeting missing");
  await launcher.click();
  const dialog = page.getByRole("dialog", { name: "MotorStack Assistant" });
  await dialog.waitFor({ state: "visible" });
  assert(await dialog.isVisible(), "chat did not open");
  const compact = await dialog.boundingBox();
  assert(compact && Math.abs(compact.width - 416) < 3 && Math.abs(compact.height - 530) < 3, "desktop panel geometry incorrect");
  assert(await page.getByRole("button", { name: "Help me choose a plan" }).isVisible(), "entry actions missing");
  assert(await page.getByRole("button", { name: "Talk to a person" }).isVisible(), "human handoff missing");
  await page.screenshot({ path: "artifacts/previews/assistant-desktop.png" });
  await page.getByRole("button", { name: "Expand chat" }).click();
  const expanded = await dialog.boundingBox();
  assert(expanded && expanded.width > compact.width && expanded.height > compact.height, "expand did not enlarge chat");
  await page.screenshot({ path: "artifacts/previews/assistant-expanded.png" });
  await page.getByRole("button", { name: "Shrink chat" }).click();
  await page.getByRole("textbox", { name: "Ask MotorStack Assistant" }).fill("I want to talk to a person");
  await page.getByRole("button", { name: "Send message" }).click();
  assert(await page.getByText("We need contact details").isVisible(), "typed human request did not open handoff");
  await page.getByRole("textbox", { name: "Your name" }).fill("Test Dealer");
  await page.getByRole("textbox", { name: "Work email" }).fill("dealer@example.com");
  await page.getByRole("textbox", { name: "Dealership" }).fill("Example Motors");
  await page.getByRole("button", { name: "Review request" }).click();
  assert(await page.getByText("dealer@example.com").isVisible(), "enquiry review missing confirmed email");
  await page.getByRole("button", { name: "Edit" }).click();
  assert(await page.getByRole("textbox", { name: "Work email" }).isVisible(), "enquiry edit unavailable");
  await page.keyboard.press("Escape");
  assert(!(await dialog.isVisible()), "Escape did not close dialog");
  assert(await launcher.evaluate((el) => document.activeElement === el), "focus did not return to launcher");
  await launcher.click();
  assert(await page.getByRole("textbox", { name: "Your name" }).inputValue() === "Test Dealer", "minimize lost enquiry draft");
  await page.goto(base + "/demo/stock");
  await page.getByRole("button", { name: "Open MotorStack Assistant" }).click();
  await page.getByRole("button", { name: "New conversation" }).click();
  await page.getByRole("button", { name: "Compare features" }).click();
  await page.waitForTimeout(1200);
  const offlineText = await dialog.innerText();
  console.log("Offline state:", offlineText.slice(-250));
  assert(/offline|unavailable|not connected|could not|failed/i.test(offlineText), "offline state is not honest");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base + "/");
  await page.getByRole("button", { name: "Open MotorStack Assistant" }).click();
  const mobileBox = await dialog.boundingBox();
  assert(mobileBox && mobileBox.width === 390 && mobileBox.height === 844, "mobile panel is not viewport-sized");
  assert(await dialog.getAttribute("aria-modal") === "true", "mobile dialog lacks modal semantics");
  assert(await page.getByRole("textbox", { name: "Ask MotorStack Assistant" }).isVisible(), "mobile composer missing");
  await page.screenshot({ path: "artifacts/previews/assistant-mobile.png" });
  await page.keyboard.press("Escape");
  assert(!(await dialog.isVisible()), "mobile Escape did not close");
  await browser.close();
  if (failures.length) { console.error(failures); process.exit(1); }
  console.log("Assistant browser checks passed: desktop, expanded, handoff review, focus, persistence, offline, mobile.");
})().catch((error) => { console.error(error); process.exit(1); });
