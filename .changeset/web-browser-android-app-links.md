---
"expo-web-browser": patch
---

[Android] Fix `openAuthSessionAsync` and `openBrowserAsync` not opening the browser when App Links (`autoVerify`) are configured for the same domain, by pinning the Custom Tab to a browser package.
