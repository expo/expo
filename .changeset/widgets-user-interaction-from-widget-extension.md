---
'expo-widgets': patch
---

[iOS] Fix `addUserInteractionListener` not receiving events from home screen widget buttons. Widget intents run in the widget extension process, so the event is now delivered to the app through the app group and a Darwin notification.
