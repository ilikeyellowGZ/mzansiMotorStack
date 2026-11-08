async page => {
  const base = "http://127.0.0.1:5176";
  const check = (condition, message) => { if (!condition) throw new Error(message); };
  const results = [];
  await page.setViewportSize({width: 390, height: 844});
  await page.goto(base + "/demo/stock");
  await page.getByRole("button", {name: /In preparation/}).click();
  check(await page.locator(".data-panel .data-table-row").count() === 1, "Stock filter did not narrow rows");
  await page.getByRole("textbox", {name: "Search this workspace view"}).fill("Toyota");
  check(await page.locator(".data-panel .data-table-row").count() === 0, "Stock search did not combine with filter");
  await page.getByRole("button", {name: /All stock/}).click();
  check(await page.locator(".data-panel .data-table-row").count() === 1, "Stock search did not show matching row");
  results.push("stock search and filter");

  await page.goto(base + "/demo/leads");
  await page.getByRole("button", {name: /Follow up/}).click();
  check(await page.locator(".data-panel .data-table-row").count() === 2, "Lead filter did not narrow rows");
  results.push("lead filter");

  await page.goto(base + "/demo/tasks");
  const toggle = page.getByRole("button", {name: /Complete Follow up with Liam Moyo/});
  await toggle.click();
  check(await page.locator(".task-check[aria-pressed='true']").count() > 0, "Task completion toggle did not update");
  results.push("preview task toggle");

  for (const size of [{width: 768, height: 1024}, {width: 1024, height: 768}, {width: 390, height: 844}]) {
    await page.setViewportSize(size);
    await page.goto(base + "/");
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Orientation layout overflows at ${size.width}x${size.height}`);
    results.push(`${size.width}x${size.height} orientation`);
  }
  await page.setViewportSize({width: 312, height: 675});
  await page.goto(base + "/");
  check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "125% equivalent layout width overflows");
  results.push("125% equivalent layout width");
  return results;
}
