---
'expo': minor
---

Add a `Request` to `expo/fetch` that follows the Fetch standard more closely. It's exported as `Request` and installed as the global `Request` on native, replacing React Native's `whatwg-fetch` polyfill, so request bodies and `FormData` round-trip predictably. On web, `expo/fetch` exports the platform's `Request`.

The global `Request` on native behaves differently from the `whatwg-fetch` one:

- A `GET` or `HEAD` request with `cache: 'no-store'` or `cache: 'no-cache'` doesn't get a `_=<timestamp>` query parameter. `expo/fetch` ignores the `cache` option.
- Attributes such as `url` and `method` are read-only. In strict mode code, an assignment to one throws a `TypeError`.
- The constructor validates the init like the Fetch standard. For example, it throws a `TypeError` for a `mode` or `credentials` value that the standard doesn't define, and for the `CONNECT`, `TRACE` and `TRACK` methods.
- A request created from another request with new `headers` doesn't get a default `Content-Type` for the body that it copies.
- `new Request(request, { signal: null })` doesn't use the signal of `request`.

To keep React Native's `fetch` and `Request`, set `EXPO_PUBLIC_USE_RN_FETCH=1`.
