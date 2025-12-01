// --- CRITICAL FIX: Service Worker Module Loading Stability ---
// The most reliable way to load Workbox in a vanilla Service Worker file 
// is using importScripts and referencing the modules via the global 'workbox' object.
importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.1.0/workbox-sw.js');

if (workbox) {
    // Simplified log to avoid "undefined" version error if core isn't immediately attached
    console.log('Workbox is loaded!');

    // --- 1. Basic Configuration (using fully qualified name) ---
    workbox.core.setCacheNameDetails({
        prefix: 'brutalist-clicker',
        suffix: 'v1',
        precache: 'precache',
        runtime: 'runtime',
    });
    
    // --- 2. Pre-caching (App Shell + Dev Assets) ---
    // CRITICAL PATH FIX: Your Vite config has "base: '/brutalist-clicker/'".
    // Therefore, all dev assets are served under that path, not the root.
    // We must match the URL structure of your dev server exactly.
    workbox.precaching.precacheAndRoute([
        // Cache the main HTML file (served at the base path)
        { url: '/brutalist-clicker/index.html', revision: '1' }, 
        
        // VITE DEV FIXES: Cache the source files at their correct base-prefixed location
        { url: '/brutalist-clicker/src/main.jsx', revision: '1' }, 
        { url: '/brutalist-clicker/src/index.css', revision: '1' },
        
        // Ensure the Workbox library itself is cached
        { url: 'https://storage.googleapis.com/workbox-cdn/releases/7.1.0/workbox-sw.js', revision: '1' },
    ]);


    // === CRITICAL OFFLINE FIX: Navigation Routing ===
    // This route explicitly serves the precached index.html file for any page navigation.
    const navigationRoute = new workbox.routing.NavigationRoute(
      new workbox.strategies.StaleWhileRevalidate({
          cacheName: workbox.core.cacheNames.precache,
      }),
      {
          // Fallback must match the PRECACHED URL exactly.
          fallback: '/brutalist-clicker/index.html', 
      }
    );
    workbox.routing.registerRoute(navigationRoute);
    // ===============================================


    // --- 3. Runtime Caching Strategies ---

    // Strategy 1: Cache-First for static assets (e.g., icons, placeholder images)
    workbox.routing.registerRoute(
        ({ request }) => request.destination === 'image',
        new workbox.strategies.CacheFirst({
            cacheName: 'images',
            plugins: [
                new workbox.expiration.ExpirationPlugin({
                    maxEntries: 50,
                    maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
                }),
            ],
        })
    );

    // Strategy 2: Stale-While-Revalidate for CDNs (Fonts, Tailwind, GSAP)
    workbox.routing.registerRoute(
        ({ url }) => url.origin === 'https://fonts.googleapis.com' || 
                      url.origin === 'https://fonts.gstatic.com' ||
                      url.origin === 'https://cdn.tailwindcss.com' ||
                      url.origin.includes('cdnjs.cloudflare.com'), // Catches GSAP CDN
        new workbox.strategies.StaleWhileRevalidate({
            cacheName: 'cdn-assets',
            plugins: [
                new workbox.expiration.ExpirationPlugin({
                    maxEntries: 20,
                    maxAgeSeconds: 60 * 60 * 24 * 7, // 1 Week
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