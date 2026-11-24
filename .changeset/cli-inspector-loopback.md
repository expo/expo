---
'@expo/cli': patch
---

Fix the dev server exiting when `/_expo/debugger` is requested while `REACT_NATIVE_PACKAGER_HOSTNAME` or `EXPO_PACKAGER_PROXY_URL` points away from Metro.
