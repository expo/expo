---
"expo-router": major
---

Preserve live navigation state when route files and layouts change during Fast Refresh.

Custom routers must implement `getStateForRouteConfigChange(state, config)` or inherit it from `BaseRouter`; `ROUTE_NAMES_CHANGED` has been removed. Navigation state `routeNames` now follow canonical route-tree order; use navigator declarations for display order.
