---
'expo-router': patch
---

[Web] Fix `repeat()` from `usePreventRemove` after a blocked browser Back replacing the current history entry instead of returning to the entry the user chose, which left Forward with nothing to open.
