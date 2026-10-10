---
"expo-widgets": minor
---

[iOS] Add `addActivityTokenListener` to observe every Live Activity of the app, including ones the system starts from a push-to-start notification while the app is not running. The event carries the activity's `url` and each `pushToken` it is issued, so an app can register the token with its push provider and address updates to the right activity.
