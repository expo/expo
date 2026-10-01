---
'expo-router': major
---

Add `safeAreaEdges` to `Stack.Screen` and `NativeTabs.Trigger`; native route content now applies horizontal safe area padding by default. Set `safeAreaEdges={{ horizontal: false }}` to opt out. Automatic safe area padding is not supported for iOS `formSheet` screens.
