---
"expo-modules-core": patch
"@expo/ui": patch
"expo-widgets": patch
---

Fix widget changes that cross-fade instead of animating when the app reloads the timeline. SwiftUI children and the widget root now use String ids, which WidgetKit matches across a reload, so `contentTransition` and `animation` modifiers run.
