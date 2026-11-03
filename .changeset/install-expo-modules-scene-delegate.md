---
'install-expo-modules': patch
---

Convert the React Native 0.88 template, which starts React Native from `SceneDelegate.swift`, to the SDK 58 layout with `ExpoAppSceneDelegate`. Refuse to overwrite a customized `SceneDelegate.swift`.
