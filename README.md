# Chaikela: Jind ka apna food delivery (v0.1)

Zero-commission food ordering. Customers order directly from restaurants; you earn only a handling fee (+ listing fee later).

## Structure
- `index.html` login (Customer / Merchant tabs; Admin link) · `register.html`
- `customer/` restaurants, menu, cart, orders · `merchant/` live orders, menu, offers, restaurant · `admin/` outlets, orders, users, settings
- `css/` tokens, base, components, pages · `js/core/` Api, Loader, Modal, Fields, Layout, Cart… · `js/pages/` one module per page
- `backend/` Apps Script (one file per concern) · `backend-single-file/` same code as ONE file (use either, never both)

## Setup
1. New Google Sheet > Extensions > Apps Script. Add the files from `backend/` (Config, Repository, Auth, Services, Api, Setup) OR paste the combined backend file if you maintain one.
2. Project Settings > Script properties: `ADMIN_PHONE` (10 digits), `ADMIN_PASSWORD` (8+ chars).
3. Run `setup()` once, authorize. This creates the admin account and seeds 12 illustrative Jind restaurant listings with sample menus and four offers. To seed them again later, run `seedJindRestaurants()`; matching sample rows are kept. Optional: run `seedDemo()` for a demo merchant (9999900001 / demo1234).
4. Deploy > New deployment > Web app > Execute as Me, Access Anyone. Copy the /exec URL into `js/config.js`.
5. Host this folder on HTTPS (Netlify Drop / GitHub Pages / Cloudflare Pages). After backend edits: Deploy > Manage deployments > Edit > New version.

## Password resets
Users can request a reset from the login page. Requests for active accounts appear in Admin > Password resets. Admins generate an 8-character uppercase alphanumeric temporary password and open a prefilled WhatsApp message; press Send in WhatsApp to deliver it. WhatsApp delivery is not automatic. Deploy the updated Apps Script backend and site together for this feature.

## PWA and order payments
The site can be installed from a supported browser and caches its app shell for offline loading. Sign-in, ordering, and live updates still need internet. Open orders refresh every 5 seconds while the page is visible.

Without a payment gateway, customers can pay cash or send UPI directly to the restaurant at handoff. UPI details must be shared by the restaurant outside the app. A merchant marks the order paid after checking the cash/UPI receipt; the app does not verify bank transfers. For automatic online payment and refunds, connect a payment provider and verify payment callbacks on the backend.

## IDs
Users U101 · Roles R101 Customer / R102 Merchant / R103 Admin · Outlets JIND-101 · Menu M101 · Offers F101 · Orders O101 · Payments P101

## Order flow
Order received → Confirmed → Preparing → Prepared → Picked by delivery → Out for delivery → Received.
Rapido skips "Out for delivery"; Takeaway skips both delivery steps. Payment stays PENDING until the merchant confirms collection, or becomes CANCELLED when the order is cancelled.
