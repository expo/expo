---
'expo-router': patch
---

Stop decoding route params a second time in `useLocalSearchParams()` and `getRouteInfoFromState()`. Params are already decoded while the navigation state is built, so a value that must stay percent-encoded (for example `%2F` in an AWS SigV4 token) is no longer corrupted. Params that are passed in already encoded are now returned verbatim instead of being decoded.
