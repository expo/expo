---
'expo-modules-core': patch
---

Accept any `androidx.activity.ComponentActivity` as the host Activity on Android. The host no longer needs to extend `AppCompatActivity`. Add `HostActivity`, `HostActivityAware`, and `Exceptions.UnsupportedHostActivity`.
