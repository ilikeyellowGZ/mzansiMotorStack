async page => {
  await page.waitForTimeout(5000);
  await page.screenshot({path: "artifacts/previews/caeli-1366-settled.png"});
  return await page.evaluate(() => ({ready: document.readyState, scrollY, html: document.querySelector("header")?.outerHTML.slice(0, 700)}));
}
