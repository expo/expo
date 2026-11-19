---
'expo-router': patch
---

Fix `useHeaderHeight()` in native stack first returning the pre-Liquid Glass estimate on iOS 26+, which made content under a transparent header jump on push.
