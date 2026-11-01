---
'expo-localization': patch
---

[Android] Fix `useCalendars()` not re-rendering when the 12/24-hour clock or time zone setting changes. These settings don't change the `Configuration`, so the module now also listens to the `ACTION_TIME_CHANGED` and `ACTION_TIMEZONE_CHANGED` system broadcasts.
