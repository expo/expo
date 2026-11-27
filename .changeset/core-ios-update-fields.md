---
'expo-modules-core': minor
---

[iOS] Add `updateFields(of:withDict:appContext:)`. It sets the `@Field` members of a value from a dictionary, with the same rules as `Record`, so a type that is only created from a dictionary does not need to adopt `Record`.
