---
'expo-secure-store': patch
---

Report an actionable error on Android when an item with `requireAuthentication` is used and the host Activity does not extend `FragmentActivity`, which the biometric prompt needs. The old message said the app was not in the foreground.
