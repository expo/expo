---
'expo-calendar': patch
---

[iOS] Expose `name`, `role`, `status`, `type`, `url` and `isCurrentUser` on the attendee objects that `ExpoCalendarEvent.getAttendees()` returns. The class was registered without properties, so every field read as `undefined`.
