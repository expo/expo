---
'expo-modules-core': patch
---

[iOS] Add an experimental path that decodes Fabric view props from their JavaScript values on the JavaScript thread (via a dedicated `ExpoViewJSIComponentDescriptor`), instead of lowering to `folly::dynamic` / `NSDictionary` and decoding on the main thread. Off for every existing view; a view class opts in by overriding `receivesDecodedProps`.
