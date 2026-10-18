---
'expo-widgets': patch
---

[iOS] Add an optional `contentDate` argument to `LiveActivity.update()`. On iOS 17.2 and later, the system ignores an update whose `contentDate` is older than a previous local update or push payload, so a delayed local update no longer replaces newer push content. Earlier iOS versions ignore the argument.
