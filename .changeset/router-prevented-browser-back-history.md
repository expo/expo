---
'expo-router': patch
---

Fix the browser history entry being overwritten on web when a browser Back blocked by `usePreventRemove` is continued with `repeat()` or by dispatching the blocked action.
