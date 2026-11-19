---
'@expo/ui': patch
---

[Android] Fix time pickers ignoring the text input variant. The Jetpack Compose `DateTimePicker` with `displayedComponents="hourAndMinute"` and `variant="input"` now shows Material 3's `TimeInput` instead of the dial. `TimePickerDialog` now uses Material 3's `TimePickerDialog`, with its title and its button that toggles between the dial and the text input. It accepts `variant`, `showVariantToggle`, and `showTitle`. The title and the toggle show by default. Set `showTitle={false}` and `showVariantToggle={false}` to hide them. The community `DateTimePicker` with `mode="time"` and `display="spinner"` now shows the text input in the dialog and inline, as its documentation says.
