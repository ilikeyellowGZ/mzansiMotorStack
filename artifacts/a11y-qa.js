async page => {
  const base = "http://127.0.0.1:5176";
  const check = (condition, message) => { if (!condition) throw new Error(message); };
  await page.setViewportSize({width: 390, height: 844});
  await page.goto(base + "/");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  const focus = await page.evaluate(() => ({name: document.activeElement?.getAttribute("aria-label"), outline: getComputedStyle(document.activeElement).outlineWidth}));
  check(focus.name === "Open navigation" && focus.outline === "3px", "Mobile menu keyboard focus ring is missing");
  const fields = await page.locator(".contact-form input, .contact-form textarea").evaluateAll(elements => elements.map(element => ({labels: element.labels?.length, required: element.required})));
  check(fields.length === 4 && fields.every(field => field.labels > 0 && field.required), "Contact form labels or required state missing");
  await page.locator(".contact-form button[type=submit]").click();
  check(await page.locator(".contact-form :invalid").count() >= 4, "Contact form did not expose invalid fields");
  check(await page.locator(".contact-form .inline-notice").count() === 0, "Invalid form submitted");
  await page.getByRole("textbox", {name: "Your name"}).fill("Test User");
  await page.getByRole("textbox", {name: "Work email"}).fill("test@example.com");
  await page.getByRole("textbox", {name: "Dealership"}).fill("Test Motors");
  await page.getByRole("textbox", {name: "What would you like help with?"}).fill("Preview validation");
  await page.locator(".contact-form button[type=submit]").click();
  check(await page.locator(".contact-form .inline-notice[role=status]").isVisible(), "Valid preview form feedback missing");
  await page.emulateMedia({reducedMotion: "reduce"});
  const duration = await page.locator(".hero-actions .button").first().evaluate(element => getComputedStyle(element).transitionDuration);
  check(duration.split(",").every(value => parseFloat(value) < 0.01), `Reduced motion transition remains: ${duration}`);
  const contrast = await page.evaluate(() => {
    const rgba = value => {
      const text = value.trim();
      return text.startsWith("#") ? [1, 3, 5].map(index => parseInt(text.slice(index, index + 2), 16)) : text.match(/[\d.]+/g).slice(0, 3).map(Number);
    };
    const luminance = values => values.map(value => {const channel = value / 255; return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;}).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
    const ratio = (a, b) => {const values = [luminance(rgba(a)), luminance(rgba(b))].sort((x, y) => y - x); return (values[0] + 0.05) / (values[1] + 0.05);};
    const styles = getComputedStyle(document.documentElement);
    return {primary: ratio(styles.getPropertyValue("--ink"), styles.getPropertyValue("--paper")), muted: ratio(styles.getPropertyValue("--ink-soft"), styles.getPropertyValue("--paper")), action: ratio(styles.getPropertyValue("--ink"), styles.getPropertyValue("--lime"))};
  });
  check(Object.values(contrast).every(value => value >= 4.5), `Core color contrast falls below 4.5: ${JSON.stringify(contrast)}`);
  return {focus, labelledFields: fields.length, invalidFields: 4, validFeedback: true, reducedMotionDuration: duration, contrast};
}
