---
'@expo/ui': patch
---

[Android] Fix the community `DateTimePicker` reading `value` as a UTC day while `minimumDate`/`maximumDate` use the device-local day. In non-UTC timezones the picker could select and return the wrong day — one before `minimumDate`. `value`'s local calendar day is now sent to Material3 as a UTC day, and the picked day is returned as a local date that keeps `value`'s time of day.
