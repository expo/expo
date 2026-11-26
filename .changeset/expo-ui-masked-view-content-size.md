---
'@expo/ui': patch
---

Fix `MaskedView` rendering nothing when `style` doesn't size it, and ignoring child layout styles such as `flexDirection` and `padding`.
