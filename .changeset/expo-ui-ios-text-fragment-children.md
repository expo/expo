---
'@expo/ui': patch
---

[iOS] Fix the SwiftUI `Text` dropping nested `Text` spans and strings that are inside a React fragment. `Text` now flattens fragment children before it concatenates them.
