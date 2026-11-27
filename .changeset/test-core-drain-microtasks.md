---
'expo-modules-test-core': patch
---

[iOS] Drain the microtask queue after each task on the JavaScript thread of `TestAppContext`, like React Native does. Promise callbacks now run after the synchronous code, and long `await` loops no longer overflow the native stack.
