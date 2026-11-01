---
'expo-web-browser': patch
---

[Android] Handle the `SecurityException` thrown when Android resolves a URL to an activity the app isn't allowed to start (for example, an app that registered a browser activity without exporting it). When the browser is opened directly, `openBrowserAsync()` now rejects with the `ERR_BROWSER_ACTIVITY_NOT_ALLOWED` code instead of an untyped error. When it's opened through the proxy activity (the default), the app no longer crashes.
