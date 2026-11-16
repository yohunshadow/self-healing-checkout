(function () {
  const KEY = 'hydra-cart';
  const $ = (s) => document.querySelector(s);
  const load = () => JSON.parse(localStorage.getItem(KEY) || '[]');
  const save = (c) => localStorage.setItem(KEY, JSON.stringify(c));
  const count = () => load().reduce((n, i) => n + i.qty, 0);
  const detailed = () => load().map((l) => ({ ...Pricing.CATALOG.find((p) => p.id === l.id), qty: l.qty }));
  const page = document.body.dataset.page;
  $('#cart-count').textContent = count();

  function addToCart(id) {
    const cart = load();
    const line = cart.find((l) => l.id === id);
    if (line) line.qty += 1; else cart.push({ id, qty: 1 });
    save(cart);
    $('#cart-count').textContent = count();
  }

  if (page === 'products') {
    $('#product-list').innerHTML = Pricing.CATALOG.map((p) => `
      <li class="product" data-testid="product-${p.id}">
        <h2>${p.name}</h2><p>${p.blurb}</p>
        <p class="price">${Pricing.money(p.price)}</p>
        <button class="btn add-to-cart" data-id="${p.id}" type="button">Add to cart: ${p.name}</button>
      </li>`).join('');
    document.querySelectorAll('.add-to-cart').forEach((b) =>
      b.addEventListener('click', () => addToCart(b.dataset.id)));
  }

  if (page === 'cart') {
    const items = detailed();
    if (!items.length) { $('#cart-empty').hidden = false; return; }
    $('#cart-body').hidden = false;
    $('#cart-lines').innerHTML = items.map((i) =>
      `<li class="line"><span>${i.name} × ${i.qty}</span><span>${Pricing.money(i.price * i.qty)}</span></li>`).join('');
    const t = Pricing.totals(items);
    $('#subtotal').textContent = Pricing.money(t.subtotal);
    $('#shipping').textContent = Pricing.money(t.shipping);
    $('#tax').textContent = Pricing.money(t.tax);
    $('#total').textContent = Pricing.money(t.total);
  }

  if (page === 'checkout') {
    const items = detailed();
    const t = Pricing.totals(items);
    $('#summary-lines').innerHTML = items.map((i) => `<li>${i.name} × ${i.qty}</li>`).join('');
    $('#summary-total').textContent = Pricing.money(t.total);
    const form = $('#checkout-form');
    const showErrors = (errors) => {
      document.querySelectorAll('[data-error-for]').forEach((el) => { el.textContent = errors[el.dataset.errorFor] || ''; });
      $('#form-error').textContent = errors.cart || '';
    };
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const customer = Object.fromEntries(new FormData(form).entries());
      const errors = Validate.checkOrder(customer);
      showErrors(errors);
      if (Object.keys(errors).length) return;
      const res = await fetch('/api/orders', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer, items: load() }),
      });
      const body = await res.json();
      if (!res.ok) return showErrors(body.errors || {});
      save([]);
      location.href = '/success?order=' + body.id;
    });
  }

  if (page === 'success') {
    const id = new URLSearchParams(location.search).get('order');
    fetch('/api/orders/' + id).then((r) => (r.ok ? r.json() : Promise.reject())).then((o) => {
      $('#success').hidden = false;
      $('#order-number').textContent = '#' + o.id;
      $('#order-total').textContent = Pricing.money(o.totals.total);
    }).catch(() => { $('#success-missing').hidden = false; });
  }
})();
