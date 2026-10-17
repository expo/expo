---
'@expo/metro-runtime': patch
---

Keep the `expo.builtin` marker on the global `fetch` wrapper, so code can detect `expo/fetch` in Expo Router apps.
