---
'@expo/cli': patch
---

Resolve a `fingerprint` runtime version once per dev server session, instead of on every manifest request, and resolve it again only when the app config or one of the fingerprint's sources changes. Set `EXPO_NO_RUNTIME_VERSION_CACHE=1` to resolve it on every request.
