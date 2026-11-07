async page => {
  const out = [];
  for (const width of [390, 1366]) {
    await page.setViewportSize({width, height: 900});
    await page.goto("https://www.caeli-energie.com/");
    await page.waitForTimeout(5000);
    const header = () => page.evaluate(() => {
      const element = document.querySelector("header");
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {scrollY, y: Math.round(rect.y), height: Math.round(rect.height), transform: style.transform};
    });
    const top = await header();
    await page.screenshot({path: `artifacts/previews/caeli-${width}-settled.png`});
    await page.mouse.wheel(0, 850);
    await page.waitForTimeout(800);
    const scrolled = await header();
    await page.screenshot({path: `artifacts/previews/caeli-${width}-settled-scrolled.png`});
    out.push({width, top, scrolled});
  }
  return out;
}
