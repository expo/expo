---
'expo-web-browser': patch
---

[Android] Clear a leftover browser task before launching the Custom Tab proxy activity. When the app process died while a Custom Tab opened through `openBrowserAsync`/`openAuthSessionAsync` was still open, the browser's activity kept the proxy's task alive, and the next call only brought that old task - with its stale page - back to the front instead of opening the requested URL.
