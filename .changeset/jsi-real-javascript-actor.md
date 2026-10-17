---
'expo-modules-jsi': patch
'expo-modules-core': patch
---

[iOS] `JavaScriptActor` is now a real global actor: its executor runs every job on the JavaScript thread instead of on the thread that enqueues it. Asynchronous `@JavaScriptActor` work comes back to the JavaScript thread after every suspension point, also after a hop to the main actor and in a nested `Task { }`. Add `JavaScriptActor.bind(to:)`, which sets the runtime whose thread the actor uses; `AppContext` binds the main runtime. Only the bound runtime can run asynchronous `@JavaScriptActor` work; other runtimes, such as the worklet UI runtime, can still be used synchronously on their own thread.
