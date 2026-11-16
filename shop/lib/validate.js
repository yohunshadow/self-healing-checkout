// Shared by the browser and the server (UMD).
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Validate = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const ZIP_RE = /^\d{5}$/;

  function checkOrder(f) {
    const errors = {};
    if (!f.name || !f.name.trim()) errors.name = 'Please enter your full name.';
    if (!EMAIL_RE.test(f.email || '')) errors.email = 'Please enter a valid email address.';
    if (!f.address || !f.address.trim()) errors.address = 'Please enter your street address.';
    if (!f.city || !f.city.trim()) errors.city = 'Please enter your city.';
    if (!ZIP_RE.test(f.zip || '')) errors.zip = 'Please enter a valid 5-digit ZIP code.';
    if (!/^\d{16}$/.test((f.card || '').replace(/\s+/g, ''))) errors.card = 'Please enter a 16-digit card number.';
    return errors;
  }

  return { checkOrder };
});
