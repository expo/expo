---
'@expo/ui': patch
---

[Android] Fix a `Pressable` (or any JS responder) being cancelled when a `MaskedView`, or any other component that renders a `Host`, is laid over it. Once React Native grants the JS responder, the responder's view intercepts the touch stream and sends `ACTION_CANCEL` to its native children, including that `Host`. The `Host` reported this cancel as Compose claiming the gesture, which cancelled the press it belonged to. Holds longer than about 30 ms never fired `onPress`.
