---
'expo-modules-core': minor
---

On iOS, dispatch the events of Expo Modules v2 views. Calling an event prop of a `@ViewProps` struct sends the event to its handler in JavaScript, with the closure's parameter as the payload. Update `expo-modules-macros` to 0.37.0, which binds the event props, and reports event props that core can't bind or whose events never reach JavaScript, such as an event named like a bubbling React Native event (`onPress`, `onChange`).
