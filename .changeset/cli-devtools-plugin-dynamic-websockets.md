---
'@expo/cli': minor
---

Support dynamic WebSocket routes in DevTools plugins. The `serverEntryPoint` request handler now receives a `context` as the second argument. Return `context.upgrade(hooks)` to accept a WebSocket upgrade on any route under the plugin endpoint, or return a plain `Response` to reject it.
