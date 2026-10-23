---
'@expo/ui': patch
---

Add `List.ForEach` to the universal `List`. It renders rows from `data` and recycles them on Android, iOS, and web. The web `List` now fills its parent, so it scrolls.
