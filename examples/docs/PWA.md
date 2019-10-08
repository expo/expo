# Progressive Web Apps

PWAs are somewhat of a downgrade from native apps, but an upgrade from websites. Because Expo enables you to create both, we can interpolate the best possible PWA functionality from the Unimodules and `app.json`.

`expo-cli` uses a Webpack plugin called `@expo/webpack-pwa-manifest-plugin` to convert your `app.json` into a **`manifest.json`** (the file that configures how your PWA works).

`@expo/webpack-pwa-manifest-plugin` will create the optimal experience for use on iOS, Windows, Desktop, and Android PWAs. It also optimizes use in Android TWAs (Trusted Web Apps), Facebook (Open Graph), and Twitter sharing with metatags.

If you define the iOS Bundle ID or Android Package (for your published native apps), then the native app installation banners can be presented with no added code.

All of the media queries used for creating splash screens on all iOS phones and tablets can be generated using the same splash screen you're already using in your native apps.

Offline support, asset caching, request routing, and background sync is done using the popular [Workbox][workbox] service worker library maintained by Google. It's used by everyone from Starbucks to Tinder (the only apps I use).

These things should get your [Lighthouse][lighthouse] PWA scores to 100 (given your app is performant and resizes properly).

[workbox]: https://developers.google.com/web/tools/workbox/
[lighthouse]: https://developers.google.com/web/tools/lighthouse/
