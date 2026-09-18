---
'expo-observe': patch
---

[Web] `Observe.configure` now initializes the `expo-router` and `react-navigation` integrations, keeps the `integrations` config for `getIntegrations`, and emits the `configure` event, so `useObserve()` and integration libraries such as `expo-image` work on web. Stored log events are dispatched to EAS Observe from web, on `dispatchEvents()` and when the page is hidden, honoring `dispatchingEnabled`, `dispatchInDebug`, and `sampleRate`. Metrics are still not recorded on web.
