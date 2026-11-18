---
'expo': patch
---

Send `scene(_:willConnectTo:options:)`, before the window is created, and `sceneDidDisconnect(_:)` to app delegate subscribers that adopt `ExpoSceneDelegateSubscriberProtocol`.
