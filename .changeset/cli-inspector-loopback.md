---
'@expo/cli': patch
---

Fix dev-server calling `/_expo/debugger` against the external `REACT_NATIVE_PACKAGER_HOSTNAME` or `EXPO_PACKAGER_PROXY_URL` host instead of its local socket
