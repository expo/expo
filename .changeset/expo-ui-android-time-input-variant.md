---
'@expo/ui': patch
---

[Android] Fix time pickers ignoring `variant="input"` and `display="spinner"`. `TimePickerDialog` now uses Material 3's `TimePickerDialog` with a title and a dial/input toggle, and accepts `variant`.
