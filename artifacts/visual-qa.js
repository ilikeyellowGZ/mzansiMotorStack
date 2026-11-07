async page => {
  const widths = [320, 390, 768, 1024, 1366, 1440, 1920, 2560, 3440, 3840];
  const routes = [{name: "landing", path: "/"}, {name: "workspace", path: "/demo"}];
  const out = [];
  for (const route of routes) {
    for (const width of widths) {
      await page.setViewportSize({width, height: 900});
      await page.goto(`http://127.0.0.1:5176${route.path}`);
      const result = await page.evaluate(() => {
        const box = selector => {
          const element = document.querySelector(selector);
          if (!element) return null;
          const rect = element.getBoundingClientRect();
          return {x: Math.round(rect.x), width: Math.round(rect.width)};
        };
        return {
          viewport: innerWidth,
          scroll: document.documentElement.scrollWidth,
          header: box(".site-header, .workspace-header"),
          panel: box(".site-header-panel, .app-sidebar"),
          hero: box(".hero"),
          art: box(".hero-art"),
          content: box(".app-content"),
        };
      });
      out.push({route: route.name, ...result});
      if ([390, 1920, 3440].includes(width)) {
        await page.screenshot({path: `artifacts/previews/${route.name}-${width}-fluid.png`, fullPage: true});
      }
    }
  }
  return out;
}
