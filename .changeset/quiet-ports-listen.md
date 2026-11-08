---
'@expo/cli': patch
---

Fix `expo start` reporting a port as free on Windows when another process already listens on 127.0.0.1 or ::1. Port availability checks now probe the loopback addresses in addition to the unspecified address.
