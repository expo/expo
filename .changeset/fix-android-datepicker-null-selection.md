---
'@expo/ui': patch
---

Preserve null selections in the Jetpack Compose `DateTimePicker` instead of reporting January 1, 1970. The `onDateSelected` callback now accepts `Date | null`. Handle `null` before using `Date` methods when date input is incomplete or invalid.
