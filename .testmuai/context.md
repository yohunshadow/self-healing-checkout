# Context for Kane CLI runs against "Hydra Goods" (the Self-Healing Checkout demo shop)

- The app is a tiny web shop: product list (/), cart (/cart), checkout form (/checkout), confirmation (/success).
- Prices are USD. Shipping is a flat $5.00 under $50.00 subtotal; tax is 10% of the subtotal only.
- Cart state lives in localStorage, so start every flow from the shop home page.
- "Add to cart: <product>" buttons add one unit per click.
- Be strict: a flow only passes if EVERY stated expectation is visibly true on the page (exact dollar amounts, error text, confirmation text).
- If a button is covered by another element or cannot be clicked, that is a failure; do not work around it by scripting or by changing the URL.
- Do not retry a failed assertion with a different interpretation.
