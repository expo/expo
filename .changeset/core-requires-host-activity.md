---
'expo-modules-core': patch
---

Add `RequiresHostActivity<T>(feature)` to the Android module definition DSL and `requireHostActivity<T>()` on `Module` and `AppContext`. A module declares the host Activity class it needs, for example `FragmentActivity`, and can name the feature that needs it. Core reports a mismatch as soon as the host is known: an error for the whole module, or a warning that names the feature. The helper throws `Exceptions.UnsupportedHostActivity` when a function needs that host.
