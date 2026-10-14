---
'expo-modules-core': patch
---

[iOS] Fix `measure()` and `measureInWindow()` reporting a wrong position for React Native views hosted inside a SwiftUI container with more than one laid-out child, such as the second and later pages of `@expo/ui`'s `PagerView`. Yoga stacks the SwiftUI views' shadow nodes in a column it never draws, and the measurement walk added those fictional origins; shadow nodes of SwiftUI virtual views now cancel their own Yoga origin, so only the content origin published relative to the `Host` remains.
