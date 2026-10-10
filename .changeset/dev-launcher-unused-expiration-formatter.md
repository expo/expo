---
'expo-dev-launcher': patch
---

[iOS] Remove the unused date formatter in `getAppExpirationDate`, which built a string nothing read and triggered an `-Wunused-variable` warning.
