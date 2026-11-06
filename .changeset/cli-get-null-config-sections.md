---
'@expo/cli': patch
---

Fix `expo start` skipping all manifest assets (icons, splash images) when a config section on an asset path, such as `splash`, is `null` or `undefined`.
