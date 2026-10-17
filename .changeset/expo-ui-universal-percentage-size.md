---
'@expo/ui': patch
---

Universal `style.width` and `style.height` accept a percentage of a universal `Row`, `Column`, or `Host`, such as `'50%'`, on Android and iOS.

On web, a `Column` or `Row` with a width no longer stretches, so parent alignment can place it.
