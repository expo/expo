---
'expo-status-bar': minor
---

Add `StatusBar.pushStackEntry()`, `StatusBar.replaceStackEntry()`, and `StatusBar.popStackEntry()` to change the status bar outside a component, for example while a system picker is open. An entry takes the same props as the `StatusBar` component and shares the same stack. On web, these methods do nothing.
