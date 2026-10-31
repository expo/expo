---
'@expo/ui': patch
---

Use the percentage layout in universal `Row`, `Column`, and `ScrollView`, and in a `Host` on iOS, only when a percentage `width` or `height` is set. Other layouts are the same as before percentages were added: on iOS, a `Row` with a flexible `Spacer` stays inside its `FieldGroup` row, and an unset `spacing` uses the platform spacing.
