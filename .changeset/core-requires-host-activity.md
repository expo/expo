---
'expo-modules-core': patch
---

Add `RequiresHostActivity<T>()` to the Android module definition DSL and `requireHostActivity<T>()` on `Module` and `AppContext`. A module declares the host Activity class it needs, for example `FragmentActivity`. Core logs an actionable error as soon as the host does not match, and the helper throws `Exceptions.UnsupportedHostActivity` when a function needs that host.
