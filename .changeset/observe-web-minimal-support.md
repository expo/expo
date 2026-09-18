---
'expo-observe': patch
---

[Web] `Observe.configure` now initializes the `expo-router` and `react-navigation` integrations, keeps the `integrations` config for `getIntegrations`, and emits the `configure` event, so `useObserve()` and integration libraries such as `expo-image` work on web. Metrics are still not recorded or dispatched on web.
