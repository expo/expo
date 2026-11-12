---
'expo-splash-screen': minor
---

Add an experimental `prerender` config plugin option that renders a template of the app's first screen through Fabric before React Native starts, so real UI replaces the splash image before the JavaScript bundle is evaluated.

With `prerender: { component, snapshot: true }`, the screen that replaces the splash is captured once it has settled (the committed view hierarchy with the frames UIKit resolved, plus the custom fonts it uses) and stored in the app container; the next launch prerenders that snapshot instead of the bundled template when the window size, text size, appearance and app build still match. `SplashScreen.saveLaunchScreenAsync()` recaptures on demand (after signing in or out), `SplashScreen.clearLaunchScreenAsync()` drops the snapshot.

`SplashScreen.Exclude` keeps its children out of the prerender (snapshot and build-time template) while keeping their box, blank or filled with `placeholderColor`, for greetings, balances and other content that must not show before the app runs.

Experimental, off by default (`ExpoSplashScreenPrerenderHydrate`): with a snapshot, the prerendered tree is also committed into the app's own surface with the tags React used last time, and React's first commits adopt matching views (`Create` becomes `Update`) instead of recreating them; leftovers are removed once the app hides the splash and React has settled.
