---
'@expo/ui': patch
---

[Android] Fix time pickers showing a 24-hour clock on devices set to a 12-hour clock. When `is24Hour` is not set, the Jetpack Compose `DateTimePicker` and `TimePickerDialog` and the community `DateTimePicker` now follow the device's 12-hour or 24-hour setting, as `@react-native-community/datetimepicker` does. Set `is24Hour` to `true` to keep the 24-hour clock.
