---
'@expo/cli': patch
---

Fixed `npx expo run:ios` and `npx expo run:android` crashing with `ERR_IMPORT_ATTRIBUTE_MISSING` when `buildCacheProvider` is set to `eas`.
