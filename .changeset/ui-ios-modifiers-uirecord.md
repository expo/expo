---
'@expo/ui': patch
---

[iOS] Reduce the binary size of modifiers. Modifiers adopt the smaller `UIRecord` protocol instead of `Record`, because JavaScript does not pass or receive them as values.
