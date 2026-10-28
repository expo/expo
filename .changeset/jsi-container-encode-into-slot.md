---
'expo-modules-jsi': patch
---

[iOS] Add `encode(_:into:in:)` to `Array` and `Dictionary`, which move the array or the object they create into the slot, and set dictionary entries with `setProperty(_:encoding:in:)`. This reduces the overhead of encoding nested arrays and dictionaries, and arrays and dictionaries in record properties.
