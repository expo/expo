---
"expo": patch
---

Use [the `TextDecoder` implementation](https://github.com/facebook/hermes/pull/1855) provided by Hermes in React Native 0.88. In addition to UTF-8, this new implementation supports more character encodings including UTF-16 LE and BE, Latin-1, and Windows-1252. Custom JavaScript runtimes must provide `TextDecoder` before initializing Expo.
