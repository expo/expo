---
"@expo/cli": patch
---

Replace the HMR client with a no-op shim in production native bundles, so `expo/src/async-require/hmr.ts` and its dependencies (`pretty-format`, `@expo/log-box-utils`, `@expo/metro/metro-runtime/modules/HMRClient`) are no longer bundled.
