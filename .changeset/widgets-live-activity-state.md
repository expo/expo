---
'expo-widgets': minor
---

[iOS] Add `LiveActivity.getProps()`, `LiveActivity.addStateListener()` and `addLiveActivityStartListener()`. A push-to-start can set `props` in `attributes` as a JSON string, like `content-state.props`. The activity renders them under the content-state props, so later pushes only need the keys that differ from the start.
