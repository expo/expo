---
'expo-updates': patch
---

[Android] Fix `setUpdateRequestHeadersOverride` throwing and disabling updates on the next launch when `disableAntiBrickingMeasures` is enabled and no update URL override is set. The embedded update URL is now used, as on iOS.
