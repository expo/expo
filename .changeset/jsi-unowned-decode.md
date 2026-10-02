---
'expo-modules-jsi': patch
'expo-modules-core': patch
---

[iOS] Add `JavaScriptValue.withUnownedValue(in:_:)`, and give the owning `JavaScriptDecodable.decode` a default that borrows the value and decodes it through the `JavaScriptUnownedValue` overload, so a conformer can implement only that one. Arrays, dictionaries, dates, records and enums now decode unowned values without copying them first.
