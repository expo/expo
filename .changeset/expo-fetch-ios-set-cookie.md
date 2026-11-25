---
"expo": patch
---

[iOS] Fix `expo/fetch` returning repeated `Set-Cookie` headers as a single comma-joined value. Preserve the original cookie values and attributes when splitting them into separate entries.
