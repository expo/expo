---
'@expo/ui': patch
---

[iOS] Reduce the binary size of modifier options. Enums that only inline modifiers read are plain `String` enums instead of `Enumerable`, so they do not carry the JavaScript conversion conformances.
