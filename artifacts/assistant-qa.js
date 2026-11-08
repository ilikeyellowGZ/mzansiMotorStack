import { chromium } from "playwright-core";

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:/Users/omoku/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe",
  });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const failures = [];
  const chatBodies = [];
  const enquiryIds = [];
  const assert = (value, message) => { if (!value) failures.push(message); };
  const base = process.env.ASSISTANT_QA_URL ?? "http://127.0.0.1:5176";
  await page.goto(base + "/pricing");
  const launcher = page.getByRole("button", { name: "Open MotorStack Assistant" });
  assert(await launcher.isVisible(), "desktop launcher missing");
  assert(await page.getByText("Need a hand getting started?").isVisible(), "greeting missing");
  await page.screenshot({ path: "artifacts/previews/assistant-closed.png" });
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
  assert(!(await page.getByText("Need a hand getting started?").isVisible()), "greeting reappeared in the same session");
  const closedCollision = await page.evaluate(() => {
    const a = document.querySelector(".assistant-launcher")?.getBoundingClientRect();
    const b = document.querySelector(".sidebar-help")?.getBoundingClientRect();
    if (!a || !b) return false;
    return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  });
  assert(!closedCollision, "closed launcher covers workspace help navigation");
  await page.getByRole("button", { name: "Open MotorStack Assistant" }).click();
  await page.getByRole("button", { name: "New conversation" }).click();
  await page.getByRole("button", { name: "Compare features" }).click();
  await page.waitForTimeout(1200);
  const offlineText = await dialog.innerText();
  assert(/offline|unavailable|not connected|could not|failed/i.test(offlineText), "offline state is not honest");
  await page.route("**/functions/v1/motorstack-assistant", async (route) => {
    const cors = { "Access-Control-Allow-Origin": base, "Access-Control-Allow-Headers": "authorization, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
    if (route.request().method() === "OPTIONS") return route.fulfill({ status: 200, headers: cors });
    const body = JSON.parse(route.request().postData() || "{}");
    if (body.action === "chat") {
      chatBodies.push(body);
      const asksSetupPrice = /setup cost/i.test(body.messages.at(-1)?.text || "");
      await route.fulfill({ status: 200, headers: cors, contentType: "application/json", body: JSON.stringify({
        text: "The plan details are on our pricing page.",
        sources: [{ title: "Plans and pricing", href: "/pricing" }],
        plan: { code: "essentials", name: "Essentials", monthly: 84900, annual: 916920, users: "Up to 3", ai: "Not included", website: "Optional quoted add-on", social: "Optional quoted add-on", support: "Standard support", reason: "Lowest-priced published plan that supports 3 staff.", href: "/pricing" },
        setupFees: asksSetupPrice ? [{ code: "essentials", name: "Essentials", onlineMinor: 149900 }] : null,
        handoff: false,
      }) });
    } else if (body.action === "enquiry") {
      enquiryIds.push(body.requestId);
      if (enquiryIds.length === 1) await route.fulfill({ status: 503, headers: cors, contentType: "application/json", body: JSON.stringify({ error: "Service temporarily unavailable" }) });
      else await route.fulfill({ status: 200, headers: cors, contentType: "application/json", body: JSON.stringify({ status: "received", requestId: body.requestId }) });
    } else await route.fulfill({ status: 400, headers: cors, body: "{}" });
  });
  await page.getByRole("button", { name: "New conversation" }).click();
  await page.getByRole("textbox", { name: "Ask MotorStack Assistant" }).fill("We have 3 staff");
  await page.getByRole("button", { name: "Send message" }).click();
  await page.getByRole("link", { name: "Plans and pricing" }).waitFor();
  assert(await page.getByText(/R\s*849,00/).isVisible(), "verified plan card not rendered");
  await page.getByRole("textbox", { name: "Ask MotorStack Assistant" }).fill("Is there a cheaper option?");
  await page.getByRole("button", { name: "Send message" }).click();
  await page.waitForTimeout(300);
  assert(chatBodies.length === 2 && chatBodies[1].messages.some((message) => message.text === "We have 3 staff"), "follow-up lost conversation context");
  await page.getByRole("textbox", { name: "Ask MotorStack Assistant" }).fill("What does assisted setup cost?");
  await page.getByRole("button", { name: "Send message" }).click();
  await page.getByText(/R\s*1\s*499,00/).waitFor();
  await page.getByRole("link", { name: "Plans and pricing" }).first().click();
  assert(await dialog.isVisible(), "route navigation closed the conversation");
  await page.getByRole("button", { name: "Talk to a person" }).click();
  await page.getByRole("textbox", { name: "Your name" }).fill("Test Dealer");
  await page.getByRole("textbox", { name: "Work email" }).fill("dealer@example.com");
  await page.getByRole("textbox", { name: "Dealership" }).fill("Example Motors");
  await page.getByRole("button", { name: "Review request" }).click();
  await page.getByRole("button", { name: "Send request" }).click();
  await page.getByText("Service temporarily unavailable").waitFor();
  await page.getByRole("button", { name: "Send request" }).click();
  await page.getByText("Request received. This is a request for follow-up; no appointment or live agent is confirmed.").waitFor();
  assert(enquiryIds.length === 2 && enquiryIds[0] === enquiryIds[1], "enquiry retry changed idempotency key");
  await page.setViewportSize({ width: 3440, height: 900 });
  await page.getByRole("button", { name: "Close chat" }).click();
  await page.getByRole("button", { name: "Open MotorStack Assistant" }).click();
  const wideBox = await dialog.boundingBox();
  assert(wideBox && wideBox.x >= 20 && wideBox.width <= 620, "ultrawide overlay resized page or left its anchor");
  for (const width of [375, 768, 1280, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(base + "/pricing");
    await page.getByRole("button", { name: "Open MotorStack Assistant" }).click();
    const box = await dialog.boundingBox();
    assert(box && box.x >= 0 && box.x + box.width <= width, `chat clips at ${width}px`);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `page overflows at ${width}px`);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base + "/");
  await page.getByRole("button", { name: "Open MotorStack Assistant" }).click();
  await page.getByRole("button", { name: "New conversation" }).click();
  const mobileBox = await dialog.boundingBox();
  assert(mobileBox && mobileBox.width === 390 && mobileBox.height === 844, "mobile panel is not viewport-sized");
  assert(await dialog.getAttribute("aria-modal") === "true", "mobile dialog lacks modal semantics");
  assert(await page.getByRole("textbox", { name: "Ask MotorStack Assistant" }).isVisible(), "mobile composer missing");
  await page.screenshot({ path: "artifacts/previews/assistant-mobile.png" });
  for (let i = 0; i < 8; i++) await page.keyboard.press("Tab");
  assert(await page.evaluate(() => document.querySelector(".assistant-panel")?.contains(document.activeElement)), "mobile tab focus escaped the dialog");
  await page.keyboard.press("Escape");
  assert(!(await dialog.isVisible()), "mobile Escape did not close");
  await browser.close();
  if (failures.length) { console.error(failures); process.exit(1); }
  console.log("Assistant browser checks passed: desktop, expanded, handoff review/retry, focus, persistence, offline, sources, follow-ups, mobile, ultrawide.");
})().catch((error) => { console.error(error); process.exit(1); });
