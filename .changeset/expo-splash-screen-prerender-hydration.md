---
'expo-splash-screen': minor
---

Add experimental hydration of the prerendered first screen on iOS, off by default. With `ExpoSplashScreenPrerenderHydrate` in Info.plist, the snapshot is also committed into the app's own surface with the tags React used in the last launch. React's first commits then update the matching views and do not create new ones.
