---
'@expo/ui': patch
---

Universal `Row` and `Column` on iOS resolve a child `width` or `height` percentage, such as `'50%'`, against their own size. The default `spacing` of a universal `Row` or `Column` on iOS is now `0`, as on Android and web.
