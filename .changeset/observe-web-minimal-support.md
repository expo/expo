---
'expo-observe': patch
---

[Web] Add opt-in web support behind `Observe.configure({ web: true })`. When enabled, `configure` initializes the `expo-router` and `react-navigation` integrations, keeps the `integrations` config for `getIntegrations`, and emits the `configure` event, so `useObserve()` and integration libraries such as `expo-image` work on web. Stored log events are dispatched to EAS Observe on `dispatchEvents()` and when the page is hidden, honoring `dispatchingEnabled`, `dispatchInDebug`, and `sampleRate`. Metrics are still not recorded on web.
