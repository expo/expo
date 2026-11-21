---
'expo-web-browser': patch
---

[Android] Fix `openBrowserAsync` showing the previous tab instead of the new URL after the app process was killed with a tab open. The proxy activity's task is now cleared before it starts.
