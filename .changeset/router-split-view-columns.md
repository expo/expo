---
'expo-router': minor
---

[iOS] Add the `splitViewColumnName` navigation option and the `useSplitView` hook to choose the column that a collapsed `SplitView` shows.

Behavior changes on iOS: `SplitView` keeps only the current route, so `router.push` replaces the route and `router.back()` no longer goes back between `SplitView` routes. `topColumnForCollapsing` is read on the first render only.
