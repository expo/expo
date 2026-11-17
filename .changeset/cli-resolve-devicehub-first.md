---
'@expo/cli': patch
---

[iOS] Fix `expo start --ios` and `expo run:ios` failing on Xcode 27 when `Simulator.app` is not installed. The CLI now looks for `DeviceHub.app` before `Simulator.app`.
