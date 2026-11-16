// Shared by the browser and the server (UMD). Money is integer cents.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Pricing = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const CATALOG = [
    { id: 'mug', name: 'Ceramic Mug', price: 1200, blurb: 'Hand-glazed, 350 ml.' },
    { id: 'tote', name: 'Canvas Tote', price: 1850, blurb: 'Heavy cotton, fits a laptop.' },
    { id: 'stickers', name: 'Sticker Pack', price: 400, blurb: 'Ten die-cut vinyl stickers.' },
  ];
  const SHIPPING_CENTS = 500;
  const FREE_SHIPPING_AT = 5000;
  const TAX_RATE = 0.1;

  function totals(items) {
    let subtotal = 0;
    for (const item of items) {
      subtotal += item.price * item.qty;
    }
    const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_AT ? 0 : SHIPPING_CENTS;
    const tax = Math.round(subtotal * TAX_RATE);
    return { subtotal, shipping, tax, total: subtotal + shipping + tax };
  }

  function money(cents) {
    return '$' + (cents / 100).toFixed(2);
  }

  return { CATALOG, totals, money };
});
