---
'@expo/ui': patch
---

[Android] Fix screen readers announcing a labeled universal `Switch` or `Checkbox` as an unnamed control. The label and the control are now one toggleable node with the `switch` or `checkbox` role, the whole row toggles, and the layout and 48 dp touch size stay the same. The `toggleable` modifier accepts an `enabled` option, and the Jetpack Compose `Switch` is not interactive on its own when `onCheckedChange` is omitted, like `Checkbox`.
