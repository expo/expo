---
'expo-observe': patch
---

[Web] `Observe.configure` now initializes the `expo-router` and `react-navigation` integrations, keeps the `integrations` config for `getIntegrations` and `registerIntegration`, and emits the `configure` event, so `useObserve()` and third-party integrations work on web. Metrics are still not recorded or dispatched on web.
