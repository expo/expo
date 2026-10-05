---
'@expo/ui': patch
---

[Android][iOS] Fix a `FieldCastException` crash on Android when a universal component receives a string `width` or `height` such as `"100%"`. `UniversalStyle` `width` and `height` now accept only numbers. String values are dropped with a dev-mode `console.warn`. Use the `modifiers` prop with `fillMaxWidth()` / `fillMaxHeight()` for percentage sizing.
