// ⚠ TEMPORARY STAND-IN VERIFIER ⚠
// Scripted Playwright checks that mirror flows/flows.json. This exists ONLY so the loop can be
// exercised without a Kane CLI login (and as a cheap pre-check). The real verifier is kane.js.
// Results are marked backend:"playwright-standin" everywhere (timeline, dashboard, README).
const { chromium } = require('playwright-core');

const T = { timeout: 4000 };

async function addToCart(page, name, times = 1) {
  for (let i = 0; i < times; i++) await page.getByRole('button', { name: `Add to cart: ${name}` }).click(T);
}
async function fill(page, v) {
  for (const [k, val] of Object.entries(v)) await page.locator(`input[name=${k}]`).fill(val, T);
}
const text = (page, sel) => page.locator(sel).innerText(T);

const CHECKS = {
  async 'happy-path'(page, base) {
    await page.goto(base + '/');
    await addToCart(page, 'Ceramic Mug', 2);
    await addToCart(page, 'Canvas Tote', 1);
    await page.goto(base + '/cart');
    const got = { subtotal: await text(page, '#subtotal'), shipping: await text(page, '#shipping'), tax: await text(page, '#tax'), total: await text(page, '#total') };
    const want = { subtotal: '$42.50', shipping: '$5.00', tax: '$4.25', total: '$51.75' };
    for (const k of Object.keys(want)) {
      if (got[k] !== want[k]) throw new Error(`Cart shows ${k} ${got[k]} but expected ${want[k]} (Order total shows ${got.total}, expected $51.75)`);
    }
    await page.getByRole('link', { name: 'Proceed to checkout' }).click(T);
    await fill(page, { name: 'Ada Lovelace', email: 'ada@example.com', address: '12 Analytical St', city: 'Cambridge', zip: '02139', card: '4242 4242 4242 4242' });
    await page.getByRole('button', { name: 'Place order' }).click(T);
    try { await page.getByText('Thank you for your order!').waitFor({ timeout: 2500 }); }
    catch {
      const errs = (await page.locator('.error').allInnerTexts()).filter(Boolean).join(' | ');
      throw new Error(`After clicking Place order the page still shows the Checkout form, no 'Thank you for your order!' confirmation.${errs ? ' Visible errors: ' + errs : ''}`);
    }
    const charged = await text(page, '#order-total');
    if (charged !== '$51.75') throw new Error(`Confirmation shows 'Amount charged: ${charged}' but expected $51.75`);
  },

  async validation(page, base) {
    await page.goto(base + '/');
    await addToCart(page, 'Sticker Pack');
    await page.goto(base + '/checkout');
    await fill(page, { name: 'Grace Hopper', email: 'not-an-email', address: '1 Navy Way', city: 'Arlington', zip: '22202', card: '4242 4242 4242 4242' });
    await page.getByRole('button', { name: 'Place order' }).click(T);
    await page.waitForTimeout(600);
    if (await page.getByText('Thank you for your order!').count()) throw new Error("Invalid email 'not-an-email' was accepted: the page shows 'Thank you for your order!' instead of an email error");
    const err = await text(page, '[data-error-for=email]');
    if (!/valid email/i.test(err)) throw new Error(`No 'Please enter a valid email address.' message next to Email (found '${err}')`);
  },

  async 'mobile-checkout'(page, base) {
    await page.goto(base + '/');
    await addToCart(page, 'Canvas Tote');
    await page.goto(base + '/checkout');
    await fill(page, { name: 'Alan Turing', email: 'alan@example.com', address: '3 Bletchley Rd', city: 'Milton Keynes', zip: '10001', card: '4242 4242 4242 4242' });
    const btn = page.getByRole('button', { name: 'Place order' });
    await btn.scrollIntoViewIfNeeded(T);
    try { await btn.click({ timeout: 3000 }); }
    catch (e) { throw new Error(`The 'Place order' button cannot be clicked on a 390px-wide phone screen: it is covered by another element (${String(e.message).split('\n').find((l) => /intercept/.test(l)) || 'click blocked'})`); }
    try { await page.getByText('Thank you for your order!').waitFor({ timeout: 2500 }); }
    catch { throw new Error("After clicking Place order on mobile, no 'Thank you for your order!' confirmation appeared"); }
    const charged = await text(page, '#order-total');
    if (charged !== '$25.35') throw new Error(`Confirmation shows 'Amount charged: ${charged}' but expected $25.35`);
  },
};

async function runFlow(flow, baseUrl) {
  const t0 = Date.now();
  const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || 'chrome', headless: true });
  try {
    const ctx = await browser.newContext({ viewport: flow.viewport });
    const page = await ctx.newPage();
    await CHECKS[flow.name](page, baseUrl);
    return { name: flow.name, title: flow.title, ok: true, summary: 'All checks passed', durationMs: Date.now() - t0 };
  } catch (e) {
    return { name: flow.name, title: flow.title, ok: false, summary: String(e.message).split('\n')[0], reason: 'Scripted check failed', durationMs: Date.now() - t0 };
  } finally { await browser.close(); }
}

module.exports = { id: 'playwright-standin', label: 'Playwright (TEMPORARY STAND-IN, not Kane)', runFlow, available: async () => true };
