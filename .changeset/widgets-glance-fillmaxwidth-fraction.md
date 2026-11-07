---
'expo-widgets': patch
---

[Android] Fix widgets ignoring the `fillMaxWidth` fraction. A layout asking for half the widget width now renders at half width instead of full width, so sibling content beside it stays visible.
