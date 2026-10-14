---
'expo-location': patch
---

[Android] Add the TypeScript interface for the location foreground service: `ensureBackgroundSessionStarted`, `stopBackgroundSession` and `getBackgroundSessionStatus`.

Add `getNotificationPermissions`, `requestNotificationPermissions` and the `useNotificationPermissions` hook for the service's notification.

Add `LocationUpdatesHandle.status()`, and the `canDeliverUpdates` and `areUpdatesAllowed` fields on `PositionWatchStatus`.
