// --- CRITICAL FIX: Service Worker Module Loading Stability ---
importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.1.0/workbox-sw.js');

if (workbox) {
    console.log('Workbox is loaded!');

    workbox.core.setCacheNameDetails({
        prefix: 'brutalist-clicker',
        suffix: 'v1',
        precache: 'precache',
        runtime: 'runtime',
    });
    
    // --- 2. Pre-caching (Production Build) ---
    // In production, the src files don't exist (they are bundled). 
    // We only precache the entry HTML and the SW library.
    workbox.precaching.precacheAndRoute([
        { url: '/brutalist-clicker/index.html', revision: '1' }, 
        { url: 'https://storage.googleapis.com/workbox-cdn/releases/7.1.0/workbox-sw.js', revision: '1' },
    ]);

    // === Navigation Routing ===
    // Serve index.html for navigation (SPA support)
    const navigationRoute = new workbox.routing.NavigationRoute(
      new workbox.strategies.StaleWhileRevalidate({
          cacheName: workbox.core.cacheNames.precache,
      }),
      {
          fallback: '/brutalist-clicker/index.html', 
      }
    );
    workbox.routing.registerRoute(navigationRoute);

    // --- 3. Runtime Caching Strategies ---

    // NEW STRATEGY: Cache the Vite-bundled JS/CSS assets
    // Since production files have hashed names (assets/index-xyz.js), we cache them 
    // when the browser requests them (Runtime Caching) rather than precaching specific names.
    workbox.routing.registerRoute(
        ({ request }) => request.destination === 'script' || request.destination === 'style',
        new workbox.strategies.StaleWhileRevalidate({
            cacheName: 'app-static-assets',
            plugins: [
                new workbox.expiration.ExpirationPlugin({
                    maxEntries: 50,
                    maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
                }),
            ],
        })
    );

    // Strategy: Cache Images
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

    // Strategy: Cache CDNs (Fonts, Tailwind, GSAP)
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
    
    // --- 4. Activation and Install ---
    self.skipWaiting();
    workbox.core.clientsClaim();

} else {
    console.error('Workbox failed to load. PWA features disabled.');
}