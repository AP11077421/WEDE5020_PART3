/* FORMEZ - forms.js
   Validation and submission for the Checkout, Contact and Enquiries forms.
   - Checkout: validates, sends the order with AJAX (fetch), shows a confirmation
   - Contact: validates, then builds an email to FORMEZ that opens in the user's email app
   - Enquiries: validates, sends with AJAX, then shows a cost / availability response
   Error messages are shown under each field and read out by screen readers. */
(function () {
    'use strict';

    /* Set this to a real form-handling URL (for example a Formspree or Netlify
       endpoint) once the site is deployed. While it is empty, submissions are
       simulated so the page still works when opened from your computer. */
    var FORM_ENDPOINT = '';
    var CONTACT_EMAIL = 'info@formez.co.za';

    /* ---------- AJAX submit ---------- */

    function sendAjax(payload) {
        if (!FORM_ENDPOINT) {
            return new Promise(function (resolve) {
                setTimeout(function () { resolve({ ok: true }); }, 700);
            });
        }
        return fetch(FORM_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(payload)
        }).then(function (response) {
            if (!response.ok) { throw new Error('Request failed (' + response.status + ')'); }
            return response.json().catch(function () { return {}; });
        });
    }

    /* ---------- Validation rules ---------- */

    var rules = {
        name: function (v) {
            if (!v) { return 'Please enter your full name.'; }
            if (!/^[A-Za-z\u00C0-\u024F][A-Za-z\u00C0-\u024F' .-]+$/.test(v)) {
                return 'Names can only contain letters, spaces, apostrophes and hyphens.';
            }
            return '';
        },
        email: function (v) {
            if (!v) { return 'Please enter your email address.'; }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) {
                return 'Please enter a valid email address, e.g. name@example.com.';
            }
            return '';
        },
        phone: function (v) {
            if (!v) { return 'Please enter your phone number.'; }
            var digits = v.replace(/[\s()-]/g, '');
            if (!/^(\+27|0)\d{9}$/.test(digits)) {
                return 'Enter a valid South African number, e.g. 082 555 0123 or +27 82 555 0123.';
            }
            return '';
        },
        address: function (v) {
            if (!v) { return 'Please enter your delivery address.'; }
            if (v.length < 10) { return 'Please enter your full delivery address (street, suburb, city, postal code).'; }
            return '';
        },
        subject: function (v) {
            if (!v) { return 'Please enter a subject.'; }
            if (v.length < 3) { return 'The subject is too short.'; }
            return '';
        },
        message: function (v) {
            if (!v) { return 'Please enter a message.'; }
            if (v.length < 10) { return 'Please write at least 10 characters so we can help you.'; }
            if (v.length > 1000) { return 'Please keep your message under 1000 characters.'; }
            return '';
        },
        required: function (v) { return v ? '' : 'Please choose an option.'; }
    };

    function showError(field, text) {
        var errId = field.id + '-error';
        var err = document.getElementById(errId);
        if (!err) {
            err = document.createElement('span');
            err.id = errId;
            err.className = 'error';
            err.setAttribute('role', 'alert');
            field.parentNode.appendChild(err);
        }
        err.textContent = text;
        if (text) {
            field.classList.add('invalid');
            field.setAttribute('aria-invalid', 'true');
            field.setAttribute('aria-describedby', errId);
        } else {
            field.classList.remove('invalid');
            field.removeAttribute('aria-invalid');
            field.removeAttribute('aria-describedby');
        }
    }

    /* map: { fieldId: ruleName }. Returns true if every field is valid. */
    function validate(form, map) {
        var firstBad = null;
        Object.keys(map).forEach(function (id) {
            var field = form.querySelector('#' + id);
            var problem = rules[map[id]](field.value.trim());
            showError(field, problem);
            if (problem && !firstBad) { firstBad = field; }
        });
        if (firstBad) { firstBad.focus(); }
        return !firstBad;
    }

    function liveClear(form, map) {
        Object.keys(map).forEach(function (id) {
            var field = form.querySelector('#' + id);
            // Check a field again when the user leaves it, clear errors while typing
            field.addEventListener('blur', function () {
                if (field.value.trim() !== '' || field.classList.contains('invalid')) {
                    showError(field, rules[map[id]](field.value.trim()));
                }
            });
            field.addEventListener('input', function () {
                if (field.classList.contains('invalid')) {
                    showError(field, rules[map[id]](field.value.trim()));
                }
            });
        });
    }

    function statusBox(form) {
        var box = document.createElement('p');
        box.className = 'form-message';
        box.setAttribute('role', 'status');
        box.hidden = true;
        form.appendChild(box);
        return box;
    }

    function setBusy(button, busy, label) {
        button.disabled = busy;
        button.textContent = busy ? 'Sending...' : label;
    }

    function el(tag, text, className) {
        var n = document.createElement(tag);
        if (text !== undefined) { n.textContent = text; }
        if (className) { n.className = className; }
        return n;
    }

    /* ---------- Checkout ---------- */

    function setupCheckout() {
        var section = document.getElementById('checkout-form-section');
        var form = section && section.querySelector('form');
        if (!form) { return; }
        form.noValidate = true;

        var map = {
            'full-name': 'name', 'email': 'email', 'phone': 'phone',
            'address': 'address', 'payment-method': 'required'
        };
        liveClear(form, map);
        var box = statusBox(form);
        var button = form.querySelector('button[type="submit"]');

        form.addEventListener('submit', function (event) {
            event.preventDefault();
            box.hidden = true;
            box.className = 'form-message';

            var cart = window.FormezCart.load();
            if (cart.length === 0) {
                box.className = 'form-message error-message';
                box.textContent = 'Your cart is empty. Add a product before placing an order.';
                box.hidden = false;
                return;
            }
            if (!validate(form, map)) { return; }

            var total = window.FormezCart.total(cart);
            var order = {
                reference: 'FMZ-' + Date.now().toString(36).toUpperCase(),
                customer: {
                    name: form.querySelector('#full-name').value.trim(),
                    email: form.querySelector('#email').value.trim(),
                    phone: form.querySelector('#phone').value.trim(),
                    address: form.querySelector('#address').value.trim()
                },
                paymentMethod: form.querySelector('#payment-method').value,
                items: cart,
                total: total
            };

            setBusy(button, true, 'Place Order');
            sendAjax(order).then(function () {
                window.FormezCart.clear();
                section.textContent = '';
                var done = el('div', undefined, 'form-message success-message');
                done.setAttribute('role', 'status');
                done.appendChild(el('h3', 'Thank you, ' + order.customer.name.split(' ')[0] + '!'));
                done.appendChild(el('p', 'Your order has been placed. Order reference: ' + order.reference));
                done.appendChild(el('p', 'Order total: ' + window.FormezCart.money(total) +
                    ' (' + order.paymentMethod.toUpperCase() + '). A confirmation will be sent to ' +
                    order.customer.email + '.'));
                var back = el('a', 'Continue Shopping', 'cta-button');
                back.href = 'services.html';
                done.appendChild(back);
                section.appendChild(done);

                // Empty the summary and the nav count as well
                var summary = document.getElementById('order-summary-table');
                if (summary) {
                    var body = summary.querySelector('tbody');
                    body.textContent = '';
                    var r = el('tr'); var c = el('td', 'Order placed.'); c.colSpan = 2;
                    r.appendChild(c); body.appendChild(r);
                }
                var totalEl = document.getElementById('order-total');
                if (totalEl) { totalEl.textContent = 'R0.00'; }
                var navLinks = document.querySelectorAll('header nav a[href="cart.html"]');
                for (var i = 0; i < navLinks.length; i++) { navLinks[i].textContent = 'Cart'; }
                done.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }).catch(function () {
                setBusy(button, false, 'Place Order');
                box.className = 'form-message error-message';
                box.textContent = 'Sorry, we could not place your order. Please check your connection and try again.';
                box.hidden = false;
            });
        });
    }

    /* ---------- Contact (builds an email) ---------- */

    function setupContact() {
        var section = document.getElementById('contact-form');
        var form = section && section.querySelector('form');
        if (!form) { return; }
        form.noValidate = true;

        var map = { name: 'name', email: 'email', subject: 'subject', message: 'message' };
        liveClear(form, map);
        var box = statusBox(form);

        form.addEventListener('submit', function (event) {
            event.preventDefault();
            if (!validate(form, map)) { box.hidden = true; return; }

            var name = form.querySelector('#name').value.trim();
            var email = form.querySelector('#email').value.trim();
            var subject = form.querySelector('#subject').value.trim();
            var message = form.querySelector('#message').value.trim();

            var body = 'Hi FORMEZ team,\n\n' + message + '\n\nKind regards,\n' + name + '\n' + email;
            var href = 'mailto:' + CONTACT_EMAIL +
                '?subject=' + encodeURIComponent(subject) +
                '&body=' + encodeURIComponent(body);

            box.className = 'form-message success-message';
            box.textContent = 'Your email is ready. If your email app did not open, ';
            var link = el('a', 'click here to send it');
            link.href = href;
            box.appendChild(link);
            box.appendChild(document.createTextNode('.'));
            box.hidden = false;

            window.location.href = href;
        });
    }

    /* ---------- Enquiries (AJAX + cost / availability reply) ---------- */

    var CATALOGUE = [
        { name: 'Classic Oval Logo Tee', price: 350, sizes: 'Small to XX-Large', colours: 'White, Black',
          match: /classic|oval logo tee|oval tee/i, page: 'product_classic_oval-tee.html' },
        { name: 'Wordmark Tee', price: 300, sizes: 'Small to XX-Large', colours: 'White, Black',
          match: /wordmark/i, page: 'product_wordmark-tee.html' },
        { name: 'Sunset Oval Tee', price: 350, sizes: 'Small to XX-Large', colours: 'White',
          match: /sunset/i, page: 'product_sunset_oval-tee.html' },
        { name: 'Oval Logo 5-Panel Cap', price: 150, sizes: 'One Size', colours: 'Black, White',
          match: /\bcaps?\b|5-panel|five panel/i, page: 'product_oval_cap.html' },
        { name: 'Oval Logo Beanie', price: 100, sizes: 'One Size', colours: 'Black, White',
          match: /beanie/i, page: 'product_oval_beanie.html' }
    ];

    function buildEnquiryReply(type, text, name, email) {
        var panel = el('div', undefined, 'form-message success-message');
        panel.setAttribute('role', 'status');
        panel.appendChild(el('h3', 'Thank you, ' + name.split(' ')[0] + '!'));
        panel.appendChild(el('p', 'We have received your enquiry and will follow up at ' + email + '.'));

        if (type === 'product') {
            var hits = CATALOGUE.filter(function (p) { return p.match.test(text); });
            if (hits.length > 0) {
                panel.appendChild(el('p', 'Here is what we can tell you about the product(s) you mentioned:'));
                var list = el('ul', undefined, 'enquiry-list');
                hits.forEach(function (p) {
                    var li = el('li');
                    li.appendChild(el('strong', p.name));
                    li.appendChild(document.createTextNode(
                        ' - R' + p.price.toFixed(2) + '. Sizes: ' + p.sizes +
                        '. Colours: ' + p.colours + '. Available to order online now. '));
                    var a = el('a', 'View product');
                    a.href = p.page;
                    li.appendChild(a);
                    list.appendChild(li);
                });
                panel.appendChild(list);
            } else {
                var prices = CATALOGUE.map(function (p) { return p.price; });
                panel.appendChild(el('p', 'Our range is priced from R' + Math.min.apply(null, prices).toFixed(2) +
                    ' to R' + Math.max.apply(null, prices).toFixed(2) +
                    '. All listed products are available to order online.'));
                var all = el('a', 'Browse all products');
                all.href = 'services.html';
                panel.appendChild(all);
            }
        } else if (type === 'order') {
            panel.appendChild(el('p', 'For order enquiries, please keep your order reference handy. A team member will check your order and reply by email.'));
        } else {
            panel.appendChild(el('p', 'A member of the FORMEZ team will review your message and reply by email.'));
        }
        return panel;
    }

    function setupEnquiry() {
        var section = document.getElementById('enquiry-form');
        var form = section && section.querySelector('form');
        if (!form) { return; }
        form.noValidate = true;

        var map = { 'full-name': 'name', 'email': 'email', 'phone': 'phone',
                    'enquiry-type': 'required', 'message': 'message' };
        liveClear(form, map);
        var box = statusBox(form);
        var button = form.querySelector('button[type="submit"]');
        var reply = null;

        form.addEventListener('submit', function (event) {
            event.preventDefault();
            box.hidden = true;
            if (!validate(form, map)) { return; }

            var data = {
                name: form.querySelector('#full-name').value.trim(),
                email: form.querySelector('#email').value.trim(),
                phone: form.querySelector('#phone').value.trim(),
                type: form.querySelector('#enquiry-type').value,
                message: form.querySelector('#message').value.trim()
            };

            setBusy(button, true, 'Submit Enquiry');
            sendAjax(data).then(function () {
                setBusy(button, false, 'Submit Enquiry');
                if (reply) { reply.remove(); }
                reply = buildEnquiryReply(data.type, data.message, data.name, data.email);
                section.appendChild(reply);
                form.reset();
                reply.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }).catch(function () {
                setBusy(button, false, 'Submit Enquiry');
                box.className = 'form-message error-message';
                box.textContent = 'Sorry, we could not send your enquiry. Please check your connection and try again.';
                box.hidden = false;
            });
        });
    }

    setupCheckout();
    setupContact();
    setupEnquiry();
})();
