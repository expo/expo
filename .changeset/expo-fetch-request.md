---
'expo': patch
---

Add a `Request` to `expo/fetch` that follows the Fetch standard more closely. It's exported as `Request` and installed as the global `Request` on native, replacing React Native's `whatwg-fetch` polyfill, so request bodies and `FormData` round-trip predictably. On web, `expo/fetch` exports the platform's `Request`.
