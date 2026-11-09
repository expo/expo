---
'@expo/ui': patch
---

[iOS] Keep room for the minimum length of a `Spacer` in a universal `Row` or `Column`, as `HStack` and `VStack` do. A `Row` with a `Spacer` and a `TextInput` no longer gets wider than its `FieldGroup` row.
