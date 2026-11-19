---
'expo-router': patch
---

Throw an error for an external URL in `redirectTo` of `Protected`. Use a route of the app in `redirectTo`, and open external URLs from your app code, for example with `Linking.openURL`.
