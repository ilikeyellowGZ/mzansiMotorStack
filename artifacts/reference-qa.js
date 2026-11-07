async page => {
  const result = [];
  for (const width of [390, 768, 1366, 1920]) {
    await page.setViewportSize({width, height: 900});
    await page.reload();
    const data = await page.evaluate(() => {
      const sample = element => {
        if (!element) return null;
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return {
          tag: element.tagName,
          className: String(element.className).slice(0, 120),
          text: element.textContent?.trim().slice(0, 90),
          x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height),
          font: style.fontFamily, size: style.fontSize, weight: style.fontWeight,
          lineHeight: style.lineHeight, tracking: style.letterSpacing,
          background: style.backgroundColor, color: style.color,
          border: style.border, radius: style.borderRadius,
        };
      };
      const navs = [...document.querySelectorAll("nav,header")].filter(e => e.getBoundingClientRect().width > 0).slice(0, 5);
      return {viewport: innerWidth, scrollWidth: document.documentElement.scrollWidth, h1: sample(document.querySelector("h1")), h2: sample(document.querySelector("h2")), navs: navs.map(sample), fonts: [...document.fonts].filter(f => f.status === "loaded").map(f => `${f.family} ${f.weight}`).slice(0, 8)};
    });
    result.push(data);
    if ([390, 1366].includes(width)) {
      await page.screenshot({path: `artifacts/previews/caeli-${width}-top.png`});
      await page.evaluate(() => scrollTo(0, 850));
      await page.screenshot({path: `artifacts/previews/caeli-${width}-scrolled.png`});
    }
  }
  return result;
}
