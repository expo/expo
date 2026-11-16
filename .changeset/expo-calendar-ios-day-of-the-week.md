---
'expo-calendar': patch
---

[iOS] Fix `daysOfTheWeek` in recurrence rules being stored one weekday late. The native `DayOfTheWeek` mapping started at Monday while the JS enum, the docs and `EKWeekday` start at Sunday.
