// THE BREAKER'S CATALOG. Each mutation is a realistic regression: a one-line edit
// that a hurried developer (or a coding agent) could plausibly ship.
// `bad` is what the breaker writes; `good` is the original. The fixer never sees this file's
// answer key unless it is the offline "heuristic" demo fixer (see loop/fixer/heuristic.js).
module.exports = [
  {
    id: 'place-order-dead', category: 'broken button',
    title: '"Place order" button stopped submitting the form',
    file: 'public/checkout.html',
    good: 'type="submit">Place order', bad: 'type="button">Place order',
    hints: /place order|button|click|nothing happen|still (shows|on)|checkout form|thank you|confirm/i,
  },
  {
    id: 'total-ignores-quantity', category: 'wrong total',
    title: 'Subtotal ignores item quantity',
    file: 'lib/pricing.js',
    good: 'subtotal += item.price * item.qty;', bad: 'subtotal += item.price;',
    hints: /subtotal|total|\$|quantity|price|amount/i,
  },
  {
    id: 'tax-on-shipping', category: 'wrong total',
    title: 'Tax is also charged on shipping',
    file: 'lib/pricing.js',
    good: 'const tax = Math.round(subtotal * TAX_RATE);', bad: 'const tax = Math.round((subtotal + shipping) * TAX_RATE);',
    hints: /tax|total|\$|amount/i,
  },
  {
    id: 'free-shipping-cents-typo', category: 'wrong total',
    title: 'Free-shipping threshold typo ($5 instead of $50)',
    file: 'lib/pricing.js',
    good: 'const FREE_SHIPPING_AT = 5000;', bad: 'const FREE_SHIPPING_AT = 500;',
    hints: /shipping|total|\$|amount/i,
  },
  {
    id: 'zip-rejects-leading-zero', category: 'validation regression',
    title: 'ZIP validation rejects codes starting with 0',
    file: 'lib/validate.js',
    good: 'const ZIP_RE = /^\\d{5}$/;', bad: 'const ZIP_RE = /^[1-9]\\d{4}$/;',
    hints: /zip|postal|valid|error|rejected|checkout form|thank you/i,
  },
  {
    id: 'email-accepts-anything', category: 'validation regression',
    title: 'Email validation accepts any string',
    file: 'lib/validate.js',
    good: 'const EMAIL_RE = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$/;', bad: 'const EMAIL_RE = /.*/;',
    hints: /email|valid|error|invalid|thank you|should not|must not/i,
  },
  {
    id: 'mobile-summary-overlay', category: 'mobile layout bug',
    title: 'On phones, the order summary is pinned over the Place order button',
    file: 'public/styles.css',
    good: '  .checkout { grid-template-columns: 1fr; }',
    bad: '  .checkout { grid-template-columns: 1fr; }\n  .order-summary { position: fixed; left: 0; right: 0; bottom: 0; height: 55vh; z-index: 10; }',
    hints: /cover|obscur|intercept|overlap|hidden|blocked|not clickable|cannot click|can't click|place order|scroll|mobile|phone|viewport/i,
  },
];
