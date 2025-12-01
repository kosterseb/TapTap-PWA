importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.1.0/workbox-sw.js');

if (workbox) {
    console.log('Workbox is loaded!');

    workbox.core.setCacheNameDetails({
        prefix: 'taptap-pwa', // Updated prefix
        suffix: 'v1',
        precache: 'precache',
        runtime: 'runtime',
    });
    
    // --- Pre-caching ---
    workbox.precaching.precacheAndRoute([
        // CRITICAL FIX: Updated paths to '/TapTap-PWA/'
        { url: '/TapTap-PWA/index.html', revision: '1' }, 
        { url: 'https://storage.googleapis.com/workbox-cdn/releases/7.1.0/workbox-sw.js', revision: '1' },
    ]);

    // === Navigation Routing ===
    const navigationRoute = new workbox.routing.NavigationRoute(
      new workbox.strategies.StaleWhileRevalidate({
          cacheName: workbox.core.cacheNames.precache,
      }),
      {
          // CRITICAL FIX: Updated fallback path
          fallback: '/TapTap-PWA/index.html', 
      }
    );
    workbox.routing.registerRoute(navigationRoute);

    // --- Runtime Caching (Bundled Assets) ---
    workbox.routing.registerRoute(
        ({ request }) => request.destination === 'script' || request.destination === 'style',
        new workbox.strategies.StaleWhileRevalidate({
            cacheName: 'app-static-assets',
            plugins: [
                new workbox.expiration.ExpirationPlugin({
                    maxEntries: 50,
                    maxAgeSeconds: 30 * 24 * 60 * 60, 
                }),
            ],
        })
    );

    // ... (Images and CDN strategies remain the same) ...
    workbox.routing.registerRoute(
        ({ request }) => request.destination === 'image',
        new workbox.strategies.CacheFirst({
            cacheName: 'images',
            plugins: [
                new workbox.expiration.ExpirationPlugin({
                    maxEntries: 50,
                    maxAgeSeconds: 30 * 24 * 60 * 60,
                }),
            ],
        })
    );

    workbox.routing.registerRoute(
        ({ url }) => url.origin === 'https://fonts.googleapis.com' || 
                      url.origin === 'https://fonts.gstatic.com' ||
                      url.origin === 'https://cdn.tailwindcss.com' ||
                      url.origin.includes('cdnjs.cloudflare.com'), 
        new workbox.strategies.StaleWhileRevalidate({
            cacheName: 'cdn-assets',
            plugins: [
                new workbox.expiration.ExpirationPlugin({
                    maxEntries: 20,
                    maxAgeSeconds: 60 * 60 * 24 * 7,
                }),
            ],
        })
    );
    
    self.skipWaiting();
    workbox.core.clientsClaim();

} else {
    console.error('Workbox failed to load.');
}