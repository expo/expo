---
'@expo/ui': patch
---

[Android] Fix the universal `BottomSheet` and the community `BottomSheet` / `BottomSheetModal` not opening inside a `FlatList` (or another view with `removeClippedSubviews`). Sheets now present from a root attached to the activity, like React Native's `Modal`, and the community sheet takes its content width from the sheet instead of the window.
