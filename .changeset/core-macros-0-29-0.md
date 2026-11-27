---
'expo-modules-core': patch
---

[iOS] Update `expo-modules-macros` to 0.29.0. The code that `@Record` and `@Union` generate is `nonisolated`, so it also compiles with `-default-isolation MainActor`, a `@Union` can be a `@Record` property, and a `@SharedObject` subclass binds the `@JS` members it inherits. A `@Record` type can no longer be created from a native dictionary: its `from(dictionary:appContext:)` throws `RecordDictionaryConversionException`.
