// Tiny zero-dependency shop server: static pages + POST /api/orders.
const http = require('http');
const fs = require('fs');
const path = require('path');
const Pricing = require('./lib/pricing');
const Validate = require('./lib/validate');

const PUBLIC = path.join(__dirname, 'public');
const LIB = path.join(__dirname, 'lib');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' };
const PAGES = { '/': 'index.html', '/cart': 'cart.html', '/checkout': 'checkout.html', '/success': 'success.html' };
const orders = new Map();
let nextOrder = 1001;

function send(res, code, body, type) {
  res.writeHead(code, { 'Content-Type': type || 'application/json', 'Cache-Control': 'no-store' });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

function serveFile(res, file) {
  fs.readFile(file, (err, data) => {
    if (err) return send(res, 404, 'Not found', 'text/plain');
    send(res, 200, data, TYPES[path.extname(file)] || 'application/octet-stream');
  });
}

function createServer() {
  return http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    if (req.method === 'POST' && url.pathname === '/api/orders') {
      let raw = '';
      req.on('data', (c) => (raw += c));
      req.on('end', () => {
        let body;
        try { body = JSON.parse(raw); } catch { return send(res, 400, { error: 'bad json' }); }
        const errors = Validate.checkOrder(body.customer || {});
        if (Object.keys(errors).length) return send(res, 422, { errors });
        const items = (body.items || []).map((i) => {
          const p = Pricing.CATALOG.find((c) => c.id === i.id);
          return p && i.qty > 0 ? { ...p, qty: i.qty } : null;
        }).filter(Boolean);
        if (!items.length) return send(res, 422, { errors: { cart: 'Your cart is empty.' } });
        const id = String(nextOrder++);
        const order = { id, items, totals: Pricing.totals(items) };
        orders.set(id, order);
        send(res, 201, order);
      });
      return;
    }
    if (url.pathname.startsWith('/api/orders/')) {
      const o = orders.get(url.pathname.split('/').pop());
      return o ? send(res, 200, o) : send(res, 404, { error: 'no such order' });
    }
    if (url.pathname.startsWith('/lib/')) return serveFile(res, path.join(LIB, path.basename(url.pathname)));
    if (PAGES[url.pathname]) return serveFile(res, path.join(PUBLIC, PAGES[url.pathname]));
    if (url.pathname === '/styles.css' || url.pathname === '/app.js') return serveFile(res, path.join(PUBLIC, url.pathname));
    send(res, 404, 'Not found', 'text/plain');
  });
}

if (require.main === module) {
  const port = Number(process.env.PORT || 3000);
  createServer().listen(port, () => console.log(`Shop running at http://localhost:${port}`));
}
module.exports = { createServer };
