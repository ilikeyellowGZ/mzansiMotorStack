async page => {
  const base = "http://127.0.0.1:5176";
  const check = (condition, message) => { if (!condition) throw new Error(message); };
  const results = [];

  for (const width of [320, 390, 768, 1024, 1366, 1440, 1920, 2560, 3440, 3840]) {
    await page.setViewportSize({width, height: 900});
    for (const route of ["/", "/pricing", "/demo", "/demo/stock", "/demo/leads", "/demo/components"]) {
      await page.goto(base + route);
      const metrics = await page.evaluate(() => ({viewport: innerWidth, document: document.documentElement.scrollWidth, main: document.querySelector("main")?.getBoundingClientRect().width}));
      check(metrics.document <= width, `${route} overflows at ${width}: ${metrics.document}`);
      check(metrics.main > 0, `${route} has no main at ${width}`);
      results.push(`${route}@${width}:ok`);
    }
  }

  await page.setViewportSize({width: 320, height: 800});
  await page.goto(base + "/");
  const heroButtons = await page.locator(".hero-actions .button").evaluateAll(elements => elements.map(element => { const rect = element.getBoundingClientRect(); return {left: rect.left, right: rect.right, width: rect.width}; }));
  check(heroButtons.length === 2 && heroButtons.every(button => button.left >= 0 && button.right <= 320), "Hero action is clipped at 320px");
  await page.getByRole("button", {name: "Open navigation"}).click();
  check(await page.locator("#public-mobile-nav").isVisible(), "Public mobile navigation did not open");
  await page.keyboard.press("Escape");
  check(!(await page.locator("#public-mobile-nav").isVisible()), "Public mobile navigation did not close on Escape");
  results.push("public mobile menu and actions:ok");

  await page.setViewportSize({width: 1366, height: 900});
  await page.goto(base + "/");
  await page.mouse.wheel(0, 800);
  await page.waitForTimeout(250);
  check(await page.locator(".site-header-hidden").count() === 1, "Public header did not hide on downward scroll");
  await page.mouse.wheel(0, -200);
  await page.waitForTimeout(250);
  check(await page.locator(".site-header-hidden").count() === 0, "Public header did not return on upward scroll");
  results.push("public scroll header:ok");

  await page.setViewportSize({width: 390, height: 850});
  await page.goto(base + "/demo");
  await page.getByRole("button", {name: "Open menu"}).click();
  check(await page.getByRole("navigation", {name: "Workspace navigation"}).isVisible(), "Workspace menu did not open");
  await page.keyboard.press("Escape");
  check(!(await page.getByRole("navigation", {name: "Workspace navigation"}).isVisible()), "Workspace menu did not close on Escape");
  results.push("workspace mobile menu:ok");

  await page.goto(base + "/demo/components");
  await page.getByRole("button", {name: "Open dialog"}).click();
  check(await page.getByRole("dialog", {name: "Confirm this action"}).isVisible(), "Gallery dialog did not open");
  await page.keyboard.press("Escape");
  check(!(await page.getByRole("dialog", {name: "Confirm this action"}).isVisible()), "Gallery dialog did not close");
  await page.getByRole("button", {name: "Open drawer"}).click();
  check(await page.getByRole("dialog", {name: "Record details"}).isVisible(), "Gallery drawer did not open");
  await page.keyboard.press("Escape");
  await page.getByRole("button", {name: "Next"}).click();
  check(await page.getByText("Page 2 of 2").isVisible(), "Gallery pagination did not advance");
  await page.getByRole("button", {name: "Show toast"}).click();
  check(await page.getByText("Preview changes saved").isVisible(), "Gallery toast did not appear");
  results.push("gallery overlays, pagination and toast:ok");

  await page.goto(base + "/pricing");
  await page.getByRole("button", {name: "Annual"}).click();
  check((await page.getByRole("button", {name: "Annual"}).getAttribute("aria-pressed")) === "true", "Pricing billing selection did not update");
  results.push("pricing billing selection:ok");

  return {checks: results.length, results: results.filter(item => !item.includes("@"))};
}
