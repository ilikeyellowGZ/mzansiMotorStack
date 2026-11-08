import { chromium } from "playwright-core";

const browser = await chromium.launch({ headless: true, executablePath: "C:/Users/omoku/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe" });
try {
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  await page.goto("https://www.hubspot.com/products/artificial-intelligence/ai-customer-service-agent", { waitUntil: "domcontentloaded", timeout: 25000 });
  await page.waitForTimeout(7000);
  const state = await page.evaluate(() => ({
    title: document.title,
    iframeCount: document.querySelectorAll("iframe").length,
    assistantButtons: [...document.querySelectorAll("button,[role=button]")]
      .map((element) => ({ text: element.getAttribute("aria-label") || element.textContent?.trim().slice(0, 80), rect: element.getBoundingClientRect().toJSON() }))
      .filter((item) => /chat|hubbot|message|assistant/i.test(item.text || "")).slice(0, 12),
  }));
  console.log(JSON.stringify(state));
  console.log(JSON.stringify(page.frames().map((frame) => ({ name: frame.name(), url: frame.url().slice(0, 180) }))));
  const chatFrame = page.frame({ name: "hubspot-conversations-iframe" });
  if (chatFrame) {
    console.log(JSON.stringify({
      frameText: (await chatFrame.locator("body").innerText().catch(() => "")).slice(0, 800),
      frameButtons: await chatFrame.locator("button,[role=button]").evaluateAll((elements) => elements.map((el) => ({ label: el.getAttribute("aria-label"), text: el.textContent?.trim().slice(0, 70) })).slice(0, 25)).catch(() => []),
      frameBox: await (await chatFrame.frameElement()).boundingBox(),
    }));
    await chatFrame.getByRole("button", { name: "Open live chat" }).last().click();
    await page.waitForTimeout(1800);
    console.log(JSON.stringify({
      openedText: (await chatFrame.locator("body").innerText().catch(() => "")).slice(0, 1100),
      openedButtons: await chatFrame.locator("button,[role=button]").evaluateAll((elements) => elements.map((el) => ({ label: el.getAttribute("aria-label"), text: el.textContent?.trim().slice(0, 70) })).slice(0, 30)).catch(() => []),
      openedBox: await (await chatFrame.frameElement()).boundingBox(),
    }));
  }
  await page.screenshot({ path: "artifacts/previews/hubspot-reference-open.png" });
} finally { await browser.close(); }
