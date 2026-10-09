---
'@expo/ui': patch
---

[Android] Add `showTitle` and `showHeadline` to the Jetpack Compose `DateTimePicker`, `DatePickerDialog`, `DateRangePicker`, and `DateRangePickerDialog` to hide Material 3's title and headline. The community `DateTimePicker` with `presentation="inline"` now hides both on Android, matching iOS. To keep the title and headline, use `DateTimePicker` from `@expo/ui/jetpack-compose` instead.
