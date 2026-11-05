---
'expo-calendar': patch
---

[Android] Add `getExtendedProperties()`, `setExtendedProperty()` and `deleteExtendedProperty()` to `ExpoCalendarEvent`, so an app can recognize the events it created. Android events have no `url` field to mark them with, and `CalendarContract.ExtendedProperties`, the mechanism meant for it, was not exposed.
