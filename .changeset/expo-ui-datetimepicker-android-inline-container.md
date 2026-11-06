---
'@expo/ui': patch
---

[Android] The community `DateTimePicker` with `presentation="inline"` no longer draws Material 3's container color, matching iOS. The view behind the picker now shows through. Previously, the inline picker always showed on a tinted surface. To keep that surface, use `DateTimePicker` from `@expo/ui/jetpack-compose` instead.
