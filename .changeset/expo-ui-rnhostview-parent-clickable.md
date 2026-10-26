---
'@expo/ui': patch
---

[Android] Let a tap on plain content in a non-root `RNHostView` reach a parent Compose `clickable`. Hosted content that handles the press, like a `Pressable`, still keeps it.
