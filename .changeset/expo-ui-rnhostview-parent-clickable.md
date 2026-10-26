---
'@expo/ui': patch
---

[Android] Let a tap on plain content in a non-root `RNHostView` reach a parent Compose `clickable`. Hosted content that handles the press natively, like a `Pressable`, a `Text` with `onPress`, a link, a text input or a gesture handler button, still keeps it. Content that only handles touches in JavaScript, like `PanResponder` or `onTouchStart`, now also triggers the parent `clickable`, and gets a touch cancel. So does a disabled `Touchable` or one with only `onLongPress`, because React Native doesn't mark it clickable.
