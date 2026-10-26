---
'@expo/ui': patch
---

[Android] Let a tap on plain content in a non-root `RNHostView` reach a parent Compose `clickable`. Hosted content that handles the press natively, like a `Pressable`, a `Text` with `onPress`, a text input or a gesture handler button, still keeps it. Content that only handles touches in JavaScript, like `PanResponder` or `onTouchStart`, now also triggers the parent `clickable`.
