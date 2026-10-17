---
'expo-modules-jsi': patch
---

[iOS] The `dealloc` closure of `JavaScriptRuntime.createHostObject` is now `@Sendable` instead of `@JavaScriptActor`, because the engine can call it on any thread. `JavaScriptActor.assumeIsolated` no longer checks the thread name in debug builds. The check failed on reload, because Hermes runs the runtime's teardown on its finalizer thread.
