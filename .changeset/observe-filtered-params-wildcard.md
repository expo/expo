---
'expo-observe': patch
---

Treat `'*'` in the navigation integrations' `filteredParams` as every route and query parameter. When the route has parameters, metrics export `routeParams: {}` and `urlHidden: true`; a route with no parameters keeps its URL. Explicit lists of keys work as before.
