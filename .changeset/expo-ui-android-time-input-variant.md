---
'@expo/ui': patch
---

[Android] Fix time pickers ignoring the text input variant. The Jetpack Compose `DateTimePicker` with `displayedComponents="hourAndMinute"` and `variant="input"` now shows Material 3's `TimeInput` instead of the dial. `TimePickerDialog` accepts `variant`. The community `DateTimePicker` with `mode="time"` and `display="spinner"` now shows the text input in the dialog and inline, as its documentation says.
