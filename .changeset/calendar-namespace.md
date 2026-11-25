---
'expo-calendar': minor
---

Rename the `ExpoCalendar`, `ExpoCalendarEvent`, `ExpoCalendarReminder` and `ExpoCalendarAttendee` classes to `Calendar`, `CalendarEvent`, `CalendarReminder` and `CalendarAttendee`. Add the static methods `Calendar.getAll`, `Calendar.create`, `Calendar.getDefaultSync`, `Calendar.presentPicker`, `Calendar.getPermissions`, `Calendar.requestPermissions`, `Calendar.getRemindersPermissions`, `Calendar.requestRemindersPermissions`, `Calendar.getSourcesSync` and `CalendarEvent.list`. Deprecate the old class names and the top-level `getCalendars`, `createCalendar`, `getDefaultCalendarSync`, `presentPicker`, `listEvents`, `getCalendarPermissions`, `requestCalendarPermissions`, `getRemindersPermissions`, `requestRemindersPermissions` and `getSourcesSync`.
