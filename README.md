# FORMEZ

A responsive multi-page website for FORMEZ, a South African clothing brand.
Built for the WEDE5020 POE (IIE). This README describes the site, how to run it,
and what changed in each part.

## Pages

| Page | File |
|------|------|
| Home | `index.html` |
| About Us | `about.html` |
| Products | `services.html` |
| Product pages | `product_classic_oval-tee.html`, `product_wordmark-tee.html`, `product_sunset_oval-tee.html`, `product_oval_cap.html`, `product_oval_beanie.html` |
| Enquiries | `inquiries.html` |
| Contact | `contact.html` |
| Cart | `cart.html` |
| Checkout | `checkout.html` |

## Folder structure

```
formez/
  *.html          all pages
  css_assets/     style.css (mobile-first, tablet at 600px, desktop at 1024px)
  js_assets/      cart.js, forms.js, main.js
  _images/        product and site images
  README.md
```

## Running the site

No build step is needed. Open `index.html` in a browser, or serve the folder
with any static host (Netlify, GitHub Pages, etc.).

## JavaScript features (Part 3)

**`js_assets/cart.js`**
- "Add to Cart" on every product page (size, colour, quantity); identical items merge into one line.
- Cart count shown in the navigation, e.g. "Cart (3)".
- Cart page: change quantities, remove items, live total. Checkout is blocked when the cart is empty.
- Checkout page: order summary built from the cart.
- The cart is kept in the browser's localStorage. Stored data is checked before use and all text is inserted with `textContent`, so nothing can inject HTML.

**`js_assets/forms.js`**
- Validation on Checkout, Contact and Enquiries: required fields, name format, email format, South African phone numbers (`0XX XXX XXXX` or `+27 XX XXX XXXX`), minimum address and message length.
- Errors appear under each field, are announced to screen readers (`role="alert"`, `aria-invalid`), and the first invalid field receives focus.
- **Checkout:** sends the order with AJAX (`fetch`), then shows a confirmation with an order reference and empties the cart.
- **Enquiries:** sends with AJAX, then replies on the page with the price, sizes and colours of any product mentioned in the message (or the overall price range).
- **Contact:** validates, then builds an email to `info@formez.co.za` that opens in the visitor's email app, with a "click here" fallback link.
- `FORM_ENDPOINT` at the top of `forms.js` is empty, so submissions are simulated. After deployment, set it to a real form-handling URL (for example Formspree or Netlify Forms).

**`js_assets/main.js`**
- Mobile "Menu" button that collapses the navigation on phones.
- Footer copyright year.

## Changelog

### Part 3
- Added `cart.js`, `forms.js` and `main.js` and linked them on the relevant pages.
- Replaced the inline `document.write` footer year script with `main.js`.
- Added a "Remove" column and total ids to the cart page, and a total id to the checkout page.
- Appended form-error, status-message, cart and mobile-menu styles to `style.css`.
- Removed a stray closing `</div>` from the hero section in `index.html`.

### Part 2 feedback corrections
<!-- Add one line per correction, for example:
- Fixed: <what the feedback said> -> <what was changed and in which file> -->
- (to be completed)

## Known limitations
- The cart and orders exist only in the visitor's browser; there is no server or real payment.
- Maximum quantity per cart item is 20.
