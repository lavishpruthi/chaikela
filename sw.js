const V = "chaikela-v6";
const SHELL = [
  "./",
  "./index.html",
  "./register.html",
  "./forgot.html",
  "./offline.html",
  "./manifest.json",
  "./icon.svg",
  "./brand.svg",
  "./chai-banner.svg",
  "./customer/index.html",
  "./customer/restaurant.html",
  "./customer/cart.html",
  "./customer/orders.html",
  "./merchant/index.html",
  "./merchant/menu.html",
  "./merchant/offers.html",
  "./merchant/outlet.html",
  "./admin/index.html",
  "./css/tokens.css",
  "./css/base.css",
  "./css/components.css",
  "./css/pages.css",
  "./js/config.js",
  "./js/core/api.js",
  "./js/core/cart.js",
  "./js/core/dom.js",
  "./js/core/fields.js",
  "./js/core/icons.js",
  "./js/core/layout.js",
  "./js/core/loader.js",
  "./js/core/modal.js",
  "./js/core/orders.js",
  "./js/core/session.js",
  "./js/core/toast.js",
  "./js/pages/login.js",
  "./js/pages/register.js",
  "./js/pages/forgot.js",
  "./js/pages/admin.js",
  "./js/pages/customer-cart.js",
  "./js/pages/customer-home.js",
  "./js/pages/customer-orders.js",
  "./js/pages/customer-restaurant.js",
  "./js/pages/merchant-menu.js",
  "./js/pages/merchant-offers.js",
  "./js/pages/merchant-orders.js",
  "./js/pages/merchant-outlet.js",
];
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(V).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== V).map((key) => caches.delete(key)),
        ),
      ),
  );
  self.clients.claim();
});
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok)
            caches
              .open(V)
              .then((cache) => cache.put(request, response.clone()));
          return response;
        })
        .catch(
          async () =>
            (await caches.match(request, { ignoreSearch: true })) ||
            (await caches.match("./offline.html")),
        ),
    );
    return;
  }
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok)
          caches.open(V).then((cache) => cache.put(request, response.clone()));
        return response;
      })
      .catch(async () => (await caches.match(request)) || Response.error()),
  );
});
