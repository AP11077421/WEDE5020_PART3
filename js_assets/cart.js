/* FORMEZ - cart.js
   Shopping cart stored in the browser (localStorage). Handles:
   - "Add to Cart" on product pages
   - the cart count in the navigation
   - the cart page (change quantity, remove items, total)
   - the order summary on the checkout page
   All text is inserted with textContent (never innerHTML) so nothing typed
   or stored in the browser can inject HTML into the page. */
(function () {
    'use strict';

    var KEY = 'formez_cart';
    var MAX_QTY = 20;

    /* ---------- Storage helpers ---------- */

    function loadCart() {
        try {
            var data = JSON.parse(localStorage.getItem(KEY));
            if (!Array.isArray(data)) { return []; }
            // Keep only well-formed items so bad data can't break the page
            return data.filter(function (i) {
                return i && typeof i.name === 'string' && typeof i.size === 'string' &&
                    typeof i.colour === 'string' && isFinite(i.price) &&
                    parseInt(i.qty, 10) >= 1;
            }).map(function (i) {
                return {
                    name: i.name, size: i.size, colour: i.colour,
                    price: Number(i.price),
                    qty: Math.min(parseInt(i.qty, 10), MAX_QTY)
                };
            });
        } catch (e) {
            return [];
        }
    }

    function saveCart(cart) {
        try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) { /* storage blocked */ }
    }

    function clearCart() {
        try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
    }

    function money(n) { return 'R' + n.toFixed(2); }

    function cartTotal(cart) {
        return cart.reduce(function (sum, i) { return sum + i.price * i.qty; }, 0);
    }

    function cartCount(cart) {
        return cart.reduce(function (sum, i) { return sum + i.qty; }, 0);
    }

    function el(tag, text, className) {
        var node = document.createElement(tag);
        if (text !== undefined) { node.textContent = text; }
        if (className) { node.className = className; }
        return node;
    }

    function cell(text) { return el('td', text); }

    // Shared with forms.js
    window.FormezCart = {
        load: loadCart, clear: clearCart, total: cartTotal, money: money
    };

    /* ---------- Cart count in the navigation ---------- */

    function updateNavCount() {
        var count = cartCount(loadCart());
        var links = document.querySelectorAll('header nav a[href="cart.html"]');
        for (var i = 0; i < links.length; i++) {
            links[i].textContent = count > 0 ? 'Cart (' + count + ')' : 'Cart';
        }
    }

    /* ---------- Add to Cart (product pages) ---------- */

    function setupAddToCart() {
        var info = document.getElementById('product-info');
        var form = info && info.querySelector('form');
        if (!form) { return; }

        var message = el('p', '', 'form-message');
        message.setAttribute('role', 'status');
        form.appendChild(message);

        form.addEventListener('submit', function (event) {
            event.preventDefault();

            var name = info.querySelector('h2').textContent.trim();
            var price = parseFloat(document.getElementById('product-price')
                .textContent.replace(/[^0-9.]/g, '')) || 0;
            var size = form.querySelector('#size').value;
            var colour = form.querySelector('#colour').value;
            var qty = parseInt(form.querySelector('#quantity').value, 10);

            message.className = 'form-message';
            if (!isFinite(qty) || qty < 1 || qty > MAX_QTY) {
                message.className = 'form-message error-message';
                message.textContent = 'Please enter a quantity between 1 and ' + MAX_QTY + '.';
                return;
            }

            var cart = loadCart();
            var existing = cart.filter(function (i) {
                return i.name === name && i.size === size && i.colour === colour;
            })[0];

            if (existing) {
                existing.qty = Math.min(existing.qty + qty, MAX_QTY);
            } else {
                cart.push({ name: name, size: size, colour: colour, price: price, qty: qty });
            }
            saveCart(cart);
            updateNavCount();

            message.textContent = 'Added to your cart: ' + qty + ' x ' + name + ' (' + size + ', ' + colour + '). ';
            var link = el('a', 'View cart');
            link.href = 'cart.html';
            message.appendChild(link);
        });
    }

    /* ---------- Cart page ---------- */

    function setupCartPage() {
        var table = document.getElementById('cart-table');
        if (!table) { return; }
        var tbody = table.querySelector('tbody');
        var totalEl = document.getElementById('cart-total');
        var checkoutLink = document.querySelector('a[href="checkout.html"]');

        var notice = el('p', '', 'form-message error-message');
        notice.setAttribute('role', 'alert');
        notice.hidden = true;
        if (checkoutLink) { checkoutLink.parentNode.insertBefore(notice, checkoutLink); }

        function render() {
            var cart = loadCart();
            tbody.textContent = '';

            if (cart.length === 0) {
                var emptyRow = el('tr');
                var emptyCell = el('td', 'Your cart is currently empty.');
                emptyCell.colSpan = 7;
                emptyRow.appendChild(emptyCell);
                tbody.appendChild(emptyRow);
            }

            cart.forEach(function (item, index) {
                var row = el('tr');
                row.appendChild(cell(item.name));
                row.appendChild(cell(item.size));
                row.appendChild(cell(item.colour));

                var qtyCell = el('td');
                var qtyInput = el('input');
                qtyInput.type = 'number';
                qtyInput.min = '1';
                qtyInput.max = String(MAX_QTY);
                qtyInput.value = String(item.qty);
                qtyInput.className = 'cart-qty';
                qtyInput.setAttribute('aria-label', 'Quantity for ' + item.name);
                qtyInput.addEventListener('change', function () {
                    var q = parseInt(qtyInput.value, 10);
                    if (!isFinite(q) || q < 1) { q = 1; }
                    if (q > MAX_QTY) { q = MAX_QTY; }
                    var current = loadCart();
                    if (current[index]) { current[index].qty = q; }
                    saveCart(current);
                    render();
                });
                qtyCell.appendChild(qtyInput);
                row.appendChild(qtyCell);

                row.appendChild(cell(money(item.price)));
                row.appendChild(cell(money(item.price * item.qty)));

                var removeCell = el('td');
                var removeBtn = el('button', 'Remove', 'remove-btn');
                removeBtn.type = 'button';
                removeBtn.setAttribute('aria-label', 'Remove ' + item.name + ' from cart');
                removeBtn.addEventListener('click', function () {
                    var current = loadCart();
                    current.splice(index, 1);
                    saveCart(current);
                    render();
                });
                removeCell.appendChild(removeBtn);
                row.appendChild(removeCell);

                tbody.appendChild(row);
            });

            if (totalEl) { totalEl.textContent = money(cartTotal(cart)); }
            notice.hidden = true;
            updateNavCount();
        }

        // Don't let someone go to checkout with an empty cart
        if (checkoutLink) {
            checkoutLink.addEventListener('click', function (event) {
                if (loadCart().length === 0) {
                    event.preventDefault();
                    notice.textContent = 'Your cart is empty. Add a product before checking out.';
                    notice.hidden = false;
                }
            });
        }

        render();
    }

    /* ---------- Checkout order summary ---------- */

    function setupCheckoutSummary() {
        var table = document.getElementById('order-summary-table');
        if (!table) { return; }
        var tbody = table.querySelector('tbody');
        var totalEl = document.getElementById('order-total');
        var cart = loadCart();

        tbody.textContent = '';
        if (cart.length === 0) {
            var row = el('tr');
            var c = el('td', 'Your cart is empty. Visit the Products page to add items.');
            c.colSpan = 2;
            row.appendChild(c);
            tbody.appendChild(row);
        }
        cart.forEach(function (item) {
            var r = el('tr');
            r.appendChild(cell(item.name + ' (' + item.size + ', ' + item.colour + ') x ' + item.qty));
            r.appendChild(cell(money(item.price * item.qty)));
            tbody.appendChild(r);
        });
        if (totalEl) { totalEl.textContent = money(cartTotal(cart)); }
    }

    /* ---------- Start ---------- */

    updateNavCount();
    setupAddToCart();
    setupCartPage();
    setupCheckoutSummary();
})();
