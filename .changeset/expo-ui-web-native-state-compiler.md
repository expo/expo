---
'@expo/ui': patch
---

[Web] Fix a universal `TextInput` that did not show a `set()` write to its `value` state when the React Compiler compiled the component that created the state. `useNativeState` on web now returns a new object each time its value changes.
