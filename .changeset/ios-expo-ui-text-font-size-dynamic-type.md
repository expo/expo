---
'@expo/ui': patch
---

[iOS] Universal `Text` scales `textStyle.fontSize`, `fontWeight` and `lineHeight` with the system text size (Dynamic Type), as React Native `Text` does. The `font` modifier applies `size` relative to `textStyle` for the system font, where the size was ignored, and `lineSpacing` takes a `textStyle` to scale with.
