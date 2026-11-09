---
'expo-modules-core': patch
---

[iOS] Update `expo-modules-macros` to 0.34.0. A synchronous `@JS` function or a `@JS init` can take the JavaScript runtime as its last parameter, `in runtime: borrowing JavaScriptRuntime`. The macros also fix how `@ViewProps` resets a removed prop and generate `nonisolated` `@ViewProps` members.
