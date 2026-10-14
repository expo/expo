---
'@expo/ui': patch
---

[Android] Fix the universal `ListItem` ignoring `testID`. The prop was never passed to Compose, so end-to-end tools such as Maestro could not find list rows on Android. It is now applied as the `testID` modifier, like the universal `Button` and `Checkbox` do.
