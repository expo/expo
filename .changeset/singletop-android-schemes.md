---
'@expo/config-plugins': patch
---

Read the URI schemes of an Android activity with `android:launchMode="singleTop"`, as well as `singleTask`. Before, `AndroidConfig.Scheme.getSchemesFromManifest` returned no schemes for a `singleTop` main activity. Because of this, `npx expo run:android` and `npx expo start --dev-client` opened the app without a URL.
