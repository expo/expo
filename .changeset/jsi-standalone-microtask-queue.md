---
'expo-modules-jsi': patch
---

[iOS] Create the standalone Hermes runtime (`JavaScriptRuntime()`) with the microtask queue and GC config of React Native's bridgeless runtime, so promise jobs go to the native microtask queue instead of running synchronously through a `setImmediate` shim. Add `JavaScriptRuntime.drainMicrotasks()`: a host of a standalone runtime calls it after each task, like React Native does.
