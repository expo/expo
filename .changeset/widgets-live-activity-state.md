---
'expo-widgets': minor
---

[iOS] Add `getState()`, `getProps()` and `addStateListener()` to `LiveActivity`, an `includeEnded` option to `getInstances()`, and `addLiveActivityStartListener()` for activities started by push-to-start. A push-to-start can now set `props` in its `attributes`, and the activity renders them merged with the content-state props, so an update or end only needs to send the props that change.
