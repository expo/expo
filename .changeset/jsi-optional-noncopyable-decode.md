---
"expo-modules-jsi": patch
---

[iOS] `Optional` conforms to `JavaScriptDecodable` also when its wrapped type is non-copyable, so an optional `JavaScriptObject` or `JavaScriptValue` decodes like any other optional, for example as an optional argument of a `@JS` function.
