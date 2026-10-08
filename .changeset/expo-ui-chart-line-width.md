---
'@expo/ui': patch
---

[iOS] Fix `Chart` ignoring `lineStyle.width` on line charts. The line mark applied `.lineStyle` twice (once for the dash pattern, once for the width), and the first one wins, so lines always rendered at 1 pt. The width and the dash pattern are now set in one `StrokeStyle`.
